import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'path'
import createHttpsProxyAgent from 'https-proxy-agent'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

const repoRoot = path.resolve(__dirname, '..')
const requireFromWorkspace = createRequire(path.join(repoRoot, 'package.json'))

function resolveWorkspacePackageDir(packageName: string): string {
  return path.dirname(requireFromWorkspace.resolve(`${packageName}/package.json`))
}

const capacitorGeolocationRoot = resolveWorkspacePackageDir('@capacitor/geolocation')
const capacitorCoreRoot = resolveWorkspacePackageDir('@capacitor/core')
const capacitorDeviceRoot = resolveWorkspacePackageDir('@capacitor/device')
const capacitorBrowserRoot = resolveWorkspacePackageDir('@capacitor/browser')
const capacitorFilesystemRoot = resolveWorkspacePackageDir('@capacitor/filesystem')
const capacitorPreferencesRoot = resolveWorkspacePackageDir('@capacitor/preferences')
const capacitorAppRoot = resolveWorkspacePackageDir('@capacitor/app')

const geodesyPackageRoot = path.resolve(__dirname, '../gdp-tools')
const useGeodesySourceAlias = process.env.VITE_GEODESY_SOURCE !== 'dist'
const appPackage = JSON.parse(
  readFileSync(path.join(__dirname, 'package.json'), 'utf8'),
) as { version?: string }
const appVersion = appPackage.version ?? '0.0.0'

const oauthDevProxyPrefix = '/__sso'

function normalizeOAuthBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

function getOutboundHttpProxyUrl(): string | undefined {
  const value =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
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

function createOauthProxyAgent(ssoTarget: string): ReturnType<typeof createHttpsProxyAgent> | undefined {
  const proxyUrl = getOutboundHttpProxyUrl()
  if (!proxyUrl) {
    return undefined
  }

  let hostname = ''
  try {
    hostname = new URL(ssoTarget).hostname
  } catch {
    return undefined
  }

  const noProxy = process.env.NO_PROXY || process.env.no_proxy || ''
  if (hostnameMatchesNoProxy(hostname, noProxy)) {
    console.info(`[vite oauth proxy] ${hostname} est dans NO_PROXY — connexion directe`)
    return undefined
  }

  console.info(`[vite oauth proxy] ${hostname} via ${proxyUrl}`)
  return createHttpsProxyAgent(proxyUrl)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const oauthSsoTarget = normalizeOAuthBaseUrl(
    env.VITE_OAUTH_BASE_URL || 'https://sso.geopf.fr/realms/geoplateforme/protocol/openid-connect',
  )

  const basePath = env.VITE_BASE_PATH || '/'
  const oauthProxyMount = `${basePath.replace(/\/+$/, '')}${oauthDevProxyPrefix}`
  const oauthProxyAgent = createOauthProxyAgent(oauthSsoTarget)

  return {
    base: basePath,
    plugins: [react(), svgr()],
    define: {
      'process.env.SECRET': JSON.stringify(env.VITE_SECRET || 'default-secret'),
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@capacitor/geolocation': path.join(capacitorGeolocationRoot, 'dist/esm/index.js'),
        '@capacitor/core': path.join(capacitorCoreRoot, 'dist/index.js'),
        '@capacitor/device': path.join(capacitorDeviceRoot, 'dist/esm/index.js'),
        '@capacitor/browser': path.join(capacitorBrowserRoot, 'dist/esm/index.js'),
        '@capacitor/filesystem': path.join(capacitorFilesystemRoot, 'dist/esm/index.js'),
        '@capacitor/preferences': path.join(capacitorPreferencesRoot, 'dist/esm/index.js'),
        '@capacitor/app': path.join(capacitorAppRoot, 'dist/esm/index.js'),
        ...(useGeodesySourceAlias
          ? {
              '@ign/gdp-tools': path.resolve(geodesyPackageRoot, 'src'),
              '@ign/gdp-tools/react': path.resolve(geodesyPackageRoot, 'src/react.ts'),
            }
          : {}),
      },
      dedupe: ['ol', 'react', 'react-dom'],
    },
    optimizeDeps: {
      exclude: ['@ign/gdp-tools'],
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
      fs: {
        allow: [geodesyPackageRoot, path.resolve(__dirname, '..')],
      },
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
              const socket = res as { writeHead?: Function; end?: Function; headersSent?: boolean };
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
          },
        },
      },
    },
  }
})
