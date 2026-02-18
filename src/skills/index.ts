// Export all skills
import { inspectPortDataModel } from "./blueprints.js";
import { entitySkills } from "./entities.js";

export const allSkills = [
  inspectPortDataModel,
  ...entitySkills, 
];