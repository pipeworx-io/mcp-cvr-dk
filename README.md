# mcp-cvr-dk

CVR — Det Centrale Virksomhedsregister (Danish Central Business Register) MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 965+ live data sources.

## Tools

| Tool | Description |
|------|-------------|

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "cvr-dk": {
      "url": "https://gateway.pipeworx.io/cvr-dk/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 965+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Cvr Dk data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/lookup_company \
  -H 'Content-Type: application/json' \
  -d '{"query":"novo nordisk"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/lookup_company`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
