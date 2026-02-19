// Skill: Check Integration Health
// Retrieves all installed integrations in Port and performs comprehensive health diagnostics.
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getIntegrations } from "../../PortApi/index.js";

const checkIntegrationHealthSchema = z.object({});

// Helper function to check if installation status is "Running"
function isInstallationRunning(status: string | undefined | null): boolean {
  if (!status) return false;
  return status === 'Running';
}

// Helper function to check if resync status is "completed"
function isResyncCompleted(status: string | undefined | null): boolean {
  if (!status) return false;
  return status.toLowerCase() === 'completed';
}

// Helper function to check if resync status is "failed"
function isResyncFailed(status: string | undefined | null): boolean {
  if (!status) return false;
  return status.toLowerCase() === 'failed';
}

// Helper function to check if integration is healthy
// Healthy = (statusInfo.integrationStatus.status === 'Running' AND resyncState.status === 'completed')
function isIntegrationHealthy(
  installationStatus: string | undefined | null,
  resyncStatus: string | undefined | null
): boolean {
  return isInstallationRunning(installationStatus) && isResyncCompleted(resyncStatus);
}

// Helper function to check if data is stale (> 24 hours old)
function isStale(lastSyncTime: string | undefined | null): boolean {
  if (!lastSyncTime) return true; // Consider stale if no sync timestamp
  
  try {
    const syncTime = new Date(lastSyncTime).getTime();
    const now = Date.now();
    const hoursSinceSync = (now - syncTime) / (1000 * 60 * 60);
    return hoursSinceSync > 24;
  } catch {
    return true; // Consider stale if timestamp is invalid
  }
}

// Helper function to extract error messages from integration response
// Focuses on resyncState when status is "failed"
function extractErrors(integration: any): string[] {
  const errors: string[] = [];
  
  // If resyncState.status is "failed", report the failed status
  if (integration.resyncState?.status && isResyncFailed(integration.resyncState.status)) {
    errors.push(`Resync status: ${integration.resyncState.status}`);
    
    // Check for error details in resyncState if available
    if (integration.resyncState.errors) {
      if (Array.isArray(integration.resyncState.errors)) {
        errors.push(...integration.resyncState.errors.map((e: any) => 
          typeof e === 'string' ? e : e.message || JSON.stringify(e)
        ));
      } else if (typeof integration.resyncState.errors === 'string') {
        errors.push(integration.resyncState.errors);
      } else if (integration.resyncState.errors.message) {
        errors.push(integration.resyncState.errors.message);
      }
    }
  }
  
  // Also check top-level errors field as fallback
  if (integration.errors && errors.length === 0) {
    if (Array.isArray(integration.errors)) {
      errors.push(...integration.errors.map((e: any) => 
        typeof e === 'string' ? e : e.message || JSON.stringify(e)
      ));
    } else if (typeof integration.errors === 'string') {
      errors.push(integration.errors);
    } else if (integration.errors.message) {
      errors.push(integration.errors.message);
    }
  }
  
  return errors;
}

// Helper function to determine operational status
function getOperationalStatus(
  installationStatus: string | undefined | null,
  resyncStatus: string | undefined | null,
  isStale: boolean,
  hasErrors: boolean
): 'Operational' | 'Degraded' {
  // If resync failed, it's degraded
  if (isResyncFailed(resyncStatus)) {
    return 'Degraded';
  }
  // If there are errors, it's degraded
  if (hasErrors) {
    return 'Degraded';
  }
  // If data is stale, it's degraded
  if (isStale) {
    return 'Degraded';
  }
  // Healthy = (installationStatus === 'Running' AND resyncStatus === 'completed')
  if (isIntegrationHealthy(installationStatus, resyncStatus)) {
    return 'Operational';
  }
  return 'Degraded';
}

