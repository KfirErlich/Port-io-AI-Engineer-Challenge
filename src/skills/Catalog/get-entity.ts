// Skill: Get Entity
// Retrieves full details for a single specific entity.
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getEntity } from "../../PortApi/index.js";

// Zod schema for validation and MCP registration
const getEntitySchema = z.object({
  blueprint: z.string(),
  identifier: z.string(),
});

export const getEntitySkill = {
  name: "get_entity",
  description:
    "Retrieves full details for a single specific entity. INPUT: Object with required fields: blueprint (string), identifier (string). Example: { \"blueprint\": \"service\", \"identifier\": \"my-service\" }.",
  inputSchema: getEntitySchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      // Validate input using Zod schema
      const validation = getEntitySchema.parse(args);
      const { blueprint, identifier } = validation;

      console.error(`[TOOL] get_entity called with:`);
      console.error(`  blueprint: ${blueprint}`);
      console.error(`  identifier: ${identifier}`);

      try {
        const entity = await getEntity(blueprint, identifier);

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully retrieved entity details.\n\n` +
                `Entity Details:\n` +
                `  - Blueprint: ${blueprint}\n` +
                `  - Identifier: ${identifier}\n` +
                `  - Title: ${entity.title || 'N/A'}\n` +
                `  - Created At: ${entity.createdAt || 'N/A'}\n` +
                `  - Updated At: ${entity.updatedAt || 'N/A'}\n\n` +
                `Full entity data:\n${JSON.stringify(entity, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Port API] Error fetching entity:`, errorMessage);
        
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to fetch entity '${identifier}' from blueprint '${blueprint}': ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in get_entity:`, error);
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
            text: `Unexpected error in get_entity: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
