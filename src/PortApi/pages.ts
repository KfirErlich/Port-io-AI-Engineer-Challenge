// Pages API functions
import axios, { AxiosError } from "axios";
import { getAccessToken } from "./auth.js";

const PORT_API_URL = "https://api.getport.io/v1";

/**
 * List all pages in the portal. Returns identifier and title for each page.
 */
export async function listPages(): Promise<{ identifier: string; title: string }[]> {
  const token = await getAccessToken();
  const response = await axios.get(`${PORT_API_URL}/pages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const raw = response.data.pages ?? response.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map((p: any) => ({
    identifier: p.identifier ?? p.id ?? "",
    title: p.title ?? "",
  }));
}

/**
 * Get a page by identifier (full response including widgets array for layout container ids).
 */
export async function getPage(identifier: string): Promise<any> {
  const token = await getAccessToken();
  const response = await axios.get(
    `${PORT_API_URL}/pages/${identifier}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.page ?? response.data;
}

/** Root dashboard-widget id we send when creating a dashboard page; Port may return the same or a server id. */
const ROOT_DASHBOARD_WIDGET_ID = "root";

/**
 * Create a new page (dashboard or blueprint-entities page).
 * For dashboards, the root dashboard-widget is included in the initial POST /v1/pages so the page
 * is ready to accept widgets; returns rootWidgetId for use as parentWidgetId in add_widget_to_page.
 */
export async function createPage(
  pageData: {
    identifier: string;
    title: string;
    icon?: string;
    type: "dashboard" | "blueprint-entities";
    description?: string;
  }
): Promise<{ success: boolean; page?: any; rootWidgetId?: string; error?: any }> {
  try {
    const token = await getAccessToken();

    // Port only allows adding widgets under a widget of type dashboard-widget. So we include the root
    // dashboard-widget in the initial page creation (POST /v1/pages) instead of a second API call.
    const initialWidgets =
      pageData.type === "dashboard"
        ? [
            {
              type: "dashboard-widget",
              id: ROOT_DASHBOARD_WIDGET_ID,
              layout: [{ height: 400, columns: [] }],
              widgets: [],
            },
          ]
        : [];

    const requestBody: any = {
      identifier: pageData.identifier,
      title: pageData.title,
      type: pageData.type,
      widgets: initialWidgets,
    };

    if (pageData.icon) {
      requestBody.icon = pageData.icon;
    }

    if (pageData.description) {
      requestBody.description = pageData.description;
    }

    const response = await axios.post(
      `${PORT_API_URL}/pages`,
      requestBody,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const page = response.data.page || response.data;

    if (pageData.type === "dashboard") {
      const rootWidget = Array.isArray(page?.widgets) ? page.widgets[0] : undefined;
      const rootWidgetId = rootWidget?.id ?? ROOT_DASHBOARD_WIDGET_ID;
      return {
        success: true,
        page,
        rootWidgetId,
      };
    }

    return {
      success: true,
      page,
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
          `[Port API] Error creating page '${pageData.identifier}':`,
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
