// Skill for setting up catalog relations between blueprints
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getBlueprint, getAccessToken } from "../port-api.js";
import axios, { AxiosError } from "axios";

const PORT_API_URL = "https://api.port.io/v1";

/** Zod schema for MCP SDK validation */
const inputSchema = z.object({
  sourceBlueprint: z.string().min(1, "sourceBlueprint is required and must be a non-empty string"),
  relationName: z.string().min(1, "relationName is required and must be a non-empty string"),
  targetBlueprint: z.string().min(1, "targetBlueprint is required and must be a non-empty string"),
  many: z.boolean(),
  title: z.string().optional(),
  required: z.boolean().optional().default(false),
});

function validateArgs(args: unknown): { ok: true; params: { sourceBlueprint: string; relationName: string; targetBlueprint: string; many: boolean; title?: string; required?: boolean } } | { ok: false; message: string } {
  try {
    const result = inputSchema.parse(args);
    return {
      ok: true,
      params: {
        sourceBlueprint: result.sourceBlueprint.trim(),
        relationName: result.relationName.trim(),
        targetBlueprint: result.targetBlueprint.trim(),
        many: result.many,
        title: result.title,
        required: result.required,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: `Validation error: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}` };
    }
    return { ok: false, message: `Validation error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Skill: Setup catalog relations between blueprints
 * Adds a relation to a source blueprint that points to a target blueprint.
 * Uses PATCH /v1/blueprints/{sourceBlueprint} to update the relations object.
 */
export const setupCatalogRelationsSkill = {
  name: "setup_catalog_relations",
  description:
    "Add a relation to a blueprint that connects it to another blueprint. Use this to establish relationships between blueprints (e.g., Service -> Team, Service -> Environment). INPUT: Object with required fields: sourceBlueprint (string, identifier of source blueprint), relationName (string, identifier for the relation), targetBlueprint (string, identifier of target blueprint), many (boolean, true for many-to-many/one-to-many, false for one-to-one). Optional: title (string, human-readable title), required (boolean, default false). Example: { \"sourceBlueprint\": \"service\", \"relationName\": \"owner\", \"targetBlueprint\": \"_team\", \"many\": false }.",
  inputSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = validateArgs(args);
      if (!validation.ok) {
        return {
          content: [{ type: "text" as const, text: `Validation error: ${validation.message}` }],
          isError: true,
        };
      }

      const { sourceBlueprint, relationName, targetBlueprint, many, title, required } = validation.params;

      console.error(`[TOOL] setup_catalog_relations called with:`);
      console.error(`  sourceBlueprint: ${sourceBlueprint}`);
      console.error(`  relationName: ${relationName}`);
      console.error(`  targetBlueprint: ${targetBlueprint}`);
      console.error(`  many: ${many}`);

      // Step 1: Get the existing blueprint to preserve its current state
      const existingBlueprint = await getBlueprint(sourceBlueprint);
      if (!existingBlueprint) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Blueprint '${sourceBlueprint}' does not exist. Please create the blueprint first before adding relations.`,
            },
          ],
          isError: true,
        };
      }

      // Step 2: Prepare the relation object
      const relationObject: Record<string, any> = {
        target: targetBlueprint,
        many: many,
        required: required ?? false,
      };

      if (title) {
        relationObject.title = title;
      }

      // Step 3: Merge with existing relations (preserve existing ones)
      const existingRelations = existingBlueprint.relations || {};
      const updatedRelations = {
        ...existingRelations,
        [relationName]: relationObject,
      };

      // Step 4: Prepare PATCH payload (only update relations)
      const patchPayload = {
        relations: updatedRelations,
      };

      // Step 5: Execute PATCH request
      const token = await getAccessToken();
      try {
        const response = await axios.patch(
          `${PORT_API_URL}/blueprints/${sourceBlueprint}`,
          patchPayload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const updatedBlueprint = response.data.blueprint;

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully added relation '${relationName}' to blueprint '${sourceBlueprint}'.\n\n` +
                `Relation Details:\n` +
                `  - Name: ${relationName}\n` +
                `  - Target: ${targetBlueprint}\n` +
                `  - Many: ${many}\n` +
                `  - Required: ${required ?? false}\n` +
                (title ? `  - Title: ${title}\n` : "") +
                `\nUpdated blueprint relations:\n${JSON.stringify(updatedBlueprint.relations, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          const errorDetails = axiosError.response?.data || axiosError.message;
          console.error(`[Port API] Error updating blueprint '${sourceBlueprint}':`, errorDetails);
          
          let errorMessage = `Failed to add relation '${relationName}' to blueprint '${sourceBlueprint}'`;
          if (axiosError.response?.status === 400) {
            errorMessage += `: Validation error - ${JSON.stringify(errorDetails)}`;
          } else if (axiosError.response?.status === 404) {
            errorMessage += `: Blueprint not found`;
          } else if (axiosError.response?.status === 409) {
            errorMessage += `: Conflict - ${JSON.stringify(errorDetails)}`;
          } else {
            errorMessage += `: ${JSON.stringify(errorDetails)}`;
          }

          return {
            content: [
              {
                type: "text" as const,
                text: errorMessage,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    } catch (error) {
      console.error(`[TOOL] Error in setup_catalog_relations:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Unexpected error in setup_catalog_relations: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
