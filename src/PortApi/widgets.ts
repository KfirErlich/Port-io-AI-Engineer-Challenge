// Widgets API functions
import axios, { AxiosError } from "axios";
import { getAccessToken } from "./auth.js";

const PORT_API_URL = "https://api.getport.io/v1";

/** Port API expects specific type names; map common aliases to the canonical type. */
const WIDGET_TYPE_ALIASES: Record<string, string> = {
  "pie-chart": "entities-pie-chart",
  "pie_chart": "entities-pie-chart",
};

/** Build the minimal widget payload expected by Port (id, updatedAt, etc. as empty strings for create). */
function buildWidgetPayload(
  type: string,
  config: {
    title: string;
    description?: string;
    agentIdentifier?: string;
    icon?: string;
    useMCP?: boolean;
    [key: string]: unknown;
  }
): Record<string, unknown> {
  const normalizedType = WIDGET_TYPE_ALIASES[type] ?? type;
  // Port API validation requires agentIdentifier on all widget payloads; use empty string for non-ai-agent.
  const base: Record<string, unknown> = {
    id: "",
    updatedAt: "",
    updatedBy: "",
    createdAt: "",
    createdBy: "",
    type: normalizedType,
    title: config.title,
    description: config.description ?? "",
    icon: config.icon ?? "",
    agentIdentifier: normalizedType === "ai-agent" ? (config.agentIdentifier ?? "") : "",
  };
  if (normalizedType === "ai-agent") {
    return {
      ...base,
      useMCP: config.useMCP ?? false,
    };
  }
  if (normalizedType === "entities-pie-chart") {
    // Pie chart requires blueprint and property (Breakdown by property); ensure they are included.
    return {
      ...base,
      ...Object.fromEntries(
        Object.entries(config).filter(
          ([k]) => !["title", "description", "icon", "agentIdentifier"].includes(k)
        )
      ),
    } as Record<string, unknown>;
  }
  // Pass through any extra fields for other widget types (markdown, table-entities-explorer, etc.)
  const { title, description, icon, agentIdentifier: _ai, ...rest } = config;
  return { ...base, ...rest } as Record<string, unknown>;
}

/**
 * Create the root dashboard-widget container on a page (POST /v1/pages/{page_identifier}/widgets).
 * Call this after creating a dashboard page so the page can accept child widgets.
 * parentWidgetId must be the page's id (from the create-page response).
 * Returns the created widget's id for use as parentWidgetId when adding child widgets.
 */
export async function createRootDashboardWidget(
  pageIdentifier: string,
  parentWidgetId: string
): Promise<{ success: boolean; rootWidgetId?: string; error?: any }> {
  try {
    const token = await getAccessToken();

    const widget = {
      id: "",
      updatedAt: "",
      updatedBy: "",
      createdAt: "",
      createdBy: "",
      type: "dashboard-widget",
      layout: [{ height: 400, columns: [] }],
      widgets: [],
    };

    const requestBody = { parentWidgetId, widget };

    const response = await axios.post(
      `${PORT_API_URL}/pages/${pageIdentifier}/widgets`,
      requestBody,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const created = response.data.widget ?? response.data;
    const rootWidgetId = created?.id ?? created?.widget?.id;
    return {
      success: true,
      rootWidgetId: rootWidgetId ?? undefined,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorDetails = axiosError.response?.data || axiosError.message;
      if (
        axiosError.response?.status === 400 ||
        axiosError.response?.status === 403 ||
        axiosError.response?.status === 422 ||
        axiosError.response?.status === 404
      ) {
        console.error(
          `[Port API] Error creating root dashboard-widget on page '${pageIdentifier}':`,
          errorDetails
        );
      }
      return {
        success: false,
        error: errorDetails,
      };
    }
    throw error;
  }
}

/**
 * Add a widget to a page under a parent layout container (must be a dashboard-widget).
 * Supports any widget type (ai-agent, markdown, table-entities-explorer, etc.); pass type and type-specific fields in widgetConfig.
 */
export async function addWidgetToPage(
  pageIdentifier: string,
  parentWidgetId: string,
  widgetConfig: {
    type: string;
    title: string;
    description?: string;
    agentIdentifier?: string;
    icon?: string;
    useMCP?: boolean;
    [key: string]: unknown;
  }
): Promise<{ success: boolean; widget?: any; error?: any }> {
  try {
    const token = await getAccessToken();
    const rawType = widgetConfig.type || "ai-agent";
    const type = WIDGET_TYPE_ALIASES[rawType] ?? rawType;
    const widget = buildWidgetPayload(type, widgetConfig);

    const requestBody = {
      parentWidgetId,
      widget,
    };

    const response = await axios.post(
      `${PORT_API_URL}/pages/${pageIdentifier}/widgets`,
      requestBody,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return {
      success: true,
      widget: response.data.widget || response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorDetails = axiosError.response?.data || axiosError.message;

      if (
        axiosError.response?.status === 400 ||
        axiosError.response?.status === 422 ||
        axiosError.response?.status === 404
      ) {
        console.error(
          `[Port API] Error adding widget to page '${pageIdentifier}':`,
          errorDetails
        );
      }

      return {
        success: false,
        error: errorDetails,
      };
    }
    throw error;
  }
}
