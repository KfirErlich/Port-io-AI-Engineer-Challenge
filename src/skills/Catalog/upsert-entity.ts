// Skill: Upsert Entity
// Create or update an entity using the blueprint-scoped Port API.
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { upsertEntity } from "../../PortApi/entities.js";

const upsertEntitySchema = z.object({
  blueprint_identifier: z.string().min(1, "blueprint_identifier is required"),
  identifier: z.string().min(1, "identifier is required"),
  title: z.string().optional(),
  icon: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  relations: z.record(z.string(), z.unknown()).optional(),
  teams: z.array(z.string()).optional(),
});

export const upsertEntitySkill = {
  name: "upsert_entity",
  description:
    "Create or update an entity in a Port blueprint using the blueprint-scoped API (upsert=true, merge=true). INPUT: object with required 'blueprint_identifier' (string), 'identifier' (string); optional 'title' (string), 'icon' (string), 'properties' (object), 'relations' (object), 'teams' (array of strings). Returns the API response.",
  inputSchema: upsertEntitySchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = upsertEntitySchema.parse(args);
      const {
        blueprint_identifier,
        identifier,
        title,
        icon,
        properties,
        relations,
        teams,
      } = validation;

      console.error(`[TOOL] upsert_entity called: blueprint=${blueprint_identifier}, identifier=${identifier}`);

      const response = await upsertEntity(blueprint_identifier, {
        identifier,
        title,
        icon,
        properties,
        relations,
        teams,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Upsert entity response:\n${JSON.stringify(response, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Validation error: ${error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
            },
          ],
          isError: true,
        };
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[TOOL] upsert_entity error:`, errorMessage);
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to upsert entity: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
