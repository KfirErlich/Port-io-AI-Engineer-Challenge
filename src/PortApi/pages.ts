// Pages API functions
import axios, { AxiosError } from "axios";
import { getAccessToken } from "./auth.js";

const PORT_API_URL = "https://api.getport.io/v1";

/**
 * Create a new page (dashboard or blueprint-entities page)
 */
export async function createPage(
  pageData: {
    identifier: string;
    title: string;
    icon?: string;
    type: "dashboard" | "blueprint-entities";
    description?: string;
  }
): Promise<{ success: boolean; page?: any; error?: any }> {
  try {
    const token = await getAccessToken();
    
    // Build request body
    // Per API schema: widgets must be an array (can be empty), never null or undefined
    // Port's UI crashes if widgets is null/undefined, so we always send an empty array
    const requestBody: any = {
      identifier: pageData.identifier,
      title: pageData.title,
      type: pageData.type,
      widgets: [], // Always send empty array - required by Port API and prevents UI crashes
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
    return {
      success: true,
      page: response.data.page || response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorDetails = axiosError.response?.data || axiosError.message;
      
      // Log full error details for 400/422/404 responses
      if (axiosError.response?.status === 400 || axiosError.response?.status === 422 || axiosError.response?.status === 404) {
        console.error(`[Port API] Error creating page '${pageData.identifier}':`, errorDetails);
      }
      
      return {
        success: false,
        error: errorDetails,
      };
    }
    throw error;
  }
}
