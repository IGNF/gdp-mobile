import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'path'
import createHttpsProxyAgent from 'https-proxy-agent'
import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

const appRoot = __dirname
const requireFromApp = createRequire(path.join(appRoot, 'package.json'))

/** Monorepo local : préférer la résolution racine (évite un stub git incomplet dans gdp-mobile/node_modules). */
function createPackageResolver(): NodeRequire {
  const monorepoPkgJson = path.resolve(appRoot, '..', 'package.json')
  if (existsSync(monorepoPkgJson)) {
    const monorepoRequire = createRequire(monorepoPkgJson)
    try {
      monorepoRequire.resolve('@ign/gdp-tools')
      return monorepoRequire
    } catch {
      /* dépôt gdp-mobile seul */
    }
  }
  return requireFromApp
}

const packageResolver = createPackageResolver()

function resolveInstalledPackageDir(packageName: string): string {
  let dir = path.dirname(packageResolver.resolve(packageName))
  while (dir !== path.dirname(dir)) {
    const pkgJsonPath = path.join(dir, 'package.json')
    if (existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as { name?: string }
      if (pkg.name === packageName) {
        return dir
      }
    }
    dir = path.dirname(dir)
  }
  throw new Error(`Répertoire npm introuvable pour ${packageName}`)
}

const capacitorGeolocationRoot = resolveInstalledPackageDir('@capacitor/geolocation')
const capacitorCoreRoot = resolveInstalledPackageDir('@capacitor/core')
const capacitorDeviceRoot = resolveInstalledPackageDir('@capacitor/device')
const capacitorBrowserRoot = resolveInstalledPackageDir('@capacitor/browser')
const capacitorFilesystemRoot = resolveInstalledPackageDir('@capacitor/filesystem')
const capacitorPreferencesRoot = resolveInstalledPackageDir('@capacitor/preferences')
const capacitorAppRoot = resolveInstalledPackageDir('@capacitor/app')
const gdpToolsRoot = resolveInstalledPackageDir('@ign/gdp-tools')

const appPackage = JSON.parse(
  readFileSync(path.join(__dirname, 'package.json'), 'utf8'),
) as { version?: string }
const appVersion = appPackage.version ?? '4.0.0'

const oauthDevProxyPrefix = '/__sso'

function normalizeOAuthBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) {
      return trimmed
    }
  }
  return undefined
}

/** Proxy sortant Node (Vite → sso.geopf.fr). Le navigateur n’en a pas besoin. */
function getOutboundHttpProxyUrl(fileEnv: Record<string, string> = {}): string | undefined {
  return firstNonEmpty(
    process.env.HTTPS_PROXY,
    process.env.https_proxy,
    process.env.HTTP_PROXY,
    process.env.http_proxy,
    fileEnv.HTTPS_PROXY,
    fileEnv.https_proxy,
    fileEnv.HTTP_PROXY,
    fileEnv.http_proxy,
  )
}

function getNoProxy(fileEnv: Record<string, string> = {}): string {
  return (
    firstNonEmpty(
      process.env.NO_PROXY,
      process.env.no_proxy,
      fileEnv.NO_PROXY,
      fileEnv.no_proxy,
    ) ?? ''
  )
}

function applyFileProxyEnv(fileEnv: Record<string, string>): void {
  const proxyUrl = getOutboundHttpProxyUrl(fileEnv)
  if (proxyUrl && !process.env.HTTPS_PROXY && !process.env.https_proxy) {
    process.env.HTTPS_PROXY = proxyUrl
    process.env.https_proxy = proxyUrl
    process.env.HTTP_PROXY ??= proxyUrl
    process.env.http_proxy ??= proxyUrl
  }

  const noProxy = firstNonEmpty(fileEnv.NO_PROXY, fileEnv.no_proxy)
  if (noProxy && !process.env.NO_PROXY && !process.env.no_proxy) {
    process.env.NO_PROXY = noProxy
    process.env.no_proxy = noProxy
  }
}

function hostnameMatchesNoProxy(hostname: string, noProxyRaw: string): boolean {
  const host = hostname.toLowerCase()

  return noProxyRaw.split(',').some((raw) => {
    const entry = raw.trim().toLowerCase()
    if (!entry) {
      return false
    }
    if (entry === '*') {
      return true
    }
    if (entry.startsWith('.')) {
      return host === entry.slice(1) || host.endsWith(entry)
    }
    return host === entry || host.endsWith(`.${entry}`)
  })
}

function stripOauthBrowserOriginPlugin(mount: string) {
  return {
    name: 'gdp-strip-oauth-origin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? ''
        if (url === mount || url.startsWith(`${mount}/`)) {
          delete req.headers.origin
          delete req.headers.referer
        }
        next()
      })
    },
  }
}

