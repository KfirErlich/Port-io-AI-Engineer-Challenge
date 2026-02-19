// Skill for adding a widget to an existing page
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodError } from "zod";
import { addWidgetToPage } from "../../PortApi/widgets.js";

/** Zod schema for MCP SDK validation */
const inputSchema = z.object({
  pageIdentifier: z.string().min(1, "page identifier is required"),
  parentWidgetId: z.string().min(1, "parentWidgetId is required"),
  widgetConfig: z.object({
    type: z.string().min(1, "widget type is required"),
    title: z.string().min(1, "widget title is required"),
    description: z.string().optional(),
    agentIdentifier: z.string().optional(),
    icon: z.string().optional(),
    useMCP: z.boolean().optional(),
  }),
});

function validateAddWidgetToPageArgs(
  args: unknown
): { ok: true; pageIdentifier: string; parentWidgetId: string; widgetConfig: { type: string; title: string; description?: string; agentIdentifier?: string; icon?: string; useMCP?: boolean } } | { ok: false; message: string } {
  try {
    const result = inputSchema.parse(args);
    return {
      ok: true,
      pageIdentifier: result.pageIdentifier,
      parentWidgetId: result.parentWidgetId,
      widgetConfig: {
        type: result.widgetConfig.type,
        title: result.widgetConfig.title,
        description: result.widgetConfig.description,
        agentIdentifier: result.widgetConfig.agentIdentifier,
        icon: result.widgetConfig.icon,
        useMCP: result.widgetConfig.useMCP,
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
 * Skill: Add Widget to Page
 * Adds a specific widget to an existing Port page (dashboard or blueprint-entities page).
 * The widget configuration's 'data' field is automatically mapped to the correct Port API fields
 * based on the widget type (e.g., dataset for tables, property for charts).
 */
export const addWidgetToPageSkill = {
  name: "add_widget_to_page",
  description:
    "Adds a widget to a Port page. INPUT: pageIdentifier, parentWidgetId, widgetConfig with type (string), title (string), and optional description, agentIdentifier (string), icon (string), useMCP (boolean). Sends only: parentWidgetId and widget (id, updatedAt, updatedBy, createdAt, createdBy, type, title, description, agentIdentifier, icon, useMCP).",
  inputSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = validateAddWidgetToPageArgs(args);
      if (!validation.ok) {
        return {
          content: [{ type: "text" as const, text: `Validation error: ${validation.message}` }],
          isError: true,
        };
      }

      const { pageIdentifier, parentWidgetId, widgetConfig } = validation;

      console.error(`[TOOL] add_widget_to_page called: pageIdentifier=${pageIdentifier}, parentWidgetId=${parentWidgetId}, widgetType=${widgetConfig.type}, title=${widgetConfig.title}`);

      const result = await addWidgetToPage(pageIdentifier, parentWidgetId, widgetConfig);

      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully added widget '${widgetConfig.title}' (${widgetConfig.type}) to page '${pageIdentifier}'.\n\nWidget details:\n${JSON.stringify(result.widget, null, 2)}`,
            },
          ],
        };
      } else {
        const errorMessage = result.error ? JSON.stringify(result.error, null, 2) : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to add widget '${widgetConfig.title}' to page '${pageIdentifier}'.\n\nError details:\n${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in add_widget_to_page:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Unexpected error in add_widget_to_page: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
