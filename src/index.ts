#!/usr/bin/env node
/**
 * AutoManus MCP Server
 *
 * Provides AI sales agent creation capabilities via Model Context Protocol.
 * Works with Claude Desktop, Cursor, and other MCP-compatible AI tools.
 *
 * Environment Variables:
 * - AUTOMANUS_EMAIL: User email for account association (required if no API key)
 * - AUTOMANUS_API_KEY: API key for authenticated access (optional)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_BASE_URL = 'https://automanus.io/api/v1';

// Tool definitions
const tools = [
  {
    name: 'create_sales_agent',
    description:
      'Create an AI sales agent for a business. Researches the website automatically and deploys to WhatsApp and Webchat. Ask the user for their email if not provided.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        email: {
          type: 'string',
          description: 'User email address for account creation and receiving the agent claim link. Ask the user for this.',
        },
        company_name: {
          type: 'string',
          description: 'Business/company name',
        },
        website_url: {
          type: 'string',
          description:
            'Website URL to research. We analyze it to populate knowledge base.',
        },
        agent_name: {
          type: 'string',
          description: 'Custom agent name (optional, defaults to "{company} Assistant")',
        },
      },
      required: ['company_name'],
    },
  },
  {
    name: 'add_knowledge',
    description:
      'Add a knowledge base item to an existing AI sales agent. Use this to provide product info, FAQs, policies, or other information the agent should know.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agent_id: {
          type: 'string',
          description: 'The ID of the agent to add knowledge to (returned from create_sales_agent)',
        },
        title: {
          type: 'string',
          description: 'Title of the knowledge item',
        },
        content: {
          type: 'string',
          description: 'The content/body of the knowledge item',
        },
        item_type: {
          type: 'string',
          enum: ['faq', 'product', 'policy', 'document'],
          description: 'Type of knowledge item (default: faq)',
        },
        category: {
          type: 'string',
          description: 'Category for organizing (e.g., "Pricing", "Products", "Company Info")',
        },
      },
      required: ['agent_id', 'title', 'content'],
    },
  },
  {
    name: 'generate_qr_code',
    description:
      'Generate a QR code for a URL or WhatsApp link. Returns a URL to the QR code image that can be opened in a browser or downloaded.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'Direct URL to encode in the QR code (e.g., https://example.com)',
        },
        phone: {
          type: 'string',
          description: 'WhatsApp phone number with country code, no + sign (e.g., 16506053956). Used if url is not provided.',
        },
        message: {
          type: 'string',
          description: 'Pre-filled WhatsApp message text. Used with phone parameter.',
        },
        size: {
          type: 'number',
          description: 'QR code size in pixels (100-1000, default 300)',
        },
      },
      required: [],
    },
  },
];

// Get auth config from environment
function getAuthConfig(): { email?: string; apiKey?: string } {
  return {
    email: process.env.AUTOMANUS_EMAIL,
    apiKey: process.env.AUTOMANUS_API_KEY,
  };
}

// Create fetch headers with auth
function getHeaders(): Record<string, string> {
  const { apiKey } = getAuthConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

// Tool handlers
async function handleCreateSalesAgent(args: {
  email?: string;
  company_name: string;
  website_url?: string;
  agent_name?: string;
}): Promise<string> {
  const { email: envEmail, apiKey } = getAuthConfig();

  // Use provided email, fall back to env variable
  const email = args.email || envEmail;

  if (!apiKey && !email) {
    return JSON.stringify({
      error: 'Email address is required to create an agent',
      hint: 'Please provide your email address so we can send you a link to claim your agent.',
    });
  }

  const body: Record<string, string> = {
    company_name: args.company_name,
    source: 'mcp',
  };

  if (!apiKey && email) {
    body.email = email;
  }

  if (args.website_url) {
    body.website_url = args.website_url;
  }

  if (args.agent_name) {
    body.agent_name = args.agent_name;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/public/agents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return JSON.stringify({
        error: data.error || 'Failed to create agent',
        status: response.status,
      });
    }

    // Format successful response
    // For new users, use claim_url for the dashboard link (dashboard_url requires auth)
    const manageUrl = data.is_new_user ? data.claim_url : data.dashboard_url;

    // Check for sandbox mode (agent not verified)
    const trustLevel = data.trust_level as string | undefined;
    const isSandbox = data.is_sandbox === true || trustLevel === 'sandbox';
    const displayName = (data.display_name as string) || data.agent_name;
    const verificationInstructions = data.verification_instructions as {
      message?: string;
      dns_txt?: string;
      meta_tag?: string;
      dashboard_url?: string;
    } | undefined;

    // Check for missing content hints (e.g., pricing page couldn't be scraped due to JS rendering)
    const missingHints = data.missing_content_hints as string[] | undefined;
    const hasMissingContent = missingHints && missingHints.length > 0;

    // Build the message based on user status, sandbox mode, and missing content
    let message: string;

    if (isSandbox) {
      // Sandbox mode: explain the (sandbox) tag
      message = `Agent created as "${displayName}".\n\n`;
      message += `⚠️ SANDBOX MODE: The (sandbox) tag is visible to users because your email domain doesn't match the website domain.\n\n`;
      message += `To remove the tag, verify domain ownership:\n`;
      if (verificationInstructions?.dns_txt) {
        message += `• DNS: ${verificationInstructions.dns_txt}\n`;
      }
      if (verificationInstructions?.meta_tag) {
        message += `• Meta tag: ${verificationInstructions.meta_tag}\n`;
      }
      if (verificationInstructions?.dashboard_url) {
        message += `\nVerify at: ${verificationInstructions.dashboard_url}`;
      }
      if (data.is_new_user) {
        message += `\n\nCheck ${email} for a magic link to manage your agent.`;
      }
    } else if (data.is_new_user) {
      message = `Agent "${displayName}" created and verified! ✓\n\nCheck ${email} for a magic link to claim your agent.`;
    } else {
      message = `Agent "${displayName}" created, verified, and added to your account. ✓`;
    }

    // Append missing content prompt if needed
    if (hasMissingContent) {
      const missingList = missingHints.join(' and ');
      message += `\n\nNote: I couldn't extract ${missingList} info from the website (it may use JavaScript rendering). Would you like to share your ${missingList} details so I can add them to the knowledge base?`;
    }

    return JSON.stringify({
      success: true,
      agent_id: data.agent_id,
      agent_name: data.agent_name,
      display_name: displayName,
      company_name: data.company_name,
      webchat_embed_code: data.webchat_embed_code,
      whatsapp_link: data.whatsapp_link,
      dashboard_url: manageUrl, // Use claim URL for new users
      knowledge_base_count: data.knowledge_base_count,
      is_new_user: data.is_new_user,
      claim_url: data.claim_url,
      // Sandbox trust system fields
      trust_level: trustLevel,
      is_sandbox: isSandbox,
      verification_code: data.verification_code,
      verification_instructions: verificationInstructions,
      // Missing content hints
      missing_content_hints: hasMissingContent ? missingHints : undefined,
      message,
    });
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Network error',
    });
  }
}

// Handler for add_knowledge tool
async function handleAddKnowledge(args: {
  agent_id: string;
  title: string;
  content: string;
  item_type?: string;
  category?: string;
}): Promise<string> {
  if (!args.agent_id || !args.title || !args.content) {
    return JSON.stringify({
      error: 'agent_id, title, and content are required',
    });
  }

  const body: Record<string, unknown> = {
    agent_id: args.agent_id,
    title: args.title,
    content: args.content,
  };

  if (args.item_type) {
    body.item_type = args.item_type;
  }

  if (args.category) {
    body.category = args.category;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/public/knowledge`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return JSON.stringify({
        error: data.error || 'Failed to add knowledge item',
        status: response.status,
      });
    }

    return JSON.stringify({
      success: true,
      knowledge_item_id: data.knowledge_item_id,
      agent_id: data.agent_id,
      embedding_generated: data.embedding_generated,
      message: `Knowledge item "${args.title}" added successfully to agent.`,
    });
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Network error',
    });
  }
}

// Handler for generate_qr_code tool
const QR_API_BASE_URL = 'https://automanus.io';
const DEFAULT_WHATSAPP_PHONE = '16506053956';

async function handleGenerateQRCode(args: {
  url?: string;
  phone?: string;
  message?: string;
  size?: number;
}): Promise<string> {
  const size = Math.min(Math.max(args.size || 300, 100), 1000);

  let encodedUrl: string;

  if (args.url) {
    // Direct URL provided
    encodedUrl = args.url;
  } else {
    // Generate WhatsApp URL
    const phone = (args.phone || DEFAULT_WHATSAPP_PHONE).replace(/\D/g, '');
    const message = args.message || '';

    encodedUrl = message
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${phone}`;
  }

  // Generate QR code URL
  const qrUrl = `${QR_API_BASE_URL}/api/qr?url=${encodeURIComponent(encodedUrl)}&size=${size}`;

  return JSON.stringify({
    success: true,
    qr_url: qrUrl,
    encoded_url: encodedUrl,
    size: size,
    instructions: 'Open the qr_url in a browser to view or download the QR code image.',
  });
}

// Main server setup
async function main() {
  const server = new Server(
    {
      name: 'automanus-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    let result: string;

    switch (name) {
      case 'create_sales_agent':
        result = await handleCreateSalesAgent(
          args as { email?: string; company_name: string; website_url?: string; agent_name?: string }
        );
        break;
      case 'add_knowledge':
        result = await handleAddKnowledge(
          args as { agent_id: string; title: string; content: string; item_type?: string; category?: string }
        );
        break;
      case 'generate_qr_code':
        result = await handleGenerateQRCode(
          args as { url?: string; phone?: string; message?: string; size?: number }
        );
        break;
      default:
        result = JSON.stringify({ error: `Unknown tool: ${name}` });
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  });

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('AutoManus MCP server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
