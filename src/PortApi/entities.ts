// Entity API functions
import axios from "axios";
import { getAccessToken } from "./auth.js";

const PORT_API_URL = "https://api.port.io/v1";

/**
 * Search for entities within the Port catalog
 * Essential for verifying data flow
 */
export async function searchEntities(
  blueprint?: string,
  query?: any
): Promise<any[]> {
  const token = await getAccessToken();
  
  // Port Search API requires a body with 'combinator' and 'rules' properties
  // If blueprint is provided, it must be added as a rule with property "$blueprint"
  const searchBody: {
    combinator: string;
    rules: any[];
  } = {
    combinator: "and",
    rules: [],
  };
  
  // If blueprint is provided, add it as the first rule
  if (blueprint) {
    searchBody.rules.push({
      property: "$blueprint",
      operator: "=",
      value: blueprint,
    });
  }
  
  // Append any additional rules from the query if provided
  if (query && typeof query === 'object' && Array.isArray(query.rules)) {
    searchBody.rules.push(...query.rules);
  }

  try {
    const response = await axios.post(
      `${PORT_API_URL}/entities/search`,
      searchBody,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.entities || [];
  } catch (error) {
    // Log detailed error information for 422 validation errors
    if (axios.isAxiosError(error) && error.response?.status === 422) {
      console.error(`[Port API] 422 Validation Error - Request body:`, JSON.stringify(searchBody, null, 2));
      console.error(`[Port API] 422 Validation Error - Response data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Get full details for a single specific entity
 */
export async function getEntity(
  blueprint: string,
  identifier: string
): Promise<any> {
  const token = await getAccessToken();
  const response = await axios.get(
    `${PORT_API_URL}/blueprints/${blueprint}/entities/${identifier}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.entity || response.data;
}

/**
 * Create or update an entity using the blueprint-scoped API
 * POST /v1/blueprints/{blueprint_identifier}/entities?upsert=true&merge=true
 */
export async function upsertEntity(
  blueprintIdentifier: string,
  entity: {
    identifier: string;
    title?: string;
    icon?: string;
    properties?: Record<string, unknown>;
    relations?: Record<string, unknown>;
    teams?: string[];
  }
): Promise<any> {
  const token = await getAccessToken();
  const url = `${PORT_API_URL}/blueprints/${blueprintIdentifier}/entities?upsert=true&merge=true`;
  const body = {
    identifier: entity.identifier,
    title: entity.title ?? undefined,
    icon: entity.icon ?? undefined,
    properties: entity.properties ?? {},
    relations: entity.relations ?? {},
    teams: entity.teams ?? [],
  };
  const response = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
