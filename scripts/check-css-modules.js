#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(SCRIPT_DIR, '..');
const SRC_DIR = path.join(PACKAGE_ROOT, 'src');
const ROOT = path.resolve(process.argv[2] || SRC_DIR);

const SOURCE_EXTENSIONS = new Set([
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
]);

const IGNORE_DIRS = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
]);

const cssModules = new Map();
const unresolvedImports = [];

/**
 * Retourne tous les fichiers d'un dossier récursivement.
 */
function walk(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`Dossier introuvable : ${dir}`);
        process.exit(1);
    }

    const files = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (IGNORE_DIRS.has(entry.name)) {
            continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...walk(fullPath));
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Supprime un préfixe suivi d'un bloc équilibré, ex. :global(...) ou url("...").
 */
function stripPrefixedBalanced(content, prefixRegex, open, close) {
    let result = '';
    let lastIndex = 0;
    prefixRegex.lastIndex = 0;

    let match;

    while ((match = prefixRegex.exec(content)) !== null) {
        const openAt = match.index + match[0].length - 1;
        let depth = 1;
        let i = openAt + 1;

        while (i < content.length && depth > 0) {
            const ch = content[i];

            if (ch === open) {
                depth++;
            } else if (ch === close) {
                depth--;
            }

            i++;
        }

        result += content.slice(lastIndex, match.index);
        lastIndex = i;
        prefixRegex.lastIndex = i;
    }

    return result + content.slice(lastIndex);
}

/**
 * Supprime grossièrement les commentaires CSS.
 */
