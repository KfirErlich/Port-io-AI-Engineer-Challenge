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

/**
 * Create a new page (dashboard or blueprint-entities page).
 * For dashboards, the root dashboard-widget is included in the initial POST /v1/pages so the page
 * is ready to accept widgets; returns rootWidgetId for use as parentWidgetId in add_widget_to_page.
 * 
 * If the page identifier already exists, gracefully handles it by retrieving the existing page
 * and returning its root widget ID instead of failing.
 */
export async function createPage(
  pageData: {
    identifier: string;
    title: string;
    icon?: string;
    type: "dashboard" | "blueprint-entities";
    description?: string;
    showInSidebar?: boolean;
    section?: string;
  }
): Promise<{ success: boolean; page?: any; rootWidgetId?: string; error?: any }> {
  try {
    const token = await getAccessToken();

    // Port only allows adding widgets under a widget of type dashboard-widget. So we include the root
    // dashboard-widget in the initial page creation (POST /v1/pages) instead of a second API call.
    // Use the exact structure required by Port's API: layout: [] (empty array), not layout: [{ height, columns }]
    const initialWidgets =
      pageData.type === "dashboard"
        ? [
            {
              type: "dashboard-widget",
              layout: [],
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

    if (pageData.showInSidebar !== undefined) {
      requestBody.showInSidebar = pageData.showInSidebar;
    }

    if (pageData.section) {
      requestBody.section = pageData.section;
    }

    try {
      const response = await axios.post(
        `${PORT_API_URL}/pages`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const page = response.data.page || response.data;

      if (pageData.type === "dashboard") {
        // Extract the root widget ID from the response
        // The root widget should be the first widget in the widgets array
        const rootWidget = Array.isArray(page?.widgets) ? page.widgets[0] : undefined;
        const rootWidgetId = rootWidget?.id;
        
        if (!rootWidgetId) {
          console.error(
            `[Port API] Warning: Created dashboard page '${pageData.identifier}' but could not extract rootWidgetId from response`
          );
        }

        return {
          success: true,
          page,
          rootWidgetId: rootWidgetId || undefined,
        };
      }

      return {
        success: true,
        page,
      };
    } catch (postError) {
      // Handle case where page identifier already exists
      if (axios.isAxiosError(postError)) {
        const axiosError = postError as AxiosError;
        
        // Check if it's a conflict error (409) or similar indicating page already exists
        if (
          axiosError.response?.status === 409 ||
          (axiosError.response?.status === 400 &&
           typeof axiosError.response?.data === "object" &&
           axiosError.response.data !== null &&
           "message" in axiosError.response.data &&
           typeof axiosError.response.data.message === "string" &&
           axiosError.response.data.message.toLowerCase().includes("already exists"))
        ) {
          console.error(
            `[Port API] Page '${pageData.identifier}' already exists, retrieving existing page...`
          );
          
          // Retrieve the existing page and return its root widget ID
          try {
            const existingPage = await getPage(pageData.identifier);
            
            if (pageData.type === "dashboard") {
              const rootWidget = Array.isArray(existingPage?.widgets)
                ? existingPage.widgets.find((w: any) => w.type === "dashboard-widget") || existingPage.widgets[0]
                : undefined;
              const rootWidgetId = rootWidget?.id;
              
              if (!rootWidgetId) {
                console.error(
                  `[Port API] Warning: Retrieved existing dashboard page '${pageData.identifier}' but could not find rootWidgetId`
                );
              }

              return {
                success: true,
                page: existingPage,
                rootWidgetId: rootWidgetId || undefined,
              };
            }

            return {
              success: true,
              page: existingPage,
            };
          } catch (getError) {
            console.error(
              `[Port API] Error retrieving existing page '${pageData.identifier}':`,
              getError
            );
            // Fall through to return the original error
          }
        }

        // For other errors, log and return error details
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
      throw postError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Port API] Unexpected error in createPage:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
