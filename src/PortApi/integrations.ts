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
 * Fetches the current configuration first to preserve all existing config fields
 */
export async function updateIntegration(
  installationId: string,
  mapping: Record<string, any>
): Promise<any> {
  const token = await getAccessToken();
  
  try {
    // Step 1: Get current integration configuration
    const getResponse = await axios.get(
      `${PORT_API_URL}/integration/${installationId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    const currentIntegration = getResponse.data.integration || getResponse.data;
    
    // Step 2: Extract existing config or create new one
    const existingConfig = currentIntegration.config || {};
    const existingResources = existingConfig.resources || [];
    
    // Step 3: Smart append/update logic - check for existing resources by blueprint and kind
    let updatedResources: any[] = [...existingResources]; // Start with a copy of existing resources
    
    // Log for debugging
    console.error(`[Port API] Updating integration ${installationId}:`);
    console.error(`  Existing resources count: ${existingResources.length}`);
    console.error(`  Mapping type: ${Array.isArray(mapping) ? 'array' : 'object'}`);
    
    // Helper function to check if two resources match (by blueprint and kind)
    const resourcesMatch = (resource1: any, resource2: any): boolean => {
      const kind1 = resource1?.kind;
      const kind2 = resource2?.kind;
      const blueprint1 = resource1?.blueprint;
      const blueprint2 = resource2?.blueprint;
      
      // Match by kind (required) and blueprint if both exist
      if (kind1 && kind2 && kind1 === kind2) {
        if (blueprint1 && blueprint2) {
          return blueprint1 === blueprint2;
        }
        // If only one has blueprint, still match by kind
        return true;
      }
      return false;
    };
    
    // Process mapping(s) - ensure it's an array for uniform handling
    const mappingsToProcess = Array.isArray(mapping) ? mapping : [mapping];
    
    for (const newMapping of mappingsToProcess) {
      // Ensure the mapping is a flat object (not nested)
      // If mapping is nested inside port.resources or resources, extract it
      let flatMapping: any;
      if (newMapping?.port?.resources && Array.isArray(newMapping.port.resources)) {
        // If nested in port.resources array, take the first item
        flatMapping = newMapping.port.resources[0];
        console.error(`  Extracted mapping from nested port.resources`);
      } else if (newMapping?.resources && Array.isArray(newMapping.resources)) {
        // If nested in resources array, take the first item
        flatMapping = newMapping.resources[0];
        console.error(`  Extracted mapping from nested resources`);
      } else if (newMapping?.port && typeof newMapping.port === 'object' && !Array.isArray(newMapping.port)) {
        // If mapping itself is wrapped in a port object, use the port object
        flatMapping = newMapping.port;
        console.error(`  Extracted mapping from port wrapper`);
      } else {
        // Already flat, use as-is
        flatMapping = newMapping;
      }
      
      // Find if a matching resource already exists
      const existingIndex = updatedResources.findIndex((existing) => 
        resourcesMatch(existing, flatMapping)
      );
      
      if (existingIndex >= 0) {
        // Update existing resource - merge properties but preserve structure
        const existingResource = updatedResources[existingIndex];
        updatedResources[existingIndex] = {
          ...existingResource,
          ...flatMapping,
          // Ensure kind is always preserved
          kind: flatMapping.kind || existingResource.kind,
        };
        console.error(`  Updated existing resource at index ${existingIndex} (kind: ${updatedResources[existingIndex].kind})`);
      } else {
        // Append as new resource - ensure it's a flat object with kind property
        if (!flatMapping.kind) {
          console.error(`[Port API] Warning: New mapping missing 'kind' property, skipping append`);
          console.error(`  Mapping:`, JSON.stringify(flatMapping, null, 2));
          continue;
        }
        updatedResources.push(flatMapping);
        console.error(`  Appended new resource (kind: ${flatMapping.kind})`);
      }
    }
    
    // Step 4: Final validation - ensure resources array is flat and each has 'kind'
    const validationErrors: string[] = [];
    
    if (!Array.isArray(updatedResources)) {
      validationErrors.push('Resources must be an array');
    } else {
      updatedResources.forEach((resource, index) => {
        // Check if resource is nested (has port or resources property that shouldn't be there)
        if (resource && typeof resource === 'object') {
          if (resource.port && Array.isArray(resource.port.resources)) {
            validationErrors.push(`Resource at index ${index} is nested (has port.resources array)`);
          }
          if (resource.resources && Array.isArray(resource.resources)) {
            validationErrors.push(`Resource at index ${index} is nested (has resources array)`);
          }
          if (!resource.kind) {
            validationErrors.push(`Resource at index ${index} is missing required 'kind' property`);
          }
        } else {
          validationErrors.push(`Resource at index ${index} is not an object`);
        }
      });
    }
    
    if (validationErrors.length > 0) {
      console.error(`[Port API] Validation errors:`, validationErrors);
      throw new Error(`Resource validation failed: ${validationErrors.join('; ')}`);
    }
    
    console.error(`  Final resources count: ${updatedResources.length}`);
    console.error(`  Resources kinds:`, updatedResources.map(r => r.kind).join(', '));
    
    // Step 5: Merge existing config with updated resources, preserving all other fields
    const updatedConfig = {
      ...existingConfig,
      resources: updatedResources,
    };
    
    // Step 6: PATCH with the complete config object
    const response = await axios.patch(
      `${PORT_API_URL}/integration/${installationId}/config?force=true`,
      {
        config: updatedConfig,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    return response.data.integration || response.data;
  } catch (error: any) {
    // Enhanced error logging for 422 validation errors
    if (error.response && error.response.status === 422) {
      const errorData = error.response.data;
      console.error(`[Port API] 422 Validation Error for integration ${installationId}:`);
      console.error(`  Error data:`, JSON.stringify(errorData, null, 2));
      
      // Preserve the axios error structure by attaching enhanced message
      // but keeping the original error object so response.data is accessible
      const enhancedError = error;
      const errorMessage = errorData?.message || errorData?.error || JSON.stringify(errorData);
      enhancedError.message = `Port API validation failed (422): ${errorMessage}`;
      throw enhancedError;
    }
    
    // Re-throw other errors as-is
    throw error;
  }
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
