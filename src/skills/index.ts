// Export all skills
import { inspectPortDataModel } from "./inspect-blueprints.js";
import { entitySkills } from "./entities.js";
import { upsertBlueprintSkill } from "./upsert-blueprint.js";
import { applyProductionReadinessSkill } from "./apply-production-readiness.js";

export const allSkills = [
  inspectPortDataModel,
  upsertBlueprintSkill,
  applyProductionReadinessSkill,
  ...entitySkills, 
];