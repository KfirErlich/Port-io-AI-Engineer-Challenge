// Skill: Configure Integration
// Installs a new integration or updates the JQ mapping of an existing one.
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createIntegration, updateIntegration } from "../../PortApi/index.js";

const configureIntegrationSchema = z.object({
  installationId: z.string().optional(),
  integrationType: z.string().min(1, "integrationType is required and must be a non-empty string"),
  mapping: z.record(z.string(), z.any()),
  isNew: z.boolean().default(false),
});

export const configureIntegrationSkill = {
  name: "configure_integration",
  description:
    "Installs a new integration or updates the JQ mapping of an existing one. For new integrations, set isNew=true and omit installationId. For updates, set isNew=false and provide installationId. INPUT: Object with required fields: integrationType (string, e.g., 'github', 'jira'), mapping (object, JQ mapping configuration). Optional: installationId (string, required for updates), isNew (boolean, default false). Example: { \"integrationType\": \"github\", \"mapping\": {...}, \"isNew\": true }.",
  inputSchema: configureIntegrationSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = configureIntegrationSchema.parse(args);
      const { installationId, integrationType, mapping, isNew } = validation;

      console.error(`[TOOL] configure_integration called with:`);
      console.error(`  integrationType: ${integrationType}`);
      console.error(`  isNew: ${isNew}`);
      console.error(`  installationId: ${installationId || 'none'}`);

      if (isNew) {
        // Create new integration
        try {
          const integration = await createIntegration(integrationType, mapping);

          return {
            content: [
              {
                type: "text" as const,
                text: `Successfully installed new integration.\n\n` +
                  `Integration Details:\n` +
                  `  - Type: ${integrationType}\n` +
                  `  - Installation ID: ${integration.installationId || integration.identifier || 'N/A'}\n` +
                  `  - Status: ${integration.status || 'N/A'}\n\n` +
                  `Full integration data:\n${JSON.stringify(integration, null, 2)}`,
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[Port API] Error installing integration:`, errorMessage);
          
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to install integration '${integrationType}': ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      } else {
        // Update existing integration
        if (!installationId) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: installationId is required when updating an existing integration (isNew=false).`,
              },
            ],
            isError: true,
          };
        }

        try {
          const integration = await updateIntegration(installationId, mapping);

          return {
            content: [
              {
                type: "text" as const,
                text: `Successfully updated integration mapping.\n\n` +
                  `Integration Details:\n` +
                  `  - Installation ID: ${installationId}\n` +
                  `  - Type: ${integrationType}\n` +
                  `  - Status: ${integration.status || 'N/A'}\n\n` +
                  `Updated integration data:\n${JSON.stringify(integration, null, 2)}`,
              },
            ],
          };
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[Port API] Error updating integration:`, errorMessage);
          
          // Enhanced error message for 422 validation errors
          let detailedError = errorMessage;
          if (error.response && error.response.status === 422 && error.response.data) {
            const errorData = error.response.data;
            detailedError = `Validation Error (422): ${JSON.stringify(errorData, null, 2)}\n\nOriginal error: ${errorMessage}`;
          }
          
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to update integration '${installationId}': ${detailedError}`,
              },
            ],
            isError: true,
          };
        }
      }
    } catch (error) {
      console.error(`[TOOL] Error in configure_integration:`, error);
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
            text: `Unexpected error in configure_integration: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
