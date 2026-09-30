export type FieldType = "text" | "enum" | "date" | "relation" | "decimal" | "integer";

export interface FieldDef {
  id: string;
  name: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
}

export interface CollectionDef {
  id: string;
  name: string;
  fields: FieldDef[];
}

export interface ComponentDef {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

export interface PageDef {
  id: string;
  title: string;
  components: ComponentDef[];
}

export interface MiniAppTheme {
  accent?: string;
}

export interface MiniAppManifest {
  schemaVersion: number;
  appId: string;
  name: string;
  icon?: string;
  theme?: MiniAppTheme;
  collections: CollectionDef[];
  pages: PageDef[];
}
