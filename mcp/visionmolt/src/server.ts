import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'node:http';
import { z } from 'zod';

const PORT = Number(process.env.PORT ?? 8787);
const MOLTBOOK_BASE = 'https://www.moltbook.com/api/v1';

const server = new McpServer({ name: 'VisionMolt', version: '0.1.0' });

server.tool('visionmolt_status', 'Get VisionMolt and Moltbook connection status.', {}, async () => ({
  content: [{ type: 'text', text: JSON.stringify({
    agent: 'VisionMolt',
    moltbookConfigured: Boolean(process.env.MOLTBOOK_API_KEY),
    moltbookBase: MOLTBOOK_BASE,
    capabilities: ['vision-events', 'moltbook-posts', 'moltbook-comments', 'semantic-search']
  }, null, 2) }]
}));

server.tool(
  'visionmolt_publish_observation',
  'Publish a concise AI-vision observation to Moltbook. Never include secrets or sensitive personal data.',
  { title: z.string().min(1).max(200), observation: z.string().min(1).max(5000) },
  async ({ title, observation }) => {
    const key = process.env.MOLTBOOK_API_KEY;
    if (!key) return { content: [{ type: 'text', text: 'MOLTBOOK_API_KEY is not configured.' }], isError: true };
    const res = await fetch(`${MOLTBOOK_BASE}/posts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'User-Agent': 'VisionMolt/0.1' },
      body: JSON.stringify({ title, content: observation })
    });
    const text = await res.text();
    return { content: [{ type: 'text', text }], isError: !res.ok };
  }
);

server.tool(
  'moltbook_search',
  'Search Moltbook for conceptually related posts and comments.',
  { query: z.string().min(1).max(500) },
  async ({ query }) => {
    const key = process.env.MOLTBOOK_API_KEY;
    if (!key) return { content: [{ type: 'text', text: 'MOLTBOOK_API_KEY is not configured.' }], isError: true };
    const res = await fetch(`${MOLTBOOK_BASE}/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${key}`, 'User-Agent': 'VisionMolt/0.1' }
    });
    const text = await res.text();
    return { content: [{ type: 'text', text }], isError: !res.ok };
  }
);

server.tool(
  'moltbook_heartbeat',
  'Check the authenticated VisionMolt account and return a heartbeat snapshot.',
  {},
  async () => {
    const key = process.env.MOLTBOOK_API_KEY;
    if (!key) return { content: [{ type: 'text', text: 'MOLTBOOK_API_KEY is not configured.' }], isError: true };
    const res = await fetch(`${MOLTBOOK_BASE}/agents/me`, {
      headers: { Authorization: `Bearer ${key}`, 'User-Agent': 'VisionMolt/0.1' }
    });
    const text = await res.text();
    return { content: [{ type: 'text', text }], isError: !res.ok };
  }
);

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
