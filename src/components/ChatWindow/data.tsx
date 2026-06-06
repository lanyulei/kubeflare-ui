import type { ChatMessageItem, ChatSession } from './types';

const DEFAULT_CREATED_AT = Date.now() - 60000;

export const responseParagraphs = [
  '### Key advantages of Artificial Intelligence',
  '- **Automation:** AI can automate repetitive and mundane tasks, saving time and effort for humans.',
  '- **Decision-making:** AI systems can analyze vast amounts of data, identify patterns, and support informed decisions.',
  '- **Improved accuracy:** AI algorithms can reduce human error in image recognition, natural language processing, and data analysis.',
  '- **Continuous operation:** AI systems can work without breaks, which is helpful for customer support, manufacturing, and monitoring scenarios.',
];

const defaultAssistantContent = responseParagraphs.join('\n');

export const createChatId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createUserMessage = (
  content: string,
  createdAt = Date.now(),
): ChatMessageItem => ({
  content,
  createdAt,
  id: createChatId('message-user'),
  role: 'user',
});

export const createAssistantMessage = (
  content: string,
  createdAt = Date.now(),
): ChatMessageItem => ({
  content: createAssistantReply(content),
  createdAt,
  id: createChatId('message-assistant'),
  role: 'assistant',
});

export const createBlankSession = (
  index: number,
  createdAt = Date.now(),
): ChatSession => ({
  createdAt,
  id: createChatId('session'),
  messages: [],
  title: `新会话 ${index}`,
  updatedAt: createdAt,
});

export const createSessionTitle = (content: string) => {
  const normalizedContent = content.replace(/\s+/g, ' ').trim();
  return normalizedContent.length > 18
    ? `${normalizedContent.slice(0, 18)}...`
    : normalizedContent || '新会话';
};

export const createAssistantReply = (content: string) => {
  if (/artificial intelligence|人工智能|\bai\b/i.test(content)) {
    return defaultAssistantContent;
  }

  return [
    `**我已经收到你的问题。** “${content}”`,
    '可以先从以下角度拆解：',
    [
      '- **目标：** 明确你希望最终得到什么结果。',
      '- **上下文：** 补充当前环境、已有数据和限制条件。',
      '- **验证：** 定义怎样确认输出是正确的。',
    ].join('\n'),
    '```text\n输入 -> 分析 -> 实现 -> 验证\n```',
  ].join('\n\n');
};

export const initialChatSessions: ChatSession[] = [
  {
    createdAt: DEFAULT_CREATED_AT,
    id: 'session-ai-advantages',
    messages: [
      {
        content: 'The advantages of Artificial Intelligence',
        createdAt: DEFAULT_CREATED_AT,
        id: 'message-ai-question',
        role: 'user',
      },
      {
        content: defaultAssistantContent,
        createdAt: DEFAULT_CREATED_AT + 1000,
        id: 'message-ai-answer',
        role: 'assistant',
      },
    ],
    title: 'AI 优势分析',
    updatedAt: DEFAULT_CREATED_AT + 1000,
  },
  {
    createdAt: DEFAULT_CREATED_AT - 3600000,
    id: 'session-cluster-troubleshooting',
    messages: [
      {
        content: '如何排查集群节点状态异常？',
        createdAt: DEFAULT_CREATED_AT - 3600000,
        id: 'message-cluster-question',
        role: 'user',
      },
      {
        content:
          '**排查建议：**\n\n- 检查节点 `Ready` 状态\n- 查看最近事件和 Pod 调度失败原因\n- 必要时继续分析 kubelet 日志、CPU、内存和磁盘指标',
        createdAt: DEFAULT_CREATED_AT - 3599000,
        id: 'message-cluster-answer',
        role: 'assistant',
      },
    ],
    title: '集群节点排查',
    updatedAt: DEFAULT_CREATED_AT - 3599000,
  },
];
