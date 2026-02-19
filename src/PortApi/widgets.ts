// Widgets API functions
import axios, { AxiosError } from "axios";
import { getAccessToken } from "./auth.js";

const PORT_API_URL = "https://api.getport.io/v1";

/** Widget type constant required by Port API for this endpoint. */
const WIDGET_TYPE_AI_AGENT = "ai-agent";

/**
 * Add a widget to a page under a parent layout container.
 * Request body: { parentWidgetId, widget } where widget has exactly: id, updatedAt, updatedBy, createdAt, createdBy, type, title, description, agentIdentifier, icon, useMCP.
 * Port API requires widget.type to be the constant "ai-agent".
 */
export async function addWidgetToPage(
  pageIdentifier: string,
  parentWidgetId: string,
  widgetConfig: {
    type?: string;
    title: string;
    description?: string;
    agentIdentifier?: string;
    icon?: string;
    useMCP?: boolean;
  }
): Promise<{ success: boolean; widget?: any; error?: any }> {
  try {
    const token = await getAccessToken();

    const widget = {
      id: "",
      updatedAt: "",
      updatedBy: "",
      createdAt: "",
      createdBy: "",
      type: WIDGET_TYPE_AI_AGENT,
      title: widgetConfig.title,
      description: widgetConfig.description ?? "",
      agentIdentifier: widgetConfig.agentIdentifier ?? "",
      icon: widgetConfig.icon ?? "",
      useMCP: widgetConfig.useMCP ?? false,
    };

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
      
      // Log full error details for 400/422/404 responses
      if (axiosError.response?.status === 400 || axiosError.response?.status === 422 || axiosError.response?.status === 404) {
        console.error(`[Port API] Error adding widget to page '${pageIdentifier}':`, errorDetails);
      }
      
      return {
        success: false,
        error: errorDetails,
      };
    }
    throw error;
  }
}
