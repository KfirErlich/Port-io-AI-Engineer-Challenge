// Interface definitions for Blueprints and Entities

export interface PortBlueprint {
  identifier: string;
  title: string;
  schema: {
    properties: Record<string, any>;
  };
}

export interface PortEntity {
  identifier: string;
  title: string;
  properties?: Record<string, any>;
  relations?: Record<string, any>;
}
