// Widgets API functions
import axios, { AxiosError } from "axios";
import { getAccessToken } from "./auth.js";

const PORT_API_URL = "https://api.getport.io/v1";

/** Port API expects specific type names; map common aliases to the canonical type. */
const WIDGET_TYPE_ALIASES: Record<string, string> = {
  "pie-chart": "entities-pie-chart",
  "pie_chart": "entities-pie-chart",
  "table": "entities-table",
};

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
 * Strictly follows Port's widget API structure with property# prefixing and proper dataset defaults.
 */
export async function addWidgetToPage(
  pageIdentifier: string,
  parentWidgetId: string,
  widgetConfig: {
    type: string;
    title: string;
    description?: string;
    blueprint?: string;
    property?: string;
    icon?: string;
    dataset?: { combinator: string; rules: any[] };
    [key: string]: unknown;
  }
): Promise<{ success: boolean; widget?: any; error?: any }> {
  try {
    const token = await getAccessToken();
    
    // Map incoming type to Port's canonical type
    const rawType = widgetConfig.type || "ai-agent";
    const type = WIDGET_TYPE_ALIASES[rawType] ?? rawType;
    
    // Format property with property# prefix if it exists
    let formattedProperty: string | undefined;
    if (widgetConfig.property) {
      formattedProperty = widgetConfig.property.startsWith("property#")
        ? widgetConfig.property
        : `property#${widgetConfig.property}`;
    }
    
    // Build widget payload following Port's exact structure
    const widget: Record<string, unknown> = {
      type,
      title: widgetConfig.title,
      icon: widgetConfig.icon || "Pie",
      dataset: widgetConfig.dataset || { combinator: "and", rules: [] },
      description: widgetConfig.description || "",
    };
    
    // Add blueprint if provided
    if (widgetConfig.blueprint) {
      widget.blueprint = widgetConfig.blueprint;
    }
    
    // Add formatted property if provided
    if (formattedProperty) {
      widget.property = formattedProperty;
    }
    
    // Build request body with clean structure
    const requestBody = {
      widget,
      parentWidgetId,
    };

    const response = await axios.post(
      `${PORT_API_URL}/pages/${pageIdentifier}/widgets`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
          JSON.stringify(errorDetails, null, 2)
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
