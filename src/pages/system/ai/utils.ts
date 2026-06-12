type APIError = {
  info?: { message?: string };
  message?: string;
  response?: { data?: { message?: string } };
};

export const getErrorMessage = (error: unknown, fallback = '操作失败') => {
  const apiError = error as APIError;
  return (
    apiError.info?.message ||
    apiError.response?.data?.message ||
    apiError.message ||
    fallback
  );
};

export const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

export const ensureStringList = (values?: Array<string | undefined> | null) => {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const value of values || []) {
    const item = value?.trim();
    if (!item || seen.has(item)) {
      continue;
    }
    seen.add(item);
    items.push(item);
  }

  return items;
};

export const normalizeTextList = (values?: string[] | null) =>
  ensureStringList(values);

export const ensureAgentTypeList = (
  values?: API.AgentType[] | null,
): API.AgentType[] => ensureStringList(values) as API.AgentType[];

export const matchKeyword = (
  values: Array<string | undefined>,
  keyword: string,
) => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }

  return values.some((value) =>
    value?.toLowerCase().includes(normalizedKeyword),
  );
};

export const toReloadToolOverride = (
  tool: Pick<
    API.AgentToolDefinition,
    'description' | 'enabled' | 'observe_max_chars' | 'read_only' | 'timeout_ms'
  >,
): API.ReloadAgentToolOverride => ({
  description: tool.description || '',
  enabled: Boolean(tool.enabled),
  observe_max_chars: tool.observe_max_chars,
  read_only: Boolean(tool.read_only),
  timeout_ms: tool.timeout_ms,
});

export const buildToolOverridePatch = (
  toolID: string,
  override: API.ReloadAgentToolOverride,
): Record<string, API.ReloadAgentToolOverride> => {
  const id = toolID.trim();
  return id ? { [id]: override } : {};
};

export const toReloadSkill = (
  skill: API.AgentSkillDefinition,
): API.ReloadAgentSkill => ({
  id: skill.id.trim(),
  name: skill.name.trim(),
  description: normalizeOptionalText(skill.description),
  enabled: Boolean(skill.enabled),
  agent_types: ensureAgentTypeList(skill.agent_types),
  triggers: normalizeTextList(skill.triggers),
  system_prompt: normalizeOptionalText(skill.system_prompt),
  allowed_tools: normalizeTextList(skill.allowed_tools),
  hints: normalizeTextList(skill.hints),
});

export const buildSkillPayload = (
  skills: API.AgentSkillDefinition[],
): API.ReloadAgentSkill[] => skills.map(toReloadSkill);

export const prettyJson = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return '{}';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch (_error) {
    return String(value);
  }
};

export const getAgentTypeText = (agentType?: string) =>
  agentType?.trim() || '-';