function createOauthProxyAgent(
  ssoTarget: string,
  fileEnv: Record<string, string> = {},
): ReturnType<typeof createHttpsProxyAgent> | undefined {
  const proxyUrl = getOutboundHttpProxyUrl(fileEnv)
  if (!proxyUrl) {
    console.warn(
      '[vite oauth proxy] HTTPS_PROXY absent — /__sso joint sso.geopf.fr en direct ' +
        '(ECONNREFUSED fréquent au bureau IGN). Ajoutez HTTPS_PROXY dans gdp-mobile/.env ' +
        'ou exportez-le avant npm run dev. Le navigateur / SSO n’a pas besoin de ce proxy.',
    )
    return undefined
  }

  let hostname: string
  try {
    hostname = new URL(ssoTarget).hostname
  } catch {
    return undefined
  }

  const noProxy = getNoProxy(fileEnv)
  if (hostnameMatchesNoProxy(hostname, noProxy)) {
    console.info(`[vite oauth proxy] ${hostname} est dans NO_PROXY — connexion directe`)
    return undefined
  }

  console.info(`[vite oauth proxy] ${hostname} via ${proxyUrl}`)
  return createHttpsProxyAgent(proxyUrl)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  applyFileProxyEnv(env)
  const oauthSsoTarget = normalizeOAuthBaseUrl(
    env.VITE_OAUTH_BASE_URL || 'https://sso.geopf.fr/realms/geoplateforme/protocol/openid-connect',
  )

  const basePath = env.VITE_BASE_PATH || '/'
  const oauthProxyMount = `${basePath.replace(/\/+$/, '')}${oauthDevProxyPrefix}`
  const oauthProxyAgent = createOauthProxyAgent(oauthSsoTarget, env)

  return {
    base: basePath,
    plugins: [react(), svgr(), stripOauthBrowserOriginPlugin(oauthProxyMount)],
    define: {
      'process.env.SECRET': JSON.stringify(env.VITE_SECRET || 'default-secret'),
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    resolve: {
      alias: [
        { find: '@ign/gdp-tools/react', replacement: path.join(gdpToolsRoot, 'dist/react.js') },
        { find: '@ign/gdp-tools', replacement: path.join(gdpToolsRoot, 'dist/index.js') },
        { find: '@', replacement: path.resolve(__dirname, './src') },
        {
          find: '@capacitor/geolocation',
          replacement: path.join(capacitorGeolocationRoot, 'dist/esm/index.js'),
        },
        { find: '@capacitor/core', replacement: path.join(capacitorCoreRoot, 'dist/index.js') },
        { find: '@capacitor/device', replacement: path.join(capacitorDeviceRoot, 'dist/esm/index.js') },
        { find: '@capacitor/browser', replacement: path.join(capacitorBrowserRoot, 'dist/esm/index.js') },
        {
          find: '@capacitor/filesystem',
          replacement: path.join(capacitorFilesystemRoot, 'dist/esm/index.js'),
        },
        {
          find: '@capacitor/preferences',
          replacement: path.join(capacitorPreferencesRoot, 'dist/esm/index.js'),
        },
        { find: '@capacitor/app', replacement: path.join(capacitorAppRoot, 'dist/esm/index.js') },
      ],
      dedupe: ['ol', 'react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        '@capacitor/geolocation',
        '@capacitor/core',
        '@capacitor/device',
        '@capacitor/browser',
        '@capacitor/filesystem',
        '@capacitor/preferences',
        '@capacitor/app',
        'collaboratif-client-api',
        'axios',
      ],
    },
    build: {
      commonjsOptions: {
        include: [/collaboratif-client-api/, /node_modules/],
        transformMixedEsModules: true,
      },
    },
    server: {
      proxy: {
        [oauthProxyMount]: {
          target: oauthSsoTarget,
          changeOrigin: true,
          secure: true,
          agent: oauthProxyAgent,
          timeout: 30_000,
          proxyTimeout: 30_000,
          rewrite: (requestPath) =>
            requestPath.replace(
              new RegExp(`^${oauthProxyMount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
              '',
            ),
          configure: (proxy) => {
            proxy.on('error', (err, _req, res) => {
              console.error('[vite oauth proxy]', err.message);
              const socket = res as {
                writeHead?: (statusCode: number, headers?: Record<string, string>) => void
                end?: (chunk?: string) => void
                headersSent?: boolean
              }
              if (socket && typeof socket.writeHead === 'function' && !socket.headersSent) {
                socket.writeHead(502, { 'Content-Type': 'application/json' });
                socket.end?.(
                  JSON.stringify({
                    error: 'bad_gateway',
                    error_description: `Proxy OAuth indisponible: ${err.message}`,
                  }),
                );
              }
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              const requestUrl = req.url ?? '';
              if (requestUrl.includes('/token') || requestUrl.includes('/revoke')) {
                console.info(`[vite oauth proxy] ${req.method} ${requestUrl} → ${proxyRes.statusCode}`);
              }
            });
          },
        },
      },
    },
  }
})
