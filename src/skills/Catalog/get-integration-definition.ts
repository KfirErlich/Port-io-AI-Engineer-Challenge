// Skill: Get Integration Definition
// Retrieves the full configuration JSON of a specific integration (including mappings).
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getIntegrationDefinition } from "../../PortApi/index.js";

// Zod schema for validation and MCP registration
const getIntegrationDefinitionSchema = z.object({
  installationId: z.string(),
});

export const getIntegrationDefinitionSkill = {
  name: "get_integration_definition",
  description:
    "Retrieves the full configuration JSON of a specific integration (including mappings). INPUT: Object with required field: installationId (string). Example: { \"installationId\": \"abc123\" }.",
  inputSchema: getIntegrationDefinitionSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      // Validate input using Zod schema
      const validation = getIntegrationDefinitionSchema.parse(args);
      const { installationId } = validation;

      console.error(`[TOOL] get_integration_definition called with installationId: ${installationId}`);

      try {
        const integration = await getIntegrationDefinition(installationId);

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully retrieved integration definition.\n\n` +
                `Integration Details:\n` +
                `  - Installation ID: ${installationId}\n` +
                `  - Type: ${integration.type || 'N/A'}\n` +
                `  - Title: ${integration.title || 'N/A'}\n\n` +
                `Full integration configuration:\n${JSON.stringify(integration, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Port API] Error fetching integration definition:`, errorMessage);
        
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to fetch integration definition for '${installationId}': ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in get_integration_definition:`, error);
      if (error instanceof z.ZodError) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Validation error: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
            },
          ],
          isError: true,
        };
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Unexpected error in get_integration_definition: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
