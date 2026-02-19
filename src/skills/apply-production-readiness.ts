// Orchestrator skill for applying Production Readiness template
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getBlueprint, upsertBlueprint } from "../port-api.js";
import {
  SERVICE_BLUEPRINT,
  ENVIRONMENT_BLUEPRINT,
  templateToPortFormat,
} from "../templates/blueprints.js";

/** Zod schema for MCP SDK validation */
const inputSchema = z.object({
  includeEnvironment: z.boolean().optional(),
  includeTeam: z.boolean().optional(),
});

/**
 * Strategic orchestrator skill: Apply Production Readiness Template
 * Installs the foundational pillars of the Port 'Production Readiness' journey.
 * This is the recommended starting point for a governed software catalog.
 */
export const applyProductionReadinessSkill = {
  name: "apply_production_readiness_template",
  description:
    "Strategic orchestrator that installs the core pillars for Production Readiness: Service, Environment, and Team blueprints, including their inter-relations. Recommended starting point for a governed software catalog. INPUT: optional object with includeEnvironment (boolean, default true), includeTeam (boolean, default true). Can be called with no arguments.",
  inputSchema,
  handler: async (args: unknown): Promise<CallToolResult> => {
    try {
      const opts = args && typeof args === "object" && !Array.isArray(args) ? (args as Record<string, unknown>) : {};
      const includeEnvironment = opts.includeEnvironment !== false;
      const includeTeam = opts.includeTeam !== false;

      console.error(`[TOOL] apply_production_readiness_template called`);
      const results: Array<{
        blueprint: string;
        operation: "created" | "updated" | "skipped" | "error";
        message: string;
      }> = [];

      // Step 1: Discovery - Check which blueprints exist (for reporting)
      console.error(`[TOOL] Checking existing blueprints...`);
      const existingService = await getBlueprint(SERVICE_BLUEPRINT.identifier);
      const existingEnvironment = includeEnvironment
        ? await getBlueprint(ENVIRONMENT_BLUEPRINT.identifier)
        : null;
      
      console.error(`[TOOL] Service blueprint exists: ${existingService !== null}`);
      if (includeEnvironment) {
        console.error(`[TOOL] Environment blueprint exists: ${existingEnvironment !== null}`);
      }

      // Step 2: Apply Service Blueprint
      console.error(`[TOOL] Applying Service blueprint...`);
      const serviceBlueprint = templateToPortFormat(SERVICE_BLUEPRINT);
      const serviceResult = await upsertBlueprint(serviceBlueprint);
      results.push({
        blueprint: "Service",
        operation: serviceResult.operation === "created" ? "created" : serviceResult.operation === "updated" ? "updated" : "error",
        message: serviceResult.message,
      });

      // Step 3: Apply Environment Blueprint (if requested)
      if (includeEnvironment) {
        console.error(`[TOOL] Applying Environment blueprint...`);
        const environmentBlueprint = templateToPortFormat(ENVIRONMENT_BLUEPRINT);
        const envResult = await upsertBlueprint(environmentBlueprint);
        results.push({
          blueprint: "Environment",
          operation: envResult.operation === "created" ? "created" : envResult.operation === "updated" ? "updated" : "error",
          message: envResult.message,
        });
      } else {
        results.push({
          blueprint: "Environment",
          operation: "skipped",
          message: "Environment blueprint skipped per user request",
        });
      }

      // Step 4: Team handling (informational - _team is built-in)
      if (includeTeam) {
        results.push({
          blueprint: "Team",
          operation: "skipped",
          message:
            "Team blueprint (_team) is a built-in Port blueprint. Service blueprint relations to _team have been configured.",
        });
      }

      // Step 5: Generate summary report
      const created = results.filter((r) => r.operation === "created").length;
      const updated = results.filter((r) => r.operation === "updated").length;
      const errors = results.filter((r) => r.operation === "error").length;
      const skipped = results.filter((r) => r.operation === "skipped").length;

      let summary = `Production Readiness Template Application Complete\n\n`;
      summary += `Summary:\n`;
      summary += `  - Created: ${created} blueprint(s)\n`;
      summary += `  - Updated: ${updated} blueprint(s)\n`;
      summary += `  - Skipped: ${skipped} blueprint(s)\n`;
      if (errors > 0) {
        summary += `  - Errors: ${errors} blueprint(s)\n`;
      }
      summary += `\nDetails:\n`;

      results.forEach((result) => {
        summary += `\n${result.blueprint}:\n`;
        summary += `  Operation: ${result.operation}\n`;
        summary += `  ${result.message}\n`;
      });

      summary += `\n\nNext Steps:\n`;
      summary += `1. The Service blueprint is now ready with properties: description, type, lifecycle, language, repository, documentation\n`;
      summary += `2. The Service blueprint has relations configured to Environment (many-to-many) and Team (ownership)\n`;
      if (includeEnvironment) {
        summary += `3. The Environment blueprint is ready with properties: type, region, url, description\n`;
      }
      summary += `4. You can now create entities using these blueprints or customize them further using the upsert_blueprint tool.\n`;

      const hasErrors = errors > 0;

      return {
        content: [
          {
            type: "text",
            text: summary,
          },
        ],
        isError: hasErrors,
      };
    } catch (error) {
      console.error(`[TOOL] Error in apply_production_readiness_template:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Unexpected error in apply_production_readiness_template: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
