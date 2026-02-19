// Actions API functions
import axios, { AxiosError } from "axios";
import { getAccessToken } from "./auth.js";

const PORT_API_URL = "https://api.getport.io/v1";

/**
 * Create a new self-service action
 */
export async function createAction(
  actionData: {
    identifier: string;
    title?: string;
    trigger?: any;
    invocationMethod?: any;
    description?: string;
    publish?: boolean;
  }
): Promise<{ success: boolean; action?: any; error?: any }> {
  try {
    const token = await getAccessToken();
    const response = await axios.post(
      `${PORT_API_URL}/actions`,
      actionData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return {
      success: true,
      action: response.data.action || response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorDetails = axiosError.response?.data || axiosError.message;
      
      // Log full error details for 400/422/404 responses
      if (axiosError.response?.status === 400 || axiosError.response?.status === 422 || axiosError.response?.status === 404) {
        console.error(`[Port API] Error creating action '${actionData.identifier}':`, errorDetails);
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
 * Update an existing self-service action
 */
export async function updateAction(
  identifier: string,
  actionData: {
    title?: string;
    trigger?: any;
    invocationMethod?: any;
    description?: string;
    publish?: boolean;
  }
): Promise<{ success: boolean; action?: any; error?: any }> {
  try {
    const token = await getAccessToken();
    const response = await axios.patch(
      `${PORT_API_URL}/actions/${identifier}`,
      actionData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return {
      success: true,
      action: response.data.action || response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorDetails = axiosError.response?.data || axiosError.message;
      
      // Log full error details for 400/422/404 responses
      if (axiosError.response?.status === 400 || axiosError.response?.status === 422 || axiosError.response?.status === 404) {
        console.error(`[Port API] Error updating action '${identifier}':`, errorDetails);
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
 * Delete a self-service action
 */
export async function deleteAction(
  identifier: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const token = await getAccessToken();
    await axios.delete(
      `${PORT_API_URL}/actions/${identifier}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return {
      success: true,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorDetails = axiosError.response?.data || axiosError.message;
      
      // Log full error details for 400/422/404 responses
      if (axiosError.response?.status === 400 || axiosError.response?.status === 422 || axiosError.response?.status === 404) {
        console.error(`[Port API] Error deleting action '${identifier}':`, errorDetails);
      }
      
      return {
        success: false,
        error: errorDetails,
      };
    }
    throw error;
  }
}
