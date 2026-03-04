# @automanus/mcp-server

[![npm version](https://badge.fury.io/js/%40automanus%2Fmcp-server.svg)](https://www.npmjs.com/package/@automanus/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Create AI sales agents instantly from Claude Desktop, Cursor, or any MCP-compatible AI tool.**

AutoManus MCP Server lets you build and deploy AI sales chatbots to WhatsApp and Webchat in seconds - all from your favorite AI coding assistant.

## Features

- **Instant Agent Creation** - Just say "create a sales agent for [company]" and it's done
- **Auto Website Research** - Analyzes the company website and populates knowledge base automatically
- **WhatsApp + Webchat** - Agents deploy to both channels immediately
- **No Code Required** - Works entirely through natural language with Claude/Cursor
- **Free Tier** - 100 free credits to get started, no credit card required

## Quick Start

### Claude Desktop

Add to your Claude Desktop config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "automanus": {
      "command": "npx",
      "args": ["-y", "@automanus/mcp-server"]
    }
  }
}
```

Restart Claude Desktop, then try:
> "Create an AI sales agent for Stripe"

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "automanus": {
      "command": "npx",
      "args": ["-y", "@automanus/mcp-server"]
    }
  }
}
```

### Claude Code (CLI)

Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "automanus": {
      "command": "npx",
      "args": ["-y", "@automanus/mcp-server"]
    }
  }
}
```

## Usage Examples

Once installed, just talk to Claude naturally:

```
"Create a sales agent for my startup TechCo using techco.com as the knowledge source"
```

```
"Build an AI sales chatbot for Vercel"
```

```
"I need a customer service bot for my cleaning business at sparkclean.com"
```

Claude will:
1. Ask for your email (to send the agent claim link)
2. Research the website automatically
3. Create the agent with knowledge base
4. Deploy to WhatsApp and Webchat
5. Send you an email with links to manage everything

## Authentication

**No configuration required!** Claude will ask for your email when creating an agent.

### Optional: Pre-configure email

If you want to skip the email prompt:

```json
{
  "mcpServers": {
    "automanus": {
      "command": "npx",
      "args": ["-y", "@automanus/mcp-server"],
      "env": {
        "AUTOMANUS_EMAIL": "your-email@example.com"
      }
    }
  }
}
```

### Optional: API Key (For existing users)

With an API key, agents are created directly under your account:

```json
{
  "mcpServers": {
    "automanus": {
      "command": "npx",
      "args": ["-y", "@automanus/mcp-server"],
      "env": {
        "AUTOMANUS_API_KEY": "ak_your_api_key_here"
      }
    }
  }
}
```

Get your API key from [automanus.io/dashboard/settings/api](https://automanus.io/dashboard/settings/api).

## What You Get

When you create an agent, you receive:

| Feature | Description |
|---------|-------------|
| **AI Sales Agent** | Trained on the company's website content |
| **WhatsApp Number** | Shareable link for customers to chat |
| **Webchat Widget** | Embed code for your website |
| **Knowledge Base** | Auto-populated from website research |
| **Dashboard Access** | Manage, train, and customize your agent |

## Use Cases

- **Sales Teams** - Qualify leads 24/7 on WhatsApp and website
- **Startups** - Add AI customer service without hiring
- **Agencies** - Build chatbots for clients in minutes
- **E-commerce** - Answer product questions automatically
- **SaaS** - Handle trial user questions and demos

## Pricing

| Plan | Credits | Features |
|------|---------|----------|
| **Free** | 100 | WhatsApp + Webchat, Basic KB |
| **Starter** | 1,000/mo | Priority support, Analytics |
| **Pro** | 5,000/mo | Custom branding, API access |

## Links

- [📺 Watch Demo](https://www.youtube.com/watch?v=4Mdzehq4ghg&list=PLE9hy4A7ZTmpGq7GHf5tgGFWh2277AeDR)
- [Documentation](https://automanus.io/docs/mcp)
- [Dashboard](https://automanus.io/dashboard)
- [API Reference](https://automanus.io/docs/api)
- [GitHub](https://github.com/automanus-io/mcp-server)
- [npm Package](https://www.npmjs.com/package/@automanus/mcp-server)

## Community

- [Discord](https://discord.com/invite/tGsJ2nJH69) - Get help, share feedback, and connect with other users
- [GitHub Issues](https://github.com/automanus-io/mcp-server/issues) - Report bugs
- Email: hello@automanus.io

## License

MIT
