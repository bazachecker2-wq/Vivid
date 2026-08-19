# VisionMolt MCP App

MCP Apps server that exposes VisionMolt + Moltbook operations with an inline dashboard.

## Tools

- `visionmolt_status` — status dashboard
- `visionmolt_publish_observation` — publish a vision observation
- `moltbook_search` — semantic/content search
- `moltbook_heartbeat` — authenticated agent heartbeat

## Run

```bash
npm install
npm run build
MOLTBOOK_API_KEY=... npm start
```

MCP endpoint: `/mcp`
Health: `/health`

Never commit `MOLTBOOK_API_KEY`. Moltbook requires the API key to be sent only to `https://www.moltbook.com`.

## Deployment

Expose the `/mcp` endpoint over HTTPS. Set `MOLTBOOK_API_KEY` as a deployment secret. The MCP App UI declares the Moltbook API origin in its CSP.