export const checkIntegrationHealthSkill = {
  name: "check_integration_health",
  description:
    "Retrieves all installed integrations in Port and performs comprehensive health diagnostics. Checks installation status (Running), resync status (completed/failed), freshness (lastResyncEnd within 24h), and extracts error messages. Returns structured summary distinguishing Operational vs Degraded integrations. INPUT: no parameters required; call with empty object {}.",
  inputSchema: checkIntegrationHealthSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      // Validate input (should be empty object)
      checkIntegrationHealthSchema.parse(args);

      console.error(`[TOOL] check_integration_health called`);

      try {
        const integrations = await getIntegrations();
        
        // Log raw JSON of first integration for debugging
        if (integrations.length > 0) {
          console.error(`[DEBUG] First integration raw JSON:`, JSON.stringify(integrations[0], null, 2));
        }
        
        // Perform comprehensive health check for each integration
        const healthChecks = integrations.map((integration: any) => {
          // Map fields from correct JSON paths using optional chaining
          const installationStatus = integration.statusInfo?.integrationStatus?.status;
          const resyncStatus = integration.resyncState?.status;
          const lastResyncEnd = integration.resyncState?.lastResyncEnd;
          
          // Determine health and operational status
          const isHealthy = isIntegrationHealthy(installationStatus, resyncStatus);
          const stale = isStale(lastResyncEnd);
          const errors = extractErrors(integration);
          const hasErrors = errors.length > 0;
          const operationalStatus = getOperationalStatus(installationStatus, resyncStatus, stale, hasErrors);
          
          return {
            identifier: integration.identifier,
            type: integration.type,
            title: integration.title,
            installationStatus: installationStatus || 'UNKNOWN',
            resyncStatus: resyncStatus || 'UNKNOWN',
            lastResyncEnd: lastResyncEnd || 'Never',
            isHealthy,
            isStale: stale,
            operationalStatus,
            errors: hasErrors ? errors : undefined,
            warnings: stale && !hasErrors ? ['Last sync occurred more than 24 hours ago'] : undefined,
          };
        });

        // Calculate summary statistics
        const totalCount = healthChecks.length;
        const operationalCount = healthChecks.filter((h: any) => h.operationalStatus === 'Operational').length;
        const degradedCount = healthChecks.filter((h: any) => h.operationalStatus === 'Degraded').length;
        const healthyStatusCount = healthChecks.filter((h: any) => h.isHealthy).length;
        const staleCount = healthChecks.filter((h: any) => h.isStale).length;
        const errorCount = healthChecks.filter((h: any) => h.errors && h.errors.length > 0).length;

        // Build structured output
        const summary = {
          overview: {
            total: totalCount,
            operational: operationalCount,
            degraded: degradedCount,
            healthyStatus: healthyStatusCount,
            stale: staleCount,
            withErrors: errorCount,
          },
          integrations: healthChecks,
        };

        // Format output text for AI consumption
        let outputText = `Integration Health Check Results:\n\n`;
        outputText += `=== SUMMARY ===\n`;
        outputText += `Total Integrations: ${totalCount}\n`;
        outputText += `Operational: ${operationalCount}\n`;
        outputText += `Degraded: ${degradedCount}\n`;
        outputText += `Healthy Status (Running + Completed): ${healthyStatusCount}\n`;
        outputText += `Stale Data (>24h since last sync): ${staleCount}\n`;
        outputText += `With Errors: ${errorCount}\n\n`;

        // Group by operational status
        const operationalIntegrations = healthChecks.filter((h: any) => h.operationalStatus === 'Operational');
        const degradedIntegrations = healthChecks.filter((h: any) => h.operationalStatus === 'Degraded');

        if (operationalIntegrations.length > 0) {
          outputText += `=== OPERATIONAL INTEGRATIONS ===\n`;
          operationalIntegrations.forEach((integration: any) => {
            outputText += `\n• ${integration.title} (${integration.identifier})\n`;
            outputText += `  Installation Status: ${integration.installationStatus}\n`;
            outputText += `  Resync Status: ${integration.resyncStatus}\n`;
            outputText += `  Last Resync End: ${integration.lastResyncEnd}\n`;
          });
          outputText += `\n`;
        }

        if (degradedIntegrations.length > 0) {
          outputText += `=== DEGRADED INTEGRATIONS ===\n`;
          degradedIntegrations.forEach((integration: any) => {
            outputText += `\n• ${integration.title} (${integration.identifier})\n`;
            outputText += `  Installation Status: ${integration.installationStatus}\n`;
            outputText += `  Resync Status: ${integration.resyncStatus}\n`;
            outputText += `  Last Resync End: ${integration.lastResyncEnd}\n`;
            if (integration.isStale) {
              outputText += `  ⚠️  WARNING: Last sync occurred more than 24 hours ago\n`;
            }
            if (integration.errors && integration.errors.length > 0) {
              outputText += `  ❌ ERRORS:\n`;
              integration.errors.forEach((error: string) => {
                outputText += `    - ${error}\n`;
              });
            }
          });
          outputText += `\n`;
        }

        outputText += `\n=== DETAILED DATA ===\n`;
        outputText += JSON.stringify(summary, null, 2);

        return {
          content: [
            {
              type: "text" as const,
              text: outputText,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Port API] Error fetching integrations:`, errorMessage);
        
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to fetch integrations: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in check_integration_health:`, error);
      if (error instanceof z.ZodError) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Validation error: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
            },
          ],
          isError: true,
        };
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Unexpected error in check_integration_health: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
