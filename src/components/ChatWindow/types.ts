export type ChatMessageRole = 'assistant' | 'system' | 'user';

export type ChatAgentMode = Extract<
  API.AgentType,
  'assistant' | 'auto' | 'diagnostic'
>;

export type ChatAgentRun = {
  evidences: API.AgentEvidence[];
  errorMessage?: string;
  route?: API.AgentRouteResult;
  run?: API.AgentRun;
  status?: API.AgentRunStatus;
  toolCalls: API.AgentToolCall[];
};

export type ChatMessageItem = {
  agentRun?: ChatAgentRun;
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
