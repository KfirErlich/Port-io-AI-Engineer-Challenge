// Integration API functions
import axios from "axios";
import { getAccessToken } from "./auth.js";

const PORT_API_URL = "https://api.port.io/v1";

/**
 * Get all integrations
 */
export async function getIntegrations(): Promise<any[]> {
  const token = await getAccessToken();
  const response = await axios.get(`${PORT_API_URL}/integration`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.integrations || [];
}

/**
 * Create a new integration
 */
export async function createIntegration(
  integrationType: string,
  mapping: Record<string, any>
): Promise<any> {
  const token = await getAccessToken();
  const response = await axios.post(
    `${PORT_API_URL}/integration`,
    {
      type: integrationType,
      mapping: mapping,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.integration || response.data;
}

/**
 * Update an existing integration mapping
 */
export async function updateIntegration(
  installationId: string,
  mapping: Record<string, any>
): Promise<any> {
  const token = await getAccessToken();
  const response = await axios.patch(
    `${PORT_API_URL}/integration/${installationId}`,
    {
      mapping: mapping,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.integration || response.data;
}

/**
 * Trigger a resync for an integration by "touching" its configuration
 * Uses PATCH to update the integration, which automatically triggers a resync
 */
export async function triggerResync(identifier: string): Promise<any> {
  const token = await getAccessToken();
  const response = await axios.patch(
    `${PORT_API_URL}/integration/${identifier}`,
    {
      metadata: {
        lastTriggered: new Date().toISOString(),
      },
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.integration || response.data;
}

/**
 * Get integration definition by installation ID
 * Retrieves the full configuration JSON of a specific integration (including mappings)
 */
export async function getIntegrationDefinition(installationId: string): Promise<any> {
  const token = await getAccessToken();
  const response = await axios.get(`${PORT_API_URL}/integration/${installationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.integration || response.data;
}
