// Skill: Trigger Resync
// Triggers a manual data resynchronization for a specific integration by "touching" its configuration.
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import axios from "axios";
import { triggerResync } from "../../PortApi/index.js";

const triggerResyncSchema = z.object({
  identifier: z.string().min(1, "identifier is required and must be a non-empty string"),
});

export const triggerResyncSkill = {
  name: "trigger_resync",
  description:
    "Triggers a manual data resynchronization for a specific integration by updating its configuration. This forces the integration to re-fetch and sync data from the source system. INPUT: Object with required field: identifier (string, the installation identifier). Example: { \"identifier\": \"installation-123\" }.",
  inputSchema: triggerResyncSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = triggerResyncSchema.parse(args);
      const { identifier } = validation;

      console.error(`[TOOL] trigger_resync called with:`);
      console.error(`  identifier: ${identifier}`);

      try {
        const resyncData = await triggerResync(identifier);

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully triggered resync for integration.\n\n` +
                `Resync Details:\n` +
                `  - Identifier: ${identifier}\n` +
                `  - Integration ID: ${resyncData.id || resyncData.identifier || 'N/A'}\n` +
                `  - Status: ${resyncData.status || 'updated'}\n\n` +
                `Full integration response:\n${JSON.stringify(resyncData, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = error instanceof Error ? error.message : String(error);
        let errorDetails = "";
        
        // Enhanced error handling for axios errors
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const responseData = error.response?.data;
          
          console.error(`[Port API] Error triggering resync:`, errorMessage);
          console.error(`[Port API] Status code: ${status}`);
          console.error(`[Port API] Full error response:`, JSON.stringify(responseData, null, 2));
          
          if (status === 404) {
            errorMessage = `Integration not found. The installationId (identifier) '${identifier}' might be incorrect. Please verify the integration identifier exists in Port.`;
            errorDetails = `\n\nError details: ${JSON.stringify(responseData, null, 2)}`;
          } else {
            errorDetails = `\n\nStatus: ${status}\nError details: ${JSON.stringify(responseData, null, 2)}`;
          }
        } else {
          console.error(`[Port API] Error triggering resync:`, errorMessage);
        }
        
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to trigger resync for integration '${identifier}': ${errorMessage}${errorDetails}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in trigger_resync:`, error);
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
            text: `Unexpected error in trigger_resync: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
