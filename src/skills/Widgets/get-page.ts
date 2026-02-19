// Skill: Get Page
// Retrieves full page JSON from Port, including widgets array for layout container ids.
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getPage } from "../../PortApi/index.js";

/** Zod schema for MCP SDK validation */
const getPageSchema = z.object({
  identifier: z.string(),
});

export const getPageSkill = {
  name: "get_page",
  description:
    "Retrieves the full page JSON from Port for a given page identifier. Returns the complete response including the widgets array, so the Agent can extract id fields of existing layout containers. INPUT: object with 'identifier' (string, the page identifier).",
  inputSchema: getPageSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = getPageSchema.parse(args);
      const { identifier } = validation;

      console.error(`[TOOL] get_page called: identifier=${identifier}`);

      try {
        const page = await getPage(identifier);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(page, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Port API] Error fetching page:`, errorMessage);

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to fetch page '${identifier}': ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in get_page:`, error);
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
            text: `Unexpected error in get_page: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
