import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { allSkills } from "./skills/index.js";
import cors from "cors";

const app = express();
// CORS: MUST expose mcp-session-id so Port (remote client) can read it from responses.
app.use(
  cors({
    origin: "*",
    exposedHeaders: ["mcp-session-id"],
    allowedHeaders: ["Content-Type", "mcp-session-id", "accept", "last-event-id"],
  })
);
app.use(express.json());

dotenv.config();

/** Create MCP server instance with tools */
function createServer() {
  const s = new McpServer(
    { name: "port-onboarding-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );
  console.error(`[MCP] Registering ${allSkills.length} tool(s):`);
  allSkills.forEach((skill) => {
    console.error(`[MCP]   - ${skill.name}: ${skill.description}`);
    try {
      // Pass Zod schema if available (MCP SDK expects Zod schema with safeParseAsync method)
      const toolDef: any = {
        description: skill.description,
      };
      if (skill.inputSchema) {
        toolDef.inputSchema = skill.inputSchema;
      }
      s.registerTool(skill.name, toolDef, skill.handler);
      console.error(`[MCP]   ✓ Successfully registered: ${skill.name}`);
    } catch (error) {
      console.error(`[MCP]   ✗ Failed to register ${skill.name}:`, error);
    }
  });
  console.error(`[MCP] Server created with ${allSkills.length} tool(s) registered`);
  return s;
}

/** Map of session ID -> transport for per-session handling (required for Port reconnects) */
const transports: Record<string, StreamableHTTPServerTransport> = {};
/** Map of session ID -> server instance for per-session handling */
const servers: Record<string, McpServer> = {};

function isInitializeRequest(body: unknown): boolean {
  return typeof body === "object" && body !== null && (body as { method?: string }).method === "initialize";
}

app.all("/mcp", (_req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const body = req.body;

  // Log incoming requests for debugging
  if (body?.method) {
    console.error(`[MCP] Received ${body.method} request${sessionId ? ` (session: ${sessionId})` : ' (new session)'}`);
  }

  try {
    let transport: StreamableHTTPServerTransport | undefined;
    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(body)) {
      let capturedSessionId: string | undefined;
      const server = createServer();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          capturedSessionId = sid;
          transports[sid] = transport!;
          servers[sid] = server; // Store server instance with session ID
          console.error(`[MCP] Session initialized with ID: ${sid}`);
        },
      });
      transport.onclose = () => {
        if (capturedSessionId) {
          if (transports[capturedSessionId]) {
            delete transports[capturedSessionId];
          }
          if (servers[capturedSessionId]) {
            delete servers[capturedSessionId];
          }
        }
      };
      await server.connect(transport);
      
      // Wrap response to log headers
      const originalSetHeader = res.setHeader.bind(res);
      res.setHeader = (name: string, value: string | string[]) => {
        if (name.toLowerCase() === 'mcp-session-id') {
          console.error(`[MCP] Setting session ID header: ${value}`);
        }
        return originalSetHeader(name, value);
      };
      
      await transport.handleRequest(req, res, body);
      // Note: session ID is set in response headers by transport.handleRequest
      // The onsessioninitialized callback will log when it's ready
      return;
    }
    
    // If we don't have a valid transport at this point, reject the request
    if (!transport) {
      // Log what we received for debugging
      console.error(`[MCP] Rejected request - sessionId: ${sessionId || 'none'}, method: ${body?.method || 'unknown'}`);
      console.error(`[MCP] Available sessions: ${Object.keys(transports).join(', ') || 'none'}`);
      res.status(400).json({
        jsonrpc: "2.0",
        error: { 
          code: -32000, 
          message: `Bad Request: No valid session ID provided. Method: ${body?.method || 'unknown'}. Available sessions: ${Object.keys(transports).length}` 
        },
        id: null,
      });
      return;
    }
    
    // Handle subsequent requests with existing session
    // Log tools/list and tools/call requests/responses
    if (body?.method === 'tools/list') {
      const originalJson = res.json.bind(res);
      res.json = (data: any) => {
        console.error(`[MCP] tools/list response:`, JSON.stringify(data, null, 2));
        return originalJson(data);
      };
    }
    if (body?.method === 'tools/call') {
      console.error(`[MCP] ========== TOOLS/CALL REQUEST ==========`);
      console.error(`[MCP] Tool name: ${body.params?.name || 'unknown'}`);
      console.error(`[MCP] Full request body:`, JSON.stringify(body, null, 2));
      console.error(`[MCP] Request headers:`, JSON.stringify(req.headers, null, 2));
      console.error(`[MCP] Session ID: ${sessionId}`);
      console.error(`[MCP] tools/call params:`, JSON.stringify(body.params, null, 2));
      
      const originalJson = res.json.bind(res);
      res.json = (data: any) => {
        console.error(`[MCP] ========== TOOLS/CALL RESPONSE ==========`);
        console.error(`[MCP] Response data:`, JSON.stringify(data, null, 2));
        return originalJson(data);
      };
    }
    await transport.handleRequest(req, res, body);
  } catch (error) {
    console.error("[MCP] POST Error:", error);
    console.error("[MCP] Error details:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("[MCP] Stack:", error.stack);
    }
    if (!res.headersSent) res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  try {
    await transports[sessionId].handleRequest(req, res);
  } catch (error) {
    console.error("[MCP] GET Error:", error);
    if (!res.headersSent) res.status(500).send("Internal Server Error");
  }
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  try {
    await transports[sessionId].handleRequest(req, res);
    delete transports[sessionId];
    if (servers[sessionId]) {
      delete servers[sessionId];
    }
  } catch (error) {
    console.error("[MCP] DELETE Error:", error);
    if (!res.headersSent) res.status(500).send("Internal Server Error");
  }
});

