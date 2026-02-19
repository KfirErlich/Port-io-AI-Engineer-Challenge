// Skill for adding a widget to an existing page
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodError } from "zod";
import { addWidgetToPage } from "../../PortApi/widgets.js";

/** Zod schema for MCP SDK validation */
const inputSchema = z.object({
  pageIdentifier: z.string().min(1, "page identifier is required"),
  widgetConfig: z.object({
    type: z.string().min(1, "widget type is required"),
    title: z.string().min(1, "widget title is required"),
    data: z.any().optional(), // Widget-specific configuration (dataset, query, property, etc.)
  }),
});

function validateAddWidgetToPageArgs(
  args: unknown
): { ok: true; pageIdentifier: string; widgetConfig: { type: string; title: string; data?: any } } | { ok: false; message: string } {
  try {
    const result = inputSchema.parse(args);
    return {
      ok: true,
      pageIdentifier: result.pageIdentifier,
      widgetConfig: {
        type: result.widgetConfig.type,
        title: result.widgetConfig.title,
        data: result.widgetConfig.data,
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
    "Adds a specific widget to an existing Port page (dashboard or blueprint-entities page). The widget configuration's 'data' field is automatically mapped to the correct Port API fields based on the widget type. INPUT: object with 'pageIdentifier' (string, the page identifier where the widget will be added) and 'widgetConfig' (object with: type (string, widget type like 'table-entities-explorer', 'pie-chart', 'bar-chart', 'markdown', 'scorecards-bar-chart', etc.), title (string, widget title), and data (optional object containing widget-specific configuration like dataset, query, property, blueprint, scorecard, content, etc.)).",
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

      const { pageIdentifier, widgetConfig } = validation;

      console.error(`[TOOL] add_widget_to_page called: pageIdentifier=${pageIdentifier}, widgetType=${widgetConfig.type}, title=${widgetConfig.title}`);

      const result = await addWidgetToPage(pageIdentifier, widgetConfig);

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
