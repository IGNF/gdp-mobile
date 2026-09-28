#!/usr/bin/env node
/**
 * Tableau des dépendances directes de production (prod-dependencies.md).
 *
 *   node scripts/write-prod-dependencies.js
 *   node scripts/write-prod-dependencies.js --check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_JSON = path.join(APP_DIR, 'package.json');
const OUTPUT = path.join(APP_DIR, 'prod-dependencies.md');

function findPackageJson(name) {
  const candidates = [
    path.join(APP_DIR, 'node_modules', name, 'package.json'),
    path.join(APP_DIR, '..', 'node_modules', name, 'package.json'),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(`Paquet installé introuvable : ${name}. Lancez npm install.`);
  }
  return found;
}

function normalizeRepoUrl(url) {
  if (!url) return '';
  let normalized = String(url).trim().replace(/^git\+/, '');
  normalized = normalized.replace(/^git:\/\//, 'https://');
  normalized = normalized.replace(/^ssh:\/\/git@github\.com[:/]/, 'https://github.com/');
  normalized = normalized.replace(/^git@github\.com:/, 'https://github.com/');
  if (normalized.startsWith('github:')) {
    normalized = `https://github.com/${normalized.slice('github:'.length)}`;
  }
  const short = normalized.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (short) normalized = `https://github.com/${short[1]}/${short[2]}`;
  const hash = normalized.indexOf('#');
  if (hash !== -1) normalized = normalized.slice(0, hash);
  if (
    /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(normalized) &&
    !normalized.endsWith('.git')
  ) {
    normalized += '.git';
  }
  return normalized;
}

function repoUrl(pkg, spec) {
  const repo = pkg.repository;
  let url = '';
  if (typeof repo === 'string') url = repo;
  else if (repo && typeof repo === 'object') url = repo.url || '';
  const fromPackage = normalizeRepoUrl(url);
  if (fromPackage) return fromPackage;
  if (typeof spec === 'string' && /^(git\+|github:|git@|ssh:|https?:\/\/)/.test(spec)) {
    return normalizeRepoUrl(spec);
  }
  return '';
}

function authorText(author) {
  if (!author) return '';
  if (typeof author === 'string') return author.replace(/\s+/g, ' ').trim();
  const name = author.name || '';
  const email = author.email ? ` <${author.email}>` : '';
  const url = author.url ? ` (${author.url})` : '';
  return `${name}${email}${url}`.trim();
}

function licenseText(license) {
  if (!license) return '';
  if (typeof license === 'string') return license;
  if (Array.isArray(license)) return license.map(licenseText).filter(Boolean).join(' OR ');
  return license.type || '';
}

function cell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

export function renderProdDependencies() {
  const appPkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const rows = Object.keys(appPkg.dependencies ?? {})
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const spec = appPkg.dependencies[name];
      const pkg = JSON.parse(fs.readFileSync(findPackageJson(name), 'utf8'));
      return [
        cell(pkg.name || name),
        cell(licenseText(pkg.license)),
        cell(repoUrl(pkg, spec)),
        cell(pkg.version),
        cell(authorText(pkg.author)),
      ];
    });

  const headers = ['Name', 'License type', 'Link', 'Installed version', 'Author'];
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index].length)),
  );
  const pad = (value, width) => value.padEnd(width, ' ');
  const line = (values) => `| ${values.map((value, index) => pad(value, widths[index])).join(' | ')} |`;
  const separator = `| ${widths.map((width) => `:${'-'.repeat(width - 1)}`).join(' | ')} |`;
  return [line(headers), separator, ...rows.map(line)].join('\n') + '\n';
}

export function writeProdDependencies(output = OUTPUT) {
  const markdown = renderProdDependencies();
  fs.writeFileSync(output, markdown, 'utf8');
  return output;
}

function isMain() {
  const entry = process.argv[1];
  return Boolean(entry) && path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isMain()) {
  try {
    const check = process.argv.includes('--check');
    const markdown = renderProdDependencies();
    if (check) {
      const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
      if (current !== markdown) {
        console.error('prod-dependencies.md ne correspond pas aux paquets installés.');
        console.error('Régénérez-le avec : npm run deps:prod');
        process.exit(1);
      }
      console.log('prod-dependencies.md est à jour.');
    } else {
      writeProdDependencies();
      console.log(`prod-dependencies.md écrit (${path.relative(process.cwd(), OUTPUT)})`);
    }
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}
