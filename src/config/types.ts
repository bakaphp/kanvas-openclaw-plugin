export type KanvasAuthMode = "bearer" | "app-key";

export interface KanvasConfig {
  apiUrl: string;
  xKanvasApp: string;
  xKanvasLocation?: string;
  authMode: KanvasAuthMode;
  bearerToken?: string;
  xKanvasKey?: string;
  email?: string;
  password?: string;
  timeoutMs?: number;
}

export interface RequestContextOverride {
  xKanvasLocation?: string;
  bearerToken?: string;
  xKanvasKey?: string;
}

export interface LoginResponse {
  login: {
    id: string;
    uuid: string;
    token: string;
    refresh_token: string;
    token_expires: string;
    refresh_token_expires: string;
    time: string;
    timezone: string;
    sessionId: string;
  };
}
