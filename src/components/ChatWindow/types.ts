export type ChatMessageRole = 'assistant' | 'user';

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
  title: string;
  updatedAt: number;
};
