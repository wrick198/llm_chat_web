
export enum Role {
  User = 'user',
  Assistant = 'assistant',
  System = 'system'
}

export enum InterfaceType {
  Semantic = 'semantic',
  BSS30 = 'bss30',
  API = 'api'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  interfaceType: InterfaceType;
  backendUrl: string;
}

export interface ApiRequestPayload {
  text: string;
  enable_semantic_thinking: boolean;
  stream: boolean;
}

export interface AppConfig {
  useCustomBackend: boolean;
  backendUrl: string; 
  apiKey: string; 
}
