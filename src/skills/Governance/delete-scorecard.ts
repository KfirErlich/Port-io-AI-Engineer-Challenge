// Skill for deleting a scorecard
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodError } from "zod";
import { deleteScorecard } from "../../PortApi/blueprints.js";

/** Zod schema for MCP SDK validation - plain object to avoid registration errors */
const inputSchema = z.object({
  blueprint: z.string().min(1, "blueprint identifier is required"),
  scorecardIdentifier: z.string().min(1, "scorecard identifier is required"),
});

function validateDeleteScorecardArgs(
  args: unknown
): { ok: true; blueprint: string; scorecardIdentifier: string } | { ok: false; message: string } {
  try {
    const result = inputSchema.parse(args);
    return {
      ok: true,
      blueprint: result.blueprint,
      scorecardIdentifier: result.scorecardIdentifier,
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
 * Skill: Delete Scorecard
 * Deletes an existing scorecard from a blueprint.
 */
export const deleteScorecardSkill = {
  name: "delete_scorecard",
  description:
    "Deletes an existing scorecard from a blueprint. INPUT: object with 'blueprint' (string, blueprint identifier) and 'scorecardIdentifier' (string, scorecard identifier to delete).",
  inputSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = validateDeleteScorecardArgs(args);
      if (!validation.ok) {
        return {
          content: [{ type: "text" as const, text: `Validation error: ${validation.message}` }],
          isError: true,
        };
      }

      const { blueprint, scorecardIdentifier } = validation;

      console.error(`[TOOL] delete_scorecard called for blueprint: ${blueprint}, scorecard: ${scorecardIdentifier}`);

      const result = await deleteScorecard(blueprint, scorecardIdentifier);

      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully deleted scorecard '${scorecardIdentifier}' from blueprint '${blueprint}'.`,
            },
          ],
        };
      } else {
        const errorMessage = result.error ? JSON.stringify(result.error, null, 2) : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to delete scorecard '${scorecardIdentifier}' from blueprint '${blueprint}'.\n\nError details:\n${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in delete_scorecard:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Unexpected error in delete_scorecard: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
