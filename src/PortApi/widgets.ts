// Widgets API functions
import axios, { AxiosError } from "axios";
import { getAccessToken } from "./auth.js";

const PORT_API_URL = "https://api.getport.io/v1";

/**
 * Add a widget to a page with dynamic data mapping
 * Maps the 'data' field from widgetConfig into the correct Port API fields based on widget type
 */
export async function addWidgetToPage(
  pageIdentifier: string,
  widgetConfig: {
    type: string;
    title: string;
    data?: any; // Contains widget-specific configuration (dataset, query, etc.)
  }
): Promise<{ success: boolean; widget?: any; error?: any }> {
  try {
    const token = await getAccessToken();
    
    // Build the widget payload based on type
    let requestBody: any = {
      type: widgetConfig.type,
      title: widgetConfig.title,
    };
    
    // Map the 'data' field into the correct Port API structure based on widget type
    if (widgetConfig.data) {
      // For table widgets (table-entities-explorer), data contains dataset/query
      if (widgetConfig.type === "table-entities-explorer" || widgetConfig.type.includes("table")) {
        if (widgetConfig.data.dataset) {
          requestBody.dataset = widgetConfig.data.dataset;
        }
        if (widgetConfig.data.query) {
          requestBody.query = widgetConfig.data.query;
        }
        // Copy other table-specific properties
        Object.keys(widgetConfig.data).forEach(key => {
          if (key !== "dataset" && key !== "query") {
            requestBody[key] = widgetConfig.data[key];
          }
        });
      }
      // For chart widgets (pie-chart, bar-chart, etc.), data contains dataset and property
      else if (widgetConfig.type.includes("chart") || widgetConfig.type.includes("pie") || widgetConfig.type.includes("bar")) {
        if (widgetConfig.data.dataset) {
          requestBody.dataset = widgetConfig.data.dataset;
        }
        if (widgetConfig.data.property) {
          requestBody.property = widgetConfig.data.property;
        }
        // Copy other chart-specific properties
        Object.keys(widgetConfig.data).forEach(key => {
          if (key !== "dataset" && key !== "property") {
            requestBody[key] = widgetConfig.data[key];
          }
        });
      }
      // For scorecard widgets
      else if (widgetConfig.type.includes("scorecard")) {
        if (widgetConfig.data.blueprint) {
          requestBody.blueprint = widgetConfig.data.blueprint;
        }
        if (widgetConfig.data.scorecard) {
          requestBody.scorecard = widgetConfig.data.scorecard;
        }
        // Copy other scorecard-specific properties
        Object.keys(widgetConfig.data).forEach(key => {
          if (key !== "blueprint" && key !== "scorecard") {
            requestBody[key] = widgetConfig.data[key];
          }
        });
      }
      // For markdown widgets
      else if (widgetConfig.type === "markdown") {
        if (widgetConfig.data.content) {
          requestBody.content = widgetConfig.data.content;
        }
        // Copy other markdown-specific properties
        Object.keys(widgetConfig.data).forEach(key => {
          if (key !== "content") {
            requestBody[key] = widgetConfig.data[key];
          }
        });
      }
      // For other widget types, merge all data properties
      else {
        Object.assign(requestBody, widgetConfig.data);
      }
    }
    
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
