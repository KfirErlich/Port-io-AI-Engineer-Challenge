// Helper functions for Port API calls
import axios, { AxiosError } from "axios";
import { PortBlueprint } from "./types.js";

const PORT_API_URL = "https://api.port.io/v1";

/**
 * Get access token from Port API using client credentials
 */
export async function getAccessToken(): Promise<string> {
  const response = await axios.post(`${PORT_API_URL}/auth/access_token`, {
    clientId: process.env.PORT_CLIENT_ID,
    clientSecret: process.env.PORT_CLIENT_SECRET,
  });
  return response.data.accessToken;
}

/**
 * Fetch all existing blueprints from Port
 */
export async function getBlueprints(): Promise<PortBlueprint[]> {
  const token = await getAccessToken();
  const response = await axios.get(`${PORT_API_URL}/blueprints`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.blueprints || [];
}

/**
 * Check if a blueprint exists by identifier
 */
export async function getBlueprint(identifier: string): Promise<PortBlueprint | null> {
  try {
    const token = await getAccessToken();
    const response = await axios.get(`${PORT_API_URL}/blueprints/${identifier}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.blueprint || null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return null;
      }
      throw error;
    }
    throw error;
  }
}

/**
 * Create or update a blueprint in Port
 * - Checks if blueprint exists via GET
 * - If exists: PATCH to update
 * - If not exists (404): POST to create
 * - Returns operation result with detailed error handling
 */
export async function upsertBlueprint(
  blueprint: any
): Promise<{ success: boolean; operation: "created" | "updated" | "error"; message: string; blueprint?: PortBlueprint; error?: any }> {
  try {
    const token = await getAccessToken();
    const identifier = blueprint.identifier;

    if (!identifier) {
      return {
        success: false,
        operation: "error",
        message: "Blueprint identifier is required",
      };
    }

    // Check if blueprint exists
    const existingBlueprint = await getBlueprint(identifier);

    if (existingBlueprint) {
      // Update existing blueprint
      try {
        const response = await axios.patch(
          `${PORT_API_URL}/blueprints/${identifier}`,
          blueprint,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return {
          success: true,
          operation: "updated",
          message: `Successfully updated blueprint '${identifier}'`,
          blueprint: response.data.blueprint,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          const errorDetails = axiosError.response?.data || axiosError.message;
          console.error(`[Port API] Error updating blueprint '${identifier}':`, errorDetails);
          return {
            success: false,
            operation: "error",
            message: `Failed to update blueprint '${identifier}': ${JSON.stringify(errorDetails)}`,
            error: errorDetails,
          };
        }
        throw error;
      }
    } else {
      // Create new blueprint
      try {
        const response = await axios.post(
          `${PORT_API_URL}/blueprints`,
          blueprint,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return {
          success: true,
          operation: "created",
          message: `Successfully created blueprint '${identifier}'`,
          blueprint: response.data.blueprint,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          const errorDetails = axiosError.response?.data || axiosError.message;
          console.error(`[Port API] Error creating blueprint '${identifier}':`, errorDetails);
          
          // Extract validation errors if available
          let errorMessage = `Failed to create blueprint '${identifier}'`;
          if (axiosError.response?.status === 400) {
            errorMessage += `: Validation error - ${JSON.stringify(errorDetails)}`;
          } else if (axiosError.response?.status === 409) {
            errorMessage += `: Conflict - ${JSON.stringify(errorDetails)}`;
          } else {
            errorMessage += `: ${JSON.stringify(errorDetails)}`;
          }
          
          return {
            success: false,
            operation: "error",
            message: errorMessage,
            error: errorDetails,
          };
        }
        throw error;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Port API] Unexpected error in upsertBlueprint:`, errorMessage);
    return {
      success: false,
      operation: "error",
      message: `Unexpected error: ${errorMessage}`,
      error: errorMessage,
    };
  }
}
