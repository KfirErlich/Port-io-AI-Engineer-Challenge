// Export all skills
import { inspectPortDataModel } from "./inspect-blueprints.js";
import { entitySkills } from "./entities.js";
import { upsertBlueprintSkill } from "./upsert-blueprint.js";
import { applyProductionReadinessSkill } from "./apply-production-readiness.js";
import { setupCatalogRelationsSkill } from "./setup-catalog-relations.js";

export const allSkills = [
  inspectPortDataModel,
  upsertBlueprintSkill,
  applyProductionReadinessSkill,
  setupCatalogRelationsSkill,
  ...entitySkills, 
];