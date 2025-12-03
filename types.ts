export enum Role {
  User = 'user',
  Assistant = 'assistant',
  System = 'system'
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
}

export interface ApiRequestPayload {
  text: string;
  enable_origin_explanation: boolean;
}

// Configuration for the backend connection
export interface AppConfig {
  useCustomBackend: boolean;
  backendUrl: string; // e.g., http://localhost:8000/stream
  apiKey: string; // For Gemini
}