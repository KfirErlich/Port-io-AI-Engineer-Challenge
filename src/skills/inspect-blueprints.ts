// Skills related to blueprints
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getBlueprints } from "../port-api.js";

/** Zod schema for MCP SDK validation - no inputs required */
const inputSchema = z.object({});

/**
 * Fetches current blueprints to understand the user's infrastructure
 */
export const inspectPortDataModel = {
  name: "inspect_port_data_model",
  description: "Inspect and retrieve complete Port data model information. Returns all blueprints with full schemas, properties, relations, and metadata. Use when you need to understand the data model structure, schema details, or relationships. INPUT: no parameters required; call with empty object {}.",
  inputSchema,
  handler: async (): Promise<CallToolResult> => {
    try {
      console.error(`[TOOL] inspect_port_data_model called - fetching blueprints...`);
      const blueprints = await getBlueprints();
      console.error(`[TOOL] Successfully fetched ${blueprints.length} blueprints`);
      
      return {
        content: [{ type: "text", text: JSON.stringify(blueprints, null, 2) }],
      };
    } catch (error) {
      console.error(`[TOOL] Error in inspect_port_data_model:`, error);
      return {
        content: [{ 
          type: "text", 
          text: `Error fetching blueprints: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true,
      };
    }
  },
};
