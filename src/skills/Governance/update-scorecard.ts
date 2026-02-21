// Skill for updating an existing scorecard
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodError } from "zod";
import { updateScorecard } from "../../PortApi/blueprints.js";

/** Zod schema for MCP SDK validation */
const inputSchema = z.object({
  blueprint: z.string().min(1, "blueprint identifier is required"),
  scorecardIdentifier: z.string().min(1, "scorecard identifier is required"),
  scorecard: z.object({
    identifier: z.string().min(1, "scorecard identifier is required"),
    title: z.string().min(1, "scorecard title is required"),
    rules: z.array(z.any()),
    levels: z.array(z.any()),
    filter: z.any().optional(),
  }),
});

function validateUpdateScorecardArgs(
  args: unknown
): { ok: true; blueprint: string; scorecardIdentifier: string; scorecard: Record<string, unknown> } | { ok: false; message: string } {
  try {
    const result = inputSchema.parse(args);
    return {
      ok: true,
      blueprint: result.blueprint,
      scorecardIdentifier: result.scorecardIdentifier,
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
 * Skill: Update Scorecard
 * Updates an existing Scorecard's definition, levels, or rules.
 */
export const updateScorecardSkill = {
  name: "update_scorecard",
  description:
    "Updates an existing Scorecard's definition, levels, or rules. INPUT: object with 'blueprint' (string, blueprint identifier), 'scorecardIdentifier' (string, existing scorecard identifier), and 'scorecard' (object with: identifier (string), title (string), rules (array), levels (array), filter (optional object)). If filter is not provided, defaults to { combinator: 'and', conditions: [] }.",
  inputSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = validateUpdateScorecardArgs(args);
      if (!validation.ok) {
        return {
          content: [{ type: "text" as const, text: `Validation error: ${validation.message}` }],
          isError: true,
        };
      }

      const { blueprint, scorecardIdentifier, scorecard } = validation;

      console.error(`[TOOL] update_scorecard called for blueprint: ${blueprint}, scorecard: ${scorecardIdentifier}`);

      const result = await updateScorecard(blueprint, scorecardIdentifier, scorecard as any);

      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully updated scorecard '${scorecardIdentifier}' for blueprint '${blueprint}'.\n\nScorecard details:\n${JSON.stringify(result.scorecard, null, 2)}`,
            },
          ],
        };
      } else {
        const errorMessage = result.error ? JSON.stringify(result.error, null, 2) : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to update scorecard '${scorecardIdentifier}' for blueprint '${blueprint}'.\n\nError details:\n${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in update_scorecard:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Unexpected error in update_scorecard: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
