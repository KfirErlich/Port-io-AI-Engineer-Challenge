// Skill for managing self-service actions (create, update, delete)
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z, ZodError } from "zod";
import { createAction, updateAction, deleteAction } from "../../PortApi/actions.js";

/** Zod schema for MCP SDK validation */
const inputSchema = z.object({
  operation: z.enum(["create", "update", "delete"]),
  identifier: z.string().min(1, "action identifier is required"),
  actionData: z.object({
    title: z.string().optional(),
    trigger: z.any().optional(),
    invocationMethod: z.any().optional(),
    description: z.string().optional(),
    publish: z.boolean().optional(),
  }).optional(),
});

function validateManageActionArgs(
  args: unknown
): { ok: true; operation: "create" | "update" | "delete"; identifier: string; actionData?: Record<string, unknown> } | { ok: false; message: string } {
  try {
    const result = inputSchema.parse(args);
    
    // Validate that actionData is provided for create/update operations
    if ((result.operation === "create" || result.operation === "update") && !result.actionData) {
      return {
        ok: false,
        message: `actionData is required for ${result.operation} operation`,
      };
    }
    
    return {
      ok: true,
      operation: result.operation,
      identifier: result.identifier,
      actionData: result.actionData as Record<string, unknown> | undefined,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        message: `Validation error: ${error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
      };
    }
    return {
      ok: false,
      message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Skill: Manage Self-Service Action
 * A unified tool to Create, Update (PATCH), or Delete self-service actions in Port.
 */
export const manageSelfServiceActionSkill = {
  name: "manage_self_service_action",
  description:
    "A unified tool to Create, Update (PATCH), or Delete self-service actions in Port. INPUT: object with 'operation' (enum: 'create', 'update', 'delete'), 'identifier' (string, action identifier), and 'actionData' (optional object with: title (string), trigger (any), invocationMethod (any), description (string), publish (boolean)). actionData is required for create/update operations.",
  inputSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const validation = validateManageActionArgs(args);
      if (!validation.ok) {
        return {
          content: [{ type: "text" as const, text: `Validation error: ${validation.message}` }],
          isError: true,
        };
      }

      const { operation, identifier, actionData } = validation;

      console.error(`[TOOL] manage_self_service_action called with operation: ${operation}, identifier: ${identifier}`);

      let result: { success: boolean; action?: any; error?: any };

      if (operation === "create") {
        if (!actionData) {
          return {
            content: [{ type: "text" as const, text: "actionData is required for create operation" }],
            isError: true,
          };
        }
        result = await createAction({
          identifier,
          ...actionData,
        });
      } else if (operation === "update") {
        if (!actionData) {
          return {
            content: [{ type: "text" as const, text: "actionData is required for update operation" }],
            isError: true,
          };
        }
        result = await updateAction(identifier, actionData);
      } else {
        // delete
        result = await deleteAction(identifier);
      }

      if (result.success) {
        const successMessage = operation === "delete"
          ? `Successfully deleted action '${identifier}'.`
          : `Successfully ${operation}d action '${identifier}'.\n\nAction details:\n${JSON.stringify(result.action, null, 2)}`;
        
        return {
          content: [
            {
              type: "text" as const,
              text: successMessage,
            },
          ],
        };
      } else {
        const errorMessage = result.error ? JSON.stringify(result.error, null, 2) : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to ${operation} action '${identifier}'.\n\nError details:\n${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error(`[TOOL] Error in manage_self_service_action:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Unexpected error in manage_self_service_action: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
