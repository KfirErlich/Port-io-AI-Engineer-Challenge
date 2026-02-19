// Interface definitions for Blueprints and Entities

export interface PortBlueprintProperty {
  title: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  format?: string;
  enum?: string[];
  default?: any;
  items?: PortBlueprintProperty;
  [key: string]: any;
}

export interface PortBlueprintSchema {
  properties: Record<string, PortBlueprintProperty>;
  required?: string[];
}

export interface PortBlueprintRelation {
  title: string;
  target: string;
  required?: boolean;
  many?: boolean;
  [key: string]: any;
}

export interface PortBlueprint {
  identifier: string;
  title: string;
  icon?: string;
  schema: PortBlueprintSchema;
  relations?: Record<string, PortBlueprintRelation>;
  mirrorProperties?: Record<string, any>;
  calculationProperties?: Record<string, any>;
  aggregationProperties?: Record<string, any>;
  [key: string]: any;
}

export interface PortEntity {
  identifier: string;
  title: string;
  properties?: Record<string, any>;
  relations?: Record<string, any>;
}
