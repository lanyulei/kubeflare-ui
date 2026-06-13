const AGENT_ERROR_MESSAGE_MAP: Record<string, string> = {
  'agent run interrupted': '诊断已取消',
  'context canceled': '请求已取消',
  'context deadline exceeded': '请求超时',
  'generation canceled': '生成已取消',
  'run interrupted': '诊断已取消',
};

export const getAgentDisplayErrorMessage = (value?: string) => {
  const message = value?.trim();
  if (!message) {
    return undefined;
  }

  return AGENT_ERROR_MESSAGE_MAP[message.toLowerCase()] || message;
};
