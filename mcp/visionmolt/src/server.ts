import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { createServer } from 'node:http';
import { z } from 'zod';

const PORT = Number(process.env.PORT ?? 8787);
const MOLTBOOK_BASE = 'https://www.moltbook.com/api/v1';
const resourceUri = 'ui://visionmolt/dashboard.html';

const server = new McpServer({ name: 'VisionMolt', version: '0.1.0' });

registerAppTool(server, 'visionmolt_status', {
  title: 'VisionMolt Dashboard',
  description: 'Show VisionMolt status and Moltbook connectivity.',
  inputSchema: {},
  _meta: { ui: { resourceUri } },
}, async () => {
  const state = {
    agent: 'VisionMolt',
    moltbookConfigured: Boolean(process.env.MOLTBOOK_API_KEY),
    moltbookBase: MOLTBOOK_BASE,
    capabilities: ['vision-events', 'moltbook-posts', 'moltbook-comments', 'semantic-search'],
    timestamp: new Date().toISOString(),
  };
  return { content: [{ type: 'text', text: JSON.stringify(state) }], structuredContent: state };
});

registerAppTool(server, 'visionmolt_publish_observation', {
  title: 'Publish Vision Observation',
  description: 'Publish a concise AI-vision observation to Moltbook. Do not include secrets or sensitive personal data.',
  inputSchema: { title: z.string().min(1).max(200), observation: z.string().min(1).max(5000) },
  _meta: { ui: { resourceUri } },
}, async ({ title, observation }) => {
  const key = process.env.MOLTBOOK_API_KEY;
  if (!key) return { content: [{ type: 'text', text: 'MOLTBOOK_API_KEY is not configured.' }], isError: true };
  const res = await fetch(`${MOLTBOOK_BASE}/posts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'User-Agent': 'VisionMolt/0.1' },
    body: JSON.stringify({ title, content: observation }),
  });
  const text = await res.text();
  return { content: [{ type: 'text', text }], structuredContent: { ok: res.ok, response: text }, isError: !res.ok };
});

registerAppTool(server, 'moltbook_search', {
  title: 'Search Moltbook',
  description: 'Search Moltbook for conceptually related posts and comments.',
  inputSchema: { query: z.string().min(1).max(500) },
  _meta: { ui: { resourceUri } },
}, async ({ query }) => {
  const key = process.env.MOLTBOOK_API_KEY;
  if (!key) return { content: [{ type: 'text', text: 'MOLTBOOK_API_KEY is not configured.' }], isError: true };
  const res = await fetch(`${MOLTBOOK_BASE}/search?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${key}`, 'User-Agent': 'VisionMolt/0.1' },
  });
  const text = await res.text();
  return { content: [{ type: 'text', text }], structuredContent: { ok: res.ok, response: text }, isError: !res.ok };
});

registerAppTool(server, 'moltbook_heartbeat', {
  title: 'Moltbook Heartbeat',
  description: 'Check the authenticated VisionMolt account.',
  inputSchema: {},
  _meta: { ui: { resourceUri } },
}, async () => {
  const key = process.env.MOLTBOOK_API_KEY;
  if (!key) return { content: [{ type: 'text', text: 'MOLTBOOK_API_KEY is not configured.' }], isError: true };
  const res = await fetch(`${MOLTBOOK_BASE}/agents/me`, {
    headers: { Authorization: `Bearer ${key}`, 'User-Agent': 'VisionMolt/0.1' },
  });
  const text = await res.text();
  return { content: [{ type: 'text', text }], structuredContent: { ok: res.ok, response: text }, isError: !res.ok };
});

registerAppResource(server, 'VisionMolt Dashboard', resourceUri, {
  description: 'Realtime dashboard for VisionMolt and Moltbook.',
  _meta: { ui: { csp: { resourceDomains: ['https://unpkg.com'], connectDomains: ['https://www.moltbook.com'] } } },
}, async () => ({
  contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VisionMolt</title>
<style>body{font-family:system-ui,sans-serif;margin:0;padding:20px;background:var(--color-background-secondary,#111827);color:var(--color-text-primary,#f9fafb)}.card{border:1px solid #374151;border-radius:16px;padding:18px;max-width:760px}.row{display:flex;justify-content:space-between;gap:12px;margin:8px 0}.ok{color:#4ade80}.muted{color:#9ca3af;font-size:13px}pre{white-space:pre-wrap;overflow:auto;background:#0b1220;padding:12px;border-radius:10px}</style></head>
<body><div class="card"><h2>🦞 VisionMolt</h2><div class="row"><b>AI Agent</b><span>VisionMolt</span></div><div class="row"><b>Moltbook</b><span id="status">Waiting for tool result…</span></div><p class="muted">MCP Apps dashboard · Vision + Moltbook integration</p><pre id="data">No tool result yet.</pre></div>
<script type="module">
import {App,PostMessageTransport,applyDocumentTheme,applyHostStyleVariables} from 'https://unpkg.com/@modelcontextprotocol/ext-apps/dist/index.js';
const app=new App({name:'VisionMolt Dashboard',version:'0.1.0'});
app.ontoolresult=(result)=>{const d=result?.structuredContent??result;document.getElementById('data').textContent=JSON.stringify(d,null,2);document.getElementById('status').textContent=d?.moltbookConfigured?'Connected':'API key not configured';};
app.onhostcontextchanged=(ctx)=>{if(ctx.theme)applyDocumentTheme(ctx.theme);if(ctx.styles?.variables)applyHostStyleVariables(ctx.styles.variables);};
app.onteardown=async()=>({});
app.connect(new PostMessageTransport(window.parent)).catch(e=>{document.getElementById('data').textContent='MCP connection error: '+e.message;});
</script></body></html>` }],
}));

const httpServer = createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'visionmolt-mcp', version: '0.1.0' }));
    return;
  }
  if (req.url?.startsWith('/mcp')) {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
});

httpServer.listen(PORT, () => console.log(`VisionMolt MCP listening on :${PORT}`));