// Health check endpoint to verify server is running
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    tools: allSkills.map(s => ({
      name: s.name,
      description: s.description,
    })),
    activeSessions: Object.keys(transports).length,
  });
});

// Test endpoint to directly query tools/list from a server instance
app.get("/test-tools", async (_req, res) => {
  try {
    const testServer = createServer();
    const testTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: () => {},
    });
    await testServer.connect(testTransport);
    
    // Create a mock request/response to test tools/list
    const mockReq = {
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      },
      headers: {},
    } as any;
    
    let toolsListResponse: any = null;
    const mockRes = {
      json: (data: any) => {
        toolsListResponse = data;
        res.json({
          success: true,
          toolsListResponse: data,
          registeredTools: allSkills.map(s => s.name),
        });
      },
      setHeader: () => {},
      headersSent: false,
    } as any;
    
    await testTransport.handleRequest(mockReq, mockRes, mockReq.body);
    
    if (!toolsListResponse) {
      res.json({ success: false, error: "No response from tools/list" });
    }
  } catch (error) {
    console.error("[TEST] Error:", error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      registeredTools: allSkills.map(s => s.name),
    });
  }
});

// Test endpoint to simulate tools/list request
app.post("/test-tools-list", async (_req, res) => {
  try {
    const testServer = createServer();
    // Create a mock transport to test tools listing
    const testTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: () => {},
    });
    await testServer.connect(testTransport);
    
    // Simulate tools/list request
    const toolsListRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    };
    
    const mockReq = {
      body: toolsListRequest,
      headers: {},
    } as any;
    
    const mockRes = {
      json: (data: any) => {
        res.json(data);
      },
      setHeader: () => {},
      headersSent: false,
    } as any;
    
    await testTransport.handleRequest(mockReq, mockRes, toolsListRequest);
  } catch (error) {
    console.error("[TEST] Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// Run server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.error(`MCP Server running!`);
  console.error(`Streamable HTTP endpoint: http://localhost:${PORT}/mcp`);
  console.error(`Health check: http://localhost:${PORT}/health`);
  console.error(`Registered ${allSkills.length} tool(s)`);
});