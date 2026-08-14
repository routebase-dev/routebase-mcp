# routebase-mcp

**Connect your AI agent to your Routebase APIs.** This is the connector for [Routebase](https://routebase.dev) — an API lifecycle platform where documentation, mock servers, contract tests and monitoring are all derived from one OpenAPI spec. Agents work that same spec: designing endpoints and schemas, running contract and security test suites, managing mocks, publishing docs and reading monitors — under the same role-based permissions as the human team. Billing and organization access stay read-only.

There are two ways to connect. Pick the hosted endpoint unless your client only speaks stdio.

## Hosted endpoint (recommended)

```
https://mcp.routebase.dev
```

Streamable HTTP, with OAuth 2.1 and dynamic client registration — you sign in with your Routebase account, nothing to install and no key to rotate. Clients that prefer a static credential can send an `X-API-Key` header instead.

**US-region accounts** use `https://mcp.routebase.dev/?region=us`. Getting this wrong shows up as a connector with no tools, not as an error.

## stdio bridge

For clients that only launch local processes:

```bash
ROUTEBASE_API_KEY=rb_… npx routebase-mcp
```

Generate an API key in Routebase under **Settings → API Keys**. The interactive setup writes the right config for you:

```bash
npx routebase-mcp init
```

Or add it by hand — Claude Code (`.mcp.json`), Cursor (`.cursor/mcp.json`) and VS Code (`.vscode/mcp.json`) all take the same block:

```json
{
  "mcpServers": {
    "routebase": {
      "command": "npx",
      "args": ["-y", "routebase-mcp", "--stdio"],
      "env": {
        "ROUTEBASE_API_KEY": "rb_…"
      }
    }
  }
}
```

| Environment variable | Required | Description |
| --- | --- | --- |
| `ROUTEBASE_API_KEY` | ✅ | API key for authentication. Create one under **Settings → API Keys**. |
| `ROUTEBASE_REGION` | US accounts | Home region of your account: `us` or `eu` (default: `eu`). Without it, a US key fails as if it were invalid. |
| `ROUTEBASE_LOG_LEVEL` | – | `verbose` · `debug` · `info` · `warning` · `error` · `fatal` (default: `warning`). Logs go to stderr — stdout is reserved for the MCP protocol. |

## How the stdio bridge works

The npm package is a small shim. On first run it downloads the self-contained CLI binary for your platform from `releases.routebase.dev`, **verifies it against a SHA-256 checksum baked into the package at publish time** (it refuses to run on mismatch — fail-closed), and caches it under `~/.routebase/bin/<version>/`.

**Supported platforms:** macOS (arm64, x64), Windows (x64), Linux (x64). Requires Node.js ≥ 18.

## What's in this repository

| File | Purpose |
| --- | --- |
| `bin/routebase-mcp.js` | The stdio shim published as the [`routebase-mcp`](https://www.npmjs.com/package/routebase-mcp) npm package |
| `server.json` | Manifest for the [MCP Registry](https://registry.modelcontextprotocol.io) (`dev.routebase/routebase`) |
| `plugin.json`, `mcp.json` | [Agent Plugins 1.0](https://github.com/agentplugins/agent-plugins-spec) manifests |

> This repository **mirrors** the connector as published. The shim is built and released from Routebase's own repository, so changes made here won't reach npm — please open an issue instead of a pull request against `bin/`.

## Links

- Product: <https://routebase.dev/mcp-server/>
- Docs: <https://docs.routebase.dev> → *MCP Quickstart*
- npm: <https://www.npmjs.com/package/routebase-mcp>

## License

The shim in this repository is [MIT](LICENSE). The downloaded Routebase CLI binary is governed by the [Routebase Terms](https://routebase.dev/terms).
