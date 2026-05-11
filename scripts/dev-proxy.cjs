/* eslint-disable no-console */
/**
 * Dev-only reverse proxy.
 *
 * 解决 UMI dev server 在多个 `ws: true` 代理 + HMR 同时存在时
 * upgrade 事件挂载不稳、容器 WebShell 无法建立 WebSocket 的问题。
 *
 *   浏览器 ──▶ http://localhost:DEV_PROXY_PORT
 *               ├─ HTTP / HMR ws        ─▶ UMI dev server (UMI_TARGET)
 *               └─ /kapi/ /kapis/ ws    ─▶ 后端 (BACKEND_TARGET)
 *
 * 入口端口与 UMI 同源，HttpOnly cookie 无跨域问题。
 */

const http = require('node:http');
const httpProxy = require('http-proxy');

const FRONT_PORT = Number(process.env.DEV_PROXY_PORT || 9527);
const UMI_TARGET = process.env.UMI_TARGET || 'http://127.0.0.1:9528';
const BACKEND_TARGET = process.env.BACKEND_TARGET || 'http://127.0.0.1:8000';
const WS_BACKEND_PREFIXES = (
  process.env.DEV_PROXY_WS_PREFIXES || '/kapi/,/kapis/'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const umiProxy = httpProxy.createProxyServer({
  target: UMI_TARGET,
  changeOrigin: true,
  ws: true,
  xfwd: true,
});

const backendProxy = httpProxy.createProxyServer({
  target: BACKEND_TARGET,
  changeOrigin: true,
  ws: true,
  xfwd: true,
});

const onHttpError = (label) => (err, _req, res) => {
  console.error(`[dev-proxy:${label}] http error: ${err.message}`);
  if (!res || res.headersSent) {
    return;
  }
  try {
    res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`dev-proxy upstream error (${label}): ${err.message}`);
  } catch (_writeError) {
    // ignore
  }
};

const onWsError = (label) => (err, _req, socket) => {
  console.error(`[dev-proxy:${label}] ws error: ${err.message}`);
  if (socket && !socket.destroyed) {
    socket.destroy();
  }
};

umiProxy.on('error', onHttpError('umi'));
backendProxy.on('error', onHttpError('backend'));

umiProxy.on('econnreset', onWsError('umi'));
backendProxy.on('econnreset', onWsError('backend'));

const matchesBackendWs = (url) => {
  if (!url) {
    return false;
  }
  return WS_BACKEND_PREFIXES.some((prefix) => url.startsWith(prefix));
};

const server = http.createServer((req, res) => {
  umiProxy.web(req, res, undefined, onHttpError('umi'));
});

server.on('upgrade', (req, socket, head) => {
  const target = matchesBackendWs(req.url) ? 'backend' : 'umi';
  const proxy = target === 'backend' ? backendProxy : umiProxy;

  socket.on('error', (err) => {
    console.error(`[dev-proxy:${target}] socket error: ${err.message}`);
  });

  proxy.ws(req, socket, head, undefined, onWsError(target));
});

server.on('clientError', (err, socket) => {
  console.error(`[dev-proxy] client error: ${err.message}`);
  if (socket && !socket.destroyed) {
    socket.destroy();
  }
});

server.listen(FRONT_PORT, () => {
  console.log(`[dev-proxy] listening   : http://127.0.0.1:${FRONT_PORT}`);
  console.log(`[dev-proxy] http -> umi : ${UMI_TARGET}`);
  console.log(
    `[dev-proxy] ws   -> api : ${BACKEND_TARGET} (${WS_BACKEND_PREFIXES.join(', ')})`,
  );
  console.log(`[dev-proxy] ws   -> umi : ${UMI_TARGET} (HMR & other)`);
});

const shutdown = (signal) => {
  console.log(`[dev-proxy] received ${signal}, closing...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
