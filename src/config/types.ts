export type KanvasAuthMode = "bearer" | "app-key";

export interface KanvasConfig {
  apiUrl: string;
  xKanvasApp: string;
  xKanvasLocation?: string;
  authMode: KanvasAuthMode;
  bearerToken?: string;
  xKanvasKey?: string;
  timeoutMs?: number;
}

export interface RequestContextOverride {
  xKanvasLocation?: string;
  bearerToken?: string;
  xKanvasKey?: string;
}
