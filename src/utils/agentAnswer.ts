const REQUIRED_DIAGNOSTIC_SECTIONS = [
  '### 结论',
  '### 证据',
  '### 建议',
  '### 准确性提示',
];

const GENERIC_AGENT_ANSWER_PHRASES = [
  '已经为您输出完整的诊断结论',
  '已为您输出完整的诊断结论',
  '已完整输出上述诊断',
  '完整输出上述诊断',
  '上述诊断已完整输出',
  '您的问题已就绪',
  '问题已就绪',
];

const DSML_PIPE_PAIR = '(?:\\|{2}|\\uFF5C{2})';
const DSML_TOOL_CALLS_TAG = `${DSML_PIPE_PAIR}DSML${DSML_PIPE_PAIR}tool_calls`;
const DSML_TOOL_CALLS_BLOCK_PATTERN = new RegExp(
  `<\\s*${DSML_TOOL_CALLS_TAG}\\s*>[\\s\\S]*?(?:<\\s*\\/\\s*${DSML_TOOL_CALLS_TAG}\\s*>|$)`,
  'g',
);
const DSML_TOOL_CALLS_DETECT_PATTERN = new RegExp(
  `<\\s*${DSML_TOOL_CALLS_TAG}\\s*>`,
);
const DSML_TOOL_CALLS_CLOSE_PATTERN = new RegExp(
  `<\\s*\\/\\s*${DSML_TOOL_CALLS_TAG}\\s*>`,
  'g',
);

export const hasAgentToolCallProtocol = (value?: string) =>
  Boolean(value && DSML_TOOL_CALLS_DETECT_PATTERN.test(value));

export const stripAgentProtocolContent = (value?: string) => {
  if (!value) {
    return '';
  }

  return value
    .replace(DSML_TOOL_CALLS_BLOCK_PATTERN, '')
    .replace(DSML_TOOL_CALLS_CLOSE_PATTERN, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const normalizeAnswer = (value?: string) => {
  const answer = stripAgentProtocolContent(value);
  return answer || undefined;
};

const hasGenericAgentCompletionPhrase = (compact: string) => {
  if (GENERIC_AGENT_ANSWER_PHRASES.some((phrase) => compact.includes(phrase))) {
    return true;
  }

  if (
    (compact.includes('已完整输出') || compact.includes('完整输出')) &&
    (compact.includes('诊断') || compact.includes('结论'))
  ) {
    return true;
  }

  return (
    compact.includes('完整的诊断结论') &&
    compact.includes('证据') &&
    compact.includes('建议') &&
    compact.includes('准确性提示')
  );
};

export const isGenericAgentAnswer = (value?: string) => {
  const answer = normalizeAnswer(value);
  if (!answer) {
    return false;
  }

  const compact = answer.replace(/\s+/g, '');
  const hasSection = REQUIRED_DIAGNOSTIC_SECTIONS.some((section) =>
    answer.includes(section),
  );
  if (hasSection) {
    return false;
  }

  return (
    (compact.includes('以上就是') && compact.includes('完整诊断')) ||
    hasGenericAgentCompletionPhrase(compact) ||
    (compact.includes('如果你能提供') && !answer.includes('###'))
  );
};

const getAnswerScore = (value?: string) => {
  const answer = normalizeAnswer(value);
  if (!answer) {
    return -1;
  }

  const sectionScore = REQUIRED_DIAGNOSTIC_SECTIONS.filter((section) =>
    answer.includes(section),
  ).length;
  const evidenceScore = /\[E\d+\]/.test(answer) ? 1 : 0;
  const genericPenalty = isGenericAgentAnswer(answer) ? 100000 : 0;

  return (
    answer.length + sectionScore * 10000 + evidenceScore * 5000 - genericPenalty
  );
};

export const pickBestAgentAnswerContent = (
  ...values: Array<string | undefined>
) =>
  values
    .map(normalizeAnswer)
    .filter(Boolean)
    .sort((first, second) => getAnswerScore(second) - getAnswerScore(first))[0];

export const buildAgentRunEvidenceFallback = (agentRun?: {
  evidences?: API.AgentEvidence[];
  run?: API.AgentRun;
  toolCalls?: API.AgentToolCall[];
}) => {
  const evidences = agentRun?.evidences || [];
  const toolCalls = agentRun?.toolCalls || [];

  if (evidences.length === 0 && toolCalls.length === 0) {
    return undefined;
  }

  const lines: string[] = [
    '### 结论',
    '本次诊断已完成只读的取证流程，但最终回答没有返回完整诊断正文。以下先展示本次已采集到的证据摘要，便于继续判断。',
    '',
    '### 证据',
  ];

  evidences.slice(0, 10).forEach((evidence, index) => {
    const resource = [
      evidence.resource_kind || evidence.source_kind,
      evidence.namespace ? `ns/${evidence.namespace}` : undefined,
      evidence.name,
    ]
      .filter(Boolean)
      .join(' ');
    lines.push(
      `- [E${index + 1}] ${resource || '证据'}：${evidence.summary || '-'}`,
    );
  });

  if (evidences.length === 0) {
    toolCalls.slice(0, 8).forEach((toolCall, index) => {
      lines.push(
        `- [E${index + 1}] ${toolCall.tool_id || '工具调用'}：${
          toolCall.output_summary || toolCall.error_message || toolCall.status
        }`,
      );
    });
  }

  lines.push('', '### 建议');
  lines.push(
    '- 优先核对上方证据中的异常资源、事件摘要、日志片段和失败工具调用。',
  );
  lines.push(
    '- 若需要完整根因结论，请打开 Run 运维详情查看完整取证链路，并可继续发起追问补充排查。',
  );
  lines.push('', '### 准确性提示');
  lines.push(
    '该兜底内容由前端基于已返回的只读证据摘要生成，不能替代模型完整诊断结论。',
  );

  return lines.join('\n');
};
