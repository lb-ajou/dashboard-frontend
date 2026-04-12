import { serve } from "bun";
import index from "./index.html";

const isDevelopment = process.env.NODE_ENV !== "production";
const apiProxyTarget = new URL(process.env.API_PROXY_TARGET ?? "http://localhost:3000");

function proxyApiRequest(request: Request) {
  const requestUrl = new URL(request.url);
  const targetUrl = new URL(requestUrl.pathname + requestUrl.search, apiProxyTarget);
  const headers = new Headers(request.headers);

  headers.delete("host");

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });
}

const server = serve({
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/api/*": proxyApiRequest,
    "/*": index,
  },
  development: isDevelopment && {
    hmr: true,
    console: true,
  },
});

console.log(`Dashboard frontend server running at ${server.url}`);
