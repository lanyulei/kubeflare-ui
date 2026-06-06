import type { ChatMessageItem, ChatSession } from './types';

const DEFAULT_CREATED_AT = Date.now() - 60000;

export const responseParagraphs = [
  'Artificial Intelligence (AI) offers numerous advantages and has the potential to revolutionize various aspects of our lives. Here are some key advantages of AI:',
  'Automation: AI can automate repetitive and mundane tasks, saving time and effort for humans. It can handle large volumes of data, perform complex calculations, and execute tasks with precision and consistency. This automation leads to increased productivity and efficiency in various industries.',
  'Decision-making: AI systems can analyze vast amounts of data, identify patterns, and make informed decisions based on that analysis. This ability is particularly useful in complex scenarios where humans may struggle to process large datasets or where quick and accurate decisions are crucial.',
  'Improved accuracy: AI algorithms can achieve high levels of accuracy and precision in tasks such as image recognition, natural language processing, and data analysis. They can eliminate human errors caused by fatigue, distractions, or bias, leading to more reliable and consistent results.',
  'Continuous operation: AI systems can work tirelessly without the need for breaks, resulting in uninterrupted 24/7 operations. This capability is especially beneficial in applications like customer support chatbots, manufacturing processes, and surveillance systems.',
];

const defaultAssistantContent = responseParagraphs.join('\n\n');

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
  regenerating = false,
): ChatMessageItem => ({
  content: createAssistantReply(content, regenerating),
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

export const createAssistantReply = (content: string, regenerating = false) => {
  if (/artificial intelligence|人工智能|\bai\b/i.test(content)) {
    return defaultAssistantContent;
  }

  const prefix = regenerating
    ? '我重新整理了这条问题的回答：'
    : '我已经收到你的问题。';

  return [
    `${prefix}“${content}”`,
    '可以先从目标、上下文、约束和期望结果四个角度拆解，再把可执行的步骤整理出来。',
    '如果这是一个工程问题，我建议先明确输入输出，再确认边界条件，最后补充必要的验证方式。',
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
          '可以先检查节点 Ready 状态、最近事件、Pod 调度失败原因和 kubelet 日志。若资源压力较高，再继续查看 CPU、内存和磁盘相关指标。',
        createdAt: DEFAULT_CREATED_AT - 3599000,
        id: 'message-cluster-answer',
        role: 'assistant',
      },
    ],
    title: '集群节点排查',
    updatedAt: DEFAULT_CREATED_AT - 3599000,
  },
];
