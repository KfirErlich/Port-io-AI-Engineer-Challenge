// Skill: List Pages
// Returns all pages in the portal with identifier and title (for safe widget injection).
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { listPages } from "../../PortApi/index.js";

/** Zod schema for MCP SDK validation - no inputs required */
const listPagesSchema = z.object({});

export const listPagesSkill = {
  name: "list_pages",
  description:
    "Returns a list of all pages in the Port portal with their identifier and title. Use this to discover existing pages before injecting widgets (e.g. with add_widget_to_page). For full page structure including widgets and rootWidgetId, use get_page. INPUT: no parameters required; call with empty object {}.",
  inputSchema: listPagesSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      listPagesSchema.parse(args);

      console.error(`[TOOL] list_pages called`);

      const pages = await listPages();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(pages, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error(`[TOOL] Error in list_pages:`, error);
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
            text: `Unexpected error in list_pages: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