function removeCssComments(content) {
    return content.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Supprime url(...) pour ne pas extraire de faux .org / .svg.
 */
function stripCssUrls(content) {
    let result = content.replace(
        /url\(\s*(['"])[\s\S]*?\1\s*\)/g,
        'url()'
    );

    result = stripPrefixedBalanced(result, /url\s*\(/g, '(', ')');

    return result;
}

/**
 * Supprime :global(...) et :global { ... } (classes OpenLayers, etc.).
 */
function stripCssGlobals(content) {
    let result = stripPrefixedBalanced(content, /:global\s*\(/g, '(', ')');
    result = stripPrefixedBalanced(result, /:global\s*\{/g, '{', '}');
    return result;
}

/**
 * Extrait les classes définies dans un module CSS.
 *
 * Ex:
 * .foo {}
 * .foo:hover {}
 * .foo.bar {}
 *
 * => foo, bar
 */
function extractCssClasses(content) {
    content = stripCssGlobals(stripCssUrls(removeCssComments(content)));

    const classes = new Set();

    // On récupère les .classe
    //
    // Supporte notamment :
    // .foo
    // .foo-bar
    // .foo_bar
    //
    const regex = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g;

    let match;

    while ((match = regex.exec(content)) !== null) {
        classes.add(match[1]);
    }

    return classes;
}

/**
 * Résout un import CSS module, y compris l'alias Vite/TS `@/` → `src/`.
 */
function resolveCssImport(sourceFile, cssImport) {
    if (cssImport.startsWith('@/')) {
        return path.resolve(SRC_DIR, cssImport.slice(2));
    }

    return path.resolve(path.dirname(sourceFile), cssImport);
}

/**
 * Supprime commentaires // et /* *\/ sans trop casser les URL http://.
 */
function removeJsComments(content) {
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:\/])\/\/.*$/gm, '$1');
}

/**
 * Extrait les imports CSS modules.
 *
 * Ex:
 * import styles from './Button.module.css'
 * import classes from "./foo.module.css";
 * import screen from '@/shared/styles/screen.module.css'
 */
function extractModuleImports(content) {
    const imports = [];

    const regex =
        /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+\.module\.css)['"]/g;

    let match;

    while ((match = regex.exec(content)) !== null) {
        imports.push({
            variable: match[1],
            file: match[2],
        });
    }

    return imports;
}

/**
 * Escape pour utilisation dans une RegExp.
 */
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Littéraux string des alias de types (`type Foo = 'a' | 'b'`).
 * Sert à résoudre styles[color] / styles[size] dans le même fichier.
 */
function extractTypeStringLiterals(content) {
    const literals = new Set();
    const typeAlias =
        /(?:export\s+)?type\s+[A-Za-z_$][\w$]*\s*=\s*([^;{]+)/g;

    let match;

    while ((match = typeAlias.exec(content)) !== null) {
        const litRegex = /['"]([^'"]+)['"]/g;
        let litMatch;

        while ((litMatch = litRegex.exec(match[1])) !== null) {
            const value = litMatch[1];

            if (/^-?[_a-zA-Z][_a-zA-Z0-9-]*$/.test(value)) {
                literals.add(value);
            }
        }
    }

    return literals;
}

/**
 * Classes visées par un accès dynamique styles[ident], via unions TS
 * et valeurs par défaut (`size = 'md'`).
 */
function extractDynamicClasses(content, variable) {
    const classes = new Set();
    const escaped = escapeRegex(variable);
    const dynamicRegex = new RegExp(
        `(?<![.\\w/])${escaped}\\s*\\[\\s*([A-Za-z_$][\\w$]*)\\s*\\]`,
        'g'
    );

    const keys = new Set();
    let match;

    while ((match = dynamicRegex.exec(content)) !== null) {
        keys.add(match[1]);
    }

    if (keys.size === 0) {
        return classes;
    }

    for (const literal of extractTypeStringLiterals(content)) {
        classes.add(literal);
    }

    for (const key of keys) {
        const defaultRegex = new RegExp(
            `\\b${escapeRegex(key)}\\s*=\\s*['"]([^'"]+)['"]`,
            'g'
        );

        while ((match = defaultRegex.exec(content)) !== null) {
            classes.add(match[1]);
        }
    }

    return classes;
}

/**
 * Cherche toutes les utilisations d'une variable CSS module.
 *
 * styles.foo
 * styles?.foo
 * styles['foo']
 * styles["foo"]
 * styles[color]  (via unions TS / défauts du fichier)
 */
function extractUsedClasses(content, variable) {
    const classes = new Set();
    const escaped = escapeRegex(variable);

    // styles.foo  /  styles?.foo
    // Lookbehind : ignorer les chemins du type .../screen.module.css
    const dotRegex = new RegExp(
        `(?<![.\\w/])${escaped}\\??\\.([A-Za-z_$][\\w$-]*)`,
        'g'
    );

    let match;

    while ((match = dotRegex.exec(content)) !== null) {
        classes.add(match[1]);
    }

    // styles['foo']
    // styles["foo"]
    const bracketRegex = new RegExp(
        `(?<![.\\w/])${escaped}\\s*\\[\\s*['"]([^'"]+)['"]\\s*\\]`,
        'g'
    );

    while ((match = bracketRegex.exec(content)) !== null) {
        classes.add(match[1]);
    }

    for (const className of extractDynamicClasses(content, variable)) {
        classes.add(className);
    }

    return classes;
}

function markClassUsage(module, className, sourceFile) {
    module.used.add(className);

    if (!module.defined.has(className)) {
        if (!module.missing.has(className)) {
            module.missing.set(className, new Set());
        }

        module.missing.get(className).add(sourceFile);
    }
}

/**
 * Noms de classes écrits en string globale dans le JSX.
 *
 * className="text-error"
 * className={'foo bar'}
 * className={`foo ${x}`}
 */
function extractLiteralClassNames(content) {
    const names = new Set();

    function addFromClassString(value) {
        for (const token of value.split(/\s+/)) {
            if (/^-?[_a-zA-Z][_a-zA-Z0-9-]*$/.test(token)) {
                names.add(token);
            }
        }
    }

    const quoted = /className\s*=\s*(?:\{\s*)?['"]([^'"]+)['"]\s*\}?/g;
    let match;

    while ((match = quoted.exec(content)) !== null) {
        addFromClassString(match[1]);
    }

    const template = /className\s*=\s*\{\s*`([^`]*)`\s*\}/g;

    while ((match = template.exec(content)) !== null) {
        addFromClassString(match[1].replace(/\$\{[^}]*\}/g, ' '));
    }

    return names;
}

function createCssModuleRecord(file, content) {
    return {
        file,
        defined: extractCssClasses(content),
        used: new Set(),
        importedBy: new Set(),
        missing: new Map(),
        globalStrings: new Map(),
    };
}

/**
 * Affichage relatif au dossier courant.
 */
function relative(file) {
    return path.relative(process.cwd(), file);
}

/**
 * Initialisation des fichiers CSS modules.
 */
const files = walk(ROOT);

for (const file of files) {
    if (!file.endsWith('.module.css')) {
        continue;
    }

    const content = fs.readFileSync(file, 'utf8');

    cssModules.set(path.resolve(file), createCssModuleRecord(file, content));
}

/**
 * Analyse JS / JSX / TS / TSX
 */
for (const sourceFile of files) {
    const extension = path.extname(sourceFile);

    if (!SOURCE_EXTENSIONS.has(extension)) {
        continue;
    }

    const rawContent = fs.readFileSync(sourceFile, 'utf8');
    const content = removeJsComments(rawContent);
    const imports = extractModuleImports(content);

    for (const cssImport of imports) {
        const cssFile = resolveCssImport(sourceFile, cssImport.file);

        /*
         * Import d'un module inexistant.
         */
        if (!fs.existsSync(cssFile)) {
            unresolvedImports.push({
                sourceFile,
                variable: cssImport.variable,
                file: cssImport.file,
            });

            continue;
        }

        /*
         * Le fichier peut être hors du ROOT analysé.
         */
        if (!cssModules.has(cssFile)) {
            const cssContent = fs.readFileSync(cssFile, 'utf8');

            cssModules.set(cssFile, createCssModuleRecord(cssFile, cssContent));
        }

        const module = cssModules.get(cssFile);

        module.importedBy.add(sourceFile);

        const usedClasses = extractUsedClasses(
            content,
            cssImport.variable
        );

        for (const className of usedClasses) {
            markClassUsage(module, className, sourceFile);
        }

        /*
         * className="text-error" vise une classe du module importé
         * sans passer par l'objet styles — le hash CSS module ne s'applique pas.
         */
        for (const className of extractLiteralClassNames(content)) {
            if (
                !module.defined.has(className) ||
                usedClasses.has(className)
            ) {
                continue;
            }

            module.used.add(className);

            if (!module.globalStrings.has(className)) {
                module.globalStrings.set(className, new Set());
            }

            module.globalStrings.get(className).add(sourceFile);
        }
    }
}

/**
 * Rapport
 */

let unusedCount = 0;
let missingCount = 0;
let unimportedCount = 0;
let globalStringCount = 0;

console.log('\n==========================================');
console.log(' Vérification CSS Modules');
console.log('==========================================');
console.log(`Dossier : ${ROOT}\n`);

if (unresolvedImports.length > 0) {
    for (const item of unresolvedImports) {
        console.log(
            `❌ CSS MODULE INTROUVABLE\n` +
            `   ${relative(item.sourceFile)}\n` +
            `   import ${item.variable} from '${item.file}'\n`
        );
    }
}

for (const module of [...cssModules.values()].sort((a, b) =>
    a.file.localeCompare(b.file)
)) {
    const unused = [...module.defined]
        .filter(className => !module.used.has(className))
        .sort();

    const missing = [...module.missing.keys()].sort();
    const globalStrings = [...module.globalStrings.keys()].sort();

    if (
        unused.length === 0 &&
        missing.length === 0 &&
        globalStrings.length === 0 &&
        module.importedBy.size > 0
    ) {
        continue;
    }

    console.log(`\n📄 ${relative(module.file)}`);

    /*
     * Module jamais importé
     */
    if (module.importedBy.size === 0) {
        console.log('   ⚠️  Module CSS jamais importé');
        unimportedCount++;
    }

    /*
     * Classe du module écrite en string globale (className="foo").
     */
    if (globalStrings.length > 0) {
        console.log(
            '\n   ⚠️  Classes du module utilisées en string globale :\n' +
            '      (className="foo" n’applique pas le hash CSS module,' +
            ' utiliser styles.foo ou styles[\'foo\'])'
        );

        for (const className of globalStrings) {
            console.log(`      .${className}`);

            for (const sourceFile of module.globalStrings.get(className)) {
                console.log(`         ↳ ${relative(sourceFile)}`);
            }

            globalStringCount++;
        }
    }

    /*
     * Classes CSS inutilisées
     */
    if (unused.length > 0) {
        console.log('\n   🟡 Classes définies mais non utilisées :');

        for (const className of unused) {
            console.log(`      .${className}`);
            unusedCount++;
        }
    }

    /*
     * Classes JS absentes du CSS
     */
    if (missing.length > 0) {
        console.log('\n   🔴 Classes utilisées mais absentes du CSS :');

        for (const className of missing) {
            console.log(`      ${className}`);

            const sourceFiles = module.missing.get(className);

            for (const sourceFile of sourceFiles) {
                console.log(
                    `         ↳ ${relative(sourceFile)}`
                );
            }

            missingCount++;
        }
    }
}

console.log('\n==========================================');
console.log(' Résumé');
console.log('==========================================');

console.log(`🟡 Classes CSS inutilisées : ${unusedCount}`);
console.log(`🔴 Classes CSS absentes    : ${missingCount}`);
console.log(`⚠️  Modules non importés    : ${unimportedCount}`);
console.log(`⚠️  Strings globales        : ${globalStringCount}`);
console.log(`❌ Modules introuvables     : ${unresolvedImports.length}`);

if (
    unusedCount === 0 &&
    missingCount === 0 &&
    unimportedCount === 0 &&
    globalStringCount === 0 &&
    unresolvedImports.length === 0
) {
    console.log('\n✅ Aucun problème détecté.');
} else {
    console.log('');
}

/*
 * Code retour != 0 uniquement s'il existe
 * des références vers des classes / fichiers inexistants.
 *
 * Pratique pour CI / npm test.
 */
process.exitCode =
    missingCount > 0 || unresolvedImports.length > 0 ? 1 : 0;
