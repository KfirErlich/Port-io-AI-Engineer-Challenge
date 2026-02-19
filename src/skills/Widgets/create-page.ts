// Skill for creating a new page (dashboard or blueprint-entities page)
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodError } from "zod";
import { createPage } from "../../PortApi/pages.js";

/** Zod schema for MCP SDK validation */
const inputSchema = z.object({
  identifier: z.string().min(1, "page identifier is required"),
  title: z.string().min(1, "page title is required"),
  icon: z.string().optional(),
  type: z.enum(["dashboard", "blueprint-entities"]),
  description: z.string().optional(),
});

function validateCreatePageArgs(
  args: unknown
): { ok: true; pageData: { identifier: string; title: string; icon?: string; type: "dashboard" | "blueprint-entities"; description?: string } } | { ok: false; message: string } {
  try {
    const result = inputSchema.parse(args);
    return {
      ok: true,
      pageData: {
        identifier: result.identifier,
        title: result.title,
        icon: result.icon,
        type: result.type,
        description: result.description,
      },
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
 * Skill: Create Page
 * Creates a new dashboard or blueprint-entities page in Port.
 * This is the first step in building a dashboard - create the page container, then add widgets.
 */
export const createPageSkill = {
  name: "create_page",
  description:
    "Creates a new dashboard or blueprint-entities page in Port. This is the first step in building a dashboard - create the page container, then add widgets to it using 'add_widget_to_page'. INPUT: object with 'identifier' (string, page identifier), 'title' (string, page title), 'type' (enum: 'dashboard' or 'blueprint-entities', usually 'dashboard'), 'icon' (string, optional), and 'description' (string, optional). Widgets should be added separately using 'add_widget_to_page' after the page is created.",
  inputSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = validateCreatePageArgs(args);
      if (!validation.ok) {
        return {
          content: [{ type: "text" as const, text: `Validation error: ${validation.message}` }],
          isError: true,
        };
      }

      const { pageData } = validation;

      console.error(`[TOOL] create_page called: identifier=${pageData.identifier}, title=${pageData.title}, type=${pageData.type}`);

      const result = await createPage(pageData);

      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully created page '${pageData.identifier}' (${pageData.type}).\n\nPage details:\n${JSON.stringify(result.page, null, 2)}\n\nYou can now use 'add_widget_to_page' to add widgets to this page.`,
            },
          ],
        };
      } else {
        const errorMessage = result.error ? JSON.stringify(result.error, null, 2) : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to create page '${pageData.identifier}'.\n\nError details:\n${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in create_page:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Unexpected error in create_page: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
