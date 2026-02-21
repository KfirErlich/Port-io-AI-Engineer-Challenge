// Skill for getting all scorecards across all blueprints
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getAllScorecards } from "../../PortApi/blueprints.js";

/** Zod schema for MCP SDK validation - no inputs required */
const inputSchema = z.object({});

/**
 * Skill: Get All Scorecards
 * Retrieves all scorecards across all blueprints in the organization.
 */
export const getAllScorecardsSkill = {
  name: "get_all_scorecards",
  description:
    "Retrieves all scorecards across all blueprints in the organization. INPUT: no parameters required; call with empty object {}.",
  inputSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      // Validate input (should be empty object)
      inputSchema.parse(args);

      console.error(`[TOOL] get_all_scorecards called`);

      const result = await getAllScorecards();

      if (result.success) {
        const scorecards = result.scorecards || [];
        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully retrieved ${scorecards.length} scorecard(s).\n\nScorecards:\n${JSON.stringify(scorecards, null, 2)}`,
            },
          ],
        };
      } else {
        const errorMessage = result.error ? JSON.stringify(result.error, null, 2) : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to retrieve scorecards.\n\nError details:\n${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in get_all_scorecards:`, error);
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
      return {
        content: [
          {
            type: "text" as const,
            text: `Unexpected error in get_all_scorecards: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
