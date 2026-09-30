import React from "react";

export interface ValidationResult {
  ok: boolean;
  errors?: string[];
}

export interface RenderContext {
  appId: string;
  config: Record<string, unknown>;
}

export interface ComponentDefinition<TConfig = Record<string, unknown>> {
  type: string;
  version: number;
  defaultConfig: TConfig;
  validateConfig: (config: unknown) => ValidationResult;
  render: (context: RenderContext) => React.ReactNode;
  getDataDependencies: (config: TConfig) => { collectionId: string }[];
  getEventSubscriptions: () => string[];
}
