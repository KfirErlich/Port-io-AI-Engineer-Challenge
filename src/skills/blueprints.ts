// Skills related to blueprints
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getBlueprints } from "../port-api.js";

/**
 * Fetches current blueprints to understand the user's infrastructure
 */
export const inspectPortDataModel = {
  name: "inspect_port_data_model",
  description: "Fetches current blueprints to understand the user's infrastructure",
  inputSchema: {},
  handler: async (): Promise<CallToolResult> => {
    const blueprints = await getBlueprints();
    
    return {
      content: [{ type: "text", text: JSON.stringify(blueprints, null, 2) }],
    };
  },
};
