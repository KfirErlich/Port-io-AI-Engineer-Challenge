// נקודת הכניסה
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { allSkills } from "./skills/index.js";

const server = new McpServer(
  { name: "port-onboarding-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Register all skills
allSkills.forEach((skill) => {
  server.registerTool(skill.name, {
    description: skill.description,
    inputSchema: skill.inputSchema,
  }, skill.handler);
});

// הרצת השרת
const transport = new StdioServerTransport();
await server.connect(transport);
