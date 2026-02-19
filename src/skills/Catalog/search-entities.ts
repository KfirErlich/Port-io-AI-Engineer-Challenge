// Skill: Search Entities
// Searches for entities within the Port catalog. Essential for verifying data flow.
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import axios from "axios";
import { searchEntities } from "../../PortApi/index.js";

// Zod schema for validation and MCP registration
const searchEntitiesSchema = z.object({
  blueprint: z.string().optional(),
  query: z.any().optional(),
});

export const searchEntitiesSkill = {
  name: "search_entities",
  description:
    "Searches for entities within the Port catalog. Essential for verifying data flow. If no query is provided, defaults to empty object {} to return all entities for the blueprint. INPUT: Object with optional fields: blueprint (string), query (object). Example: { \"blueprint\": \"service\", \"query\": {} } or { \"blueprint\": \"service\" }.",
  inputSchema: searchEntitiesSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      // Validate input using Zod schema
      const validation = searchEntitiesSchema.parse(args);
      const { blueprint, query } = validation;

      console.error(`[TOOL] search_entities called with:`);
      console.error(`  blueprint: ${blueprint || 'none'}`);
      console.error(`  query: ${JSON.stringify(query || {})}`);

      try {
        const entities = await searchEntities(blueprint, query);

        if (entities.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No entities found${blueprint ? ` for blueprint '${blueprint}'` : ''}.\n\n` +
                  `Search parameters:\n` +
                  `  - Blueprint: ${blueprint || 'All blueprints'}\n` +
                  `  - Query: ${JSON.stringify(query || {}, null, 2)}\n\n` +
                  `The search returned an empty list. This may indicate:\n` +
                  `  - No entities exist matching the criteria\n` +
                  `  - The blueprint identifier may be incorrect\n` +
                  `  - The query filters may be too restrictive`,
              },
            ],
          };
        }

        let outputText = `Successfully found ${entities.length} entity/entities.\n\n`;
        outputText += `Search parameters:\n`;
        outputText += `  - Blueprint: ${blueprint || 'All blueprints'}\n`;
        outputText += `  - Query: ${JSON.stringify(query || {}, null, 2)}\n\n`;
        outputText += `=== ENTITIES ===\n\n`;

        entities.forEach((entity: any, index: number) => {
          outputText += `Entity ${index + 1}:\n`;
          outputText += `  - Identifier: ${entity.identifier || 'N/A'}\n`;
          outputText += `  - Title: ${entity.title || 'N/A'}\n`;
          outputText += `  - Blueprint: ${entity.blueprint || 'N/A'}\n`;
          if (entity.properties) {
            outputText += `  - Properties: ${JSON.stringify(entity.properties, null, 2)}\n`;
          }
          outputText += `\n`;
        });

        outputText += `\n=== FULL ENTITIES DATA ===\n`;
        outputText += JSON.stringify(entities, null, 2);

        return {
          content: [
            {
              type: "text" as const,
              text: outputText,
            },
          ],
        };
      } catch (error) {
        // Enhanced error logging for Axios errors
        let errorMessage = error instanceof Error ? error.message : String(error);
        let errorDetails = '';
        
        if (axios.isAxiosError(error)) {
          const axiosError = error as any;
          
          // Special handling for 422 validation errors
          if (axiosError.response?.status === 422) {
            console.error(`[Port API] 422 Validation Error - Response data:`, JSON.stringify(axiosError.response.data, null, 2));
            errorDetails = `\n\nPort API 422 Validation Error Details:\n${JSON.stringify(axiosError.response.data, null, 2)}`;
            errorMessage = `HTTP 422: Validation Error - ${errorMessage}`;
          } else {
            // Log full error response data for other errors
            if (axiosError.response?.data) {
              console.error(`[Port API] Full error response:`, JSON.stringify(axiosError.response.data, null, 2));
              errorDetails = `\n\nPort API Error Details:\n${JSON.stringify(axiosError.response.data, null, 2)}`;
            }
          }
          
          if (axiosError.response?.status) {
            errorMessage = `HTTP ${axiosError.response.status}: ${errorMessage}`;
          }
        }
        
        console.error(`[Port API] Error searching entities:`, errorMessage);
        if (errorDetails) {
          console.error(`[Port API] Error details:`, errorDetails);
        }
        
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to search entities: ${errorMessage}${errorDetails}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in search_entities:`, error);
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
            text: `Unexpected error in search_entities: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
