// Skills related to blueprints
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getBlueprints } from "../port-api.js";

/**
 * Fetches current blueprints to understand the user's infrastructure
 */
export const inspectPortDataModel = {
  name: "inspect_port_data_model",
  description: "Inspect and retrieve complete Port data model information. Returns all blueprints with full schemas, properties, relations, and metadata. Essential for understanding the complete structure of your Port catalog, analyzing data models, and inspecting blueprint configurations. This tool provides comprehensive blueprint data that goes beyond basic listing - use it when you need to understand the full data model structure, schema details, property definitions, or relationships between blueprints.",
  // Omit inputSchema to use SDK default and avoid validation bug
  // inputSchema: z.object({}) as any,
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
