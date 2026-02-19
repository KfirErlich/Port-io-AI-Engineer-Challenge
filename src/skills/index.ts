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
import { createScorecardSkill } from "./Governance/create-scorecard.js";
import { updateScorecardSkill } from "./Governance/update-scorecard.js";
import { deleteScorecardSkill } from "./Governance/delete-scorecard.js";
import { getAllScorecardsSkill } from "./Governance/get-all-scorecards.js";
import { manageSelfServiceActionSkill } from "./Actions/manage-self-service-action.js";
import { createPageSkill } from "./Widgets/create-page.js";
import { addWidgetToPageSkill } from "./Widgets/add-widget-to-page.js";
import { getPageSkill } from "./Widgets/get-page.js";

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
  createScorecardSkill,
  updateScorecardSkill,
  deleteScorecardSkill,
  getAllScorecardsSkill,
  manageSelfServiceActionSkill,
  createPageSkill,
  addWidgetToPageSkill,
  getPageSkill,
];