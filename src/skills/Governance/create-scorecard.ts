// Skill for creating a new scorecard for a blueprint
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodError } from "zod";
import { createScorecard } from "../../PortApi/blueprints.js";

/** Zod schema for MCP SDK validation */
const inputSchema = z.object({
  blueprint: z.string().min(1, "blueprint identifier is required"),
  scorecard: z.object({
    identifier: z.string().min(1, "scorecard identifier is required"),
    title: z.string().min(1, "scorecard title is required"),
    rules: z.array(z.any()),
    levels: z.array(z.any()),
    filter: z.any().optional(),
  }),
});

function validateCreateScorecardArgs(
  args: unknown
): { ok: true; blueprint: string; scorecard: Record<string, unknown> } | { ok: false; message: string } {
  try {
    const result = inputSchema.parse(args);
    return {
      ok: true,
      blueprint: result.blueprint,
      scorecard: result.scorecard as Record<string, unknown>,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        message: `Validation error: ${error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
      };
    }
    return {
      ok: false,
      message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Skill: Create Scorecard
 * Creates a new Scorecard for a specific blueprint to monitor service maturity and production readiness.
 */
export const createScorecardSkill = {
  name: "create_scorecard",
  description:
    "Creates a new Scorecard for a specific blueprint to monitor service maturity and production readiness. INPUT: object with 'blueprint' (string, blueprint identifier) and 'scorecard' (object with: identifier (string), title (string), rules (array), levels (array), filter (optional object)). If filter is not provided, defaults to { combinator: 'and', conditions: [] }.",
  inputSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = validateCreateScorecardArgs(args);
      if (!validation.ok) {
        return {
          content: [{ type: "text" as const, text: `Validation error: ${validation.message}` }],
          isError: true,
        };
      }

      const { blueprint, scorecard } = validation;

      console.error(`[TOOL] create_scorecard called for blueprint: ${blueprint}, scorecard: ${scorecard.identifier}`);

      const result = await createScorecard(blueprint, scorecard as any);

      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully created scorecard '${scorecard.identifier}' for blueprint '${blueprint}'.\n\nScorecard details:\n${JSON.stringify(result.scorecard, null, 2)}`,
            },
          ],
        };
      } else {
        const errorMessage = result.error ? JSON.stringify(result.error, null, 2) : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to create scorecard '${scorecard.identifier}' for blueprint '${blueprint}'.\n\nError details:\n${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in create_scorecard:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Unexpected error in create_scorecard: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
