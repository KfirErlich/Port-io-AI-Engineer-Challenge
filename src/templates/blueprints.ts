/**
 * Standard Production Readiness Blueprint Templates
 * Following Port.io Best Practices for software catalog governance
 */

export interface BlueprintTemplate {
  identifier: string;
  title: string;
  icon?: string;
  schema: {
    properties: Record<string, any>;
    required?: string[];
  };
  relations?: Record<string, any>;
  mirrorProperties?: Record<string, any>;
}

/**
 * Service Blueprint Template
 * Core entity representing a software service in the catalog
 */
export const SERVICE_BLUEPRINT: BlueprintTemplate = {
  identifier: "service",
  title: "Service",
  icon: "Service",
  schema: {
    properties: {
      description: {
        title: "Description",
        type: "string",
        description: "Human-readable description of the service",
        format: "markdown",
      },
      type: {
        title: "Type",
        type: "string",
        description: "Type of service (e.g., API, Frontend, Backend, Database)",
        enum: ["API", "Frontend", "Backend", "Database", "Microservice", "Service"],
        default: "Service",
      },
      lifecycle: {
        title: "Lifecycle",
        type: "string",
        description: "Current lifecycle stage of the service",
        enum: ["production", "staging", "development", "deprecated"],
        default: "development",
      },
      language: {
        title: "Language",
        type: "string",
        description: "Primary programming language",
        enum: ["JavaScript", "TypeScript", "Python", "Java", "Go", "Ruby", "PHP", "C#", "Other"],
      },
      repository: {
        title: "Repository",
        type: "string",
        description: "URL to the source code repository",
        format: "url",
      },
      documentation: {
        title: "Documentation",
        type: "string",
        description: "Link to service documentation",
        format: "url",
      },
    },
    required: ["description", "type"],
  },
  relations: {
    environment: {
      title: "Deployed In",
      target: "environment",
      required: false,
      many: true,
    },
    owner: {
      title: "Owner",
      target: "_team",
      required: false,
      many: false,
    },
  },
};

/**
 * Environment Blueprint Template
 * Represents deployment environments (Production, Staging, Development)
 */
export const ENVIRONMENT_BLUEPRINT: BlueprintTemplate = {
  identifier: "environment",
  title: "Environment",
  icon: "Environment",
  schema: {
    properties: {
      type: {
        title: "Type",
        type: "string",
        description: "Environment type",
        enum: ["Production", "Staging", "Development", "Testing", "QA"],
        default: "Development",
      },
      region: {
        title: "Region",
        type: "string",
        description: "Geographic region or cloud region",
      },
      url: {
        title: "URL",
        type: "string",
        description: "Base URL for the environment",
        format: "url",
      },
      description: {
        title: "Description",
        type: "string",
        description: "Environment description",
        format: "markdown",
      },
    },
    required: ["type"],
  },
};

/**
 * Team Blueprint Template
 * Represents ownership structure (uses Port's built-in _team blueprint)
 * Note: This is a reference template. Port.io uses _team as a built-in blueprint.
 * This template can be used to ensure proper relations are set up.
 */
export const TEAM_BLUEPRINT_REFERENCE = {
  identifier: "_team",
  title: "Team",
  note: "Port.io built-in blueprint. Use this reference to ensure proper relations.",
};

/**
 * Standard Production Readiness Template Set
 * Contains all core blueprints needed for production readiness governance
 */
export const PRODUCTION_READINESS_TEMPLATES = {
  service: SERVICE_BLUEPRINT,
  environment: ENVIRONMENT_BLUEPRINT,
  team: TEAM_BLUEPRINT_REFERENCE,
} as const;

/**
 * Convert template to Port API format
 */
export function templateToPortFormat(template: BlueprintTemplate): any {
  return {
    identifier: template.identifier,
    title: template.title,
    icon: template.icon,
    schema: template.schema,
    relations: template.relations,
    mirrorProperties: template.mirrorProperties,
  };
}
