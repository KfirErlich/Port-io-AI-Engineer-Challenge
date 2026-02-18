import { CallToolResult } from "@modelcontextprotocol/sdk/types";

export interface Skill {
    name: string;
    description: string;
    inputSchema?: any;
    handler: (args: any) => Promise<CallToolResult>;
  }