// Export all skills
import { inspectPortDataModel } from "./Scaffolding/inspect-blueprints.js";
import { upsertBlueprintSkill } from "./Scaffolding/upsert-blueprint.js";
import { applyProductionReadinessSkill } from "./Scaffolding/apply-production-readiness.js";
import { setupCatalogRelationsSkill } from "./Scaffolding/setup-catalog-relations.js";
import { checkIntegrationHealthSkill } from "./Connectivity/check-integration-health.js";
import { configureIntegrationSkill } from "./Connectivity/configure-integration.js";
import { triggerResyncSkill } from "./Connectivity/trigger-resync.js";
import { getIntegrationDefinitionSkill } from "./Catalog/get-integration-definition.js";
import { searchEntitiesSkill } from "./Catalog/search-entities.js";
import { getEntitySkill } from "./Catalog/get-entity.js";

export const allSkills = [
  inspectPortDataModel,
  upsertBlueprintSkill,
  applyProductionReadinessSkill,
  setupCatalogRelationsSkill,
  checkIntegrationHealthSkill,
  configureIntegrationSkill,
  triggerResyncSkill,
  getIntegrationDefinitionSkill,
  searchEntitiesSkill,
  getEntitySkill,
];