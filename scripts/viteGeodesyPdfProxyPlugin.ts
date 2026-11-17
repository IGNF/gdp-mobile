import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';

function isAllowedGeodesyPdfFetchUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return false;
    }

    const host = url.hostname.toLowerCase();
    if (host === 'ign.fr' || host.endsWith('.ign.fr')) {
      return true;
    }
    if (host === 'geopf.fr' || host.endsWith('.geopf.fr')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function readQueryUrl(req: IncomingMessage): string | null {
  const rawUrl = req.url ?? '';
  const queryIndex = rawUrl.indexOf('?');
  if (queryIndex === -1) {
    return null;
  }

  const params = new URLSearchParams(rawUrl.slice(queryIndex + 1));
  const url = params.get('url')?.trim();
  return url || null;
}

async function handleGeodesyPdfProxy(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }

  const targetUrl = readQueryUrl(req);
  if (!targetUrl) {
    res.statusCode = 400;
    res.end('Paramètre url manquant');
    return;
  }

  if (!isAllowedGeodesyPdfFetchUrl(targetUrl)) {
    res.statusCode = 403;
    res.end('URL non autorisée');
    return;
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      redirect: 'follow',
      headers: {
        Accept: 'application/pdf,application/octet-stream,*/*',
        'User-Agent': 'Géodésie-de-poche/1.0 (PDF cart proxy)',
      },
    });

    res.statusCode = upstream.status;
    const contentType = upstream.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    if (!upstream.ok) {
      res.end(await upstream.text());
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy PDF indisponible';
    console.error('[vite geodesy pdf proxy]', message);
    res.statusCode = 502;
    res.end(message);
  }
}

/** Relais dev same-origin pour les fiches PDF (`/__gdp-pdf?url=…`). */
export function viteGeodesyPdfProxyPlugin(proxyMountPath: string): Plugin {
  const mount = proxyMountPath.replace(/\/+$/, '');

  return {
    name: 'vite-geodesy-pdf-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(mount, (req, res, next) => {
        void handleGeodesyPdfProxy(req, res, next);
      });
    },
  };
}
