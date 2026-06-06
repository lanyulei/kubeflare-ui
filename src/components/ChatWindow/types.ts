export type ChatMessageRole = 'assistant' | 'system' | 'user';

export type ChatMessageItem = {
  content: string;
  createdAt: number;
  id: string;
  role: ChatMessageRole;
};

export type ChatSession = {
  createdAt: number;
  id: string;
  messages: ChatMessageItem[];
  summary?: string;
  title: string;
  updatedAt: number;
};
