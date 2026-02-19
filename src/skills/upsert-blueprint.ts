// Atomic skill for creating or updating a single blueprint
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodError } from "zod";
import { upsertBlueprint } from "../port-api.js";

/** Zod schema for MCP SDK validation */
const inputSchema = z.object({
  blueprint: z.object({
    identifier: z.string().min(1, "identifier is required and must be a non-empty string"),
    title: z.string().min(1, "title is required and must be a non-empty string"),
    icon: z.string().optional(),
    schema: z.object({
      properties: z.record(z.string(), z.any()).optional(),
      required: z.array(z.string()).optional(),
    }).optional(),
    relations: z.record(z.string(), z.any()).optional(),
    mirrorProperties: z.record(z.string(), z.any()).optional(),
    calculationProperties: z.record(z.string(), z.any()).optional(),
    aggregationProperties: z.record(z.string(), z.any()).optional(),
  }).passthrough(), // Allow additional properties
});

function validateUpsertBlueprintArgs(args: unknown): { ok: true; blueprint: Record<string, unknown> } | { ok: false; message: string } {
  try {
    const result = inputSchema.parse(args);
    return { ok: true, blueprint: result.blueprint as Record<string, unknown> };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, message: `Validation error: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}` };
    }
    return { ok: false, message: `Validation error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Atomic skill: Create or update a single blueprint
 * Use this for custom infrastructure design or specific modifications.
 * Allows the AI to create or modify a single blueprint dynamically based on conversation context.
 */
export const upsertBlueprintSkill = {
  name: "upsert_blueprint",
  description:
    "Create or update a single blueprint in Port. Use when the user needs a custom property (e.g., 'sla_level', 'documentation_url') or a custom blueprint. INPUT: Pass a single object with one required key 'blueprint' (object). The blueprint object must have: identifier (string), title (string); and may have: icon (string), schema (object with 'properties' and optional 'required'), relations (object), mirrorProperties (object). Example: { \"blueprint\": { \"identifier\": \"service\", \"title\": \"Service\", \"schema\": { \"properties\": { \"description\": { \"type\": \"string\" } }, \"required\": [\"description\"] } } }.",
  inputSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = validateUpsertBlueprintArgs(args);
      if (!validation.ok) {
        return {
          content: [{ type: "text" as const, text: `Validation error: ${validation.message}` }],
          isError: true,
        };
      }
      const blueprint = validation.blueprint;

      console.error(`[TOOL] upsert_blueprint called with identifier: ${blueprint.identifier}`);

      const result = await upsertBlueprint(blueprint);

      if (result.success) {
        const operationText = result.operation === "created" ? "created" : "updated";
        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully ${operationText} blueprint '${blueprint.identifier}'.\n\nOperation: ${result.operation}\nMessage: ${result.message}\n\nBlueprint details:\n${JSON.stringify(result.blueprint, null, 2)}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to ${result.operation === "error" ? "process" : result.operation} blueprint '${blueprint.identifier}'.\n\nError: ${result.message}\n\nDetails: ${JSON.stringify(result.error ?? {}, null, 2)}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in upsert_blueprint:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Unexpected error in upsert_blueprint: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
