export type ChatMessageRole = 'assistant' | 'system' | 'user';

export type ChatMessageItem = {
  completionTokens?: number;
  content: string;
  createdAt: number;
  errorMessage?: string;
  id: string;
  model?: string;
  promptTokens?: number;
  provider?: string;
  role: ChatMessageRole;
  status?: API.AiChatMessageStatus;
  totalTokens?: number;
};

export type ChatSession = {
  createdAt: number;
  id: string;
  messages: ChatMessageItem[];
  summary?: string;
  title: string;
  updatedAt: number;
};
