import {
  type AgentStreamEvent,
  type AgentStreamEventName,
  createAgentRunStream,
} from '@/services/kubeflare/agent';

type ReadAgentRunStreamOptions = {
  agentType: API.AgentType;
  body: API.RunAgentParams;
  onEvent: (event: AgentStreamEvent) => void;
  signal?: AbortSignal;
};

type ParsedSseEvent = {
  data: string;
  event?: string;
};

export const readAgentRunStream = async ({
  agentType,
  body,
  onEvent,
  signal,
}: ReadAgentRunStreamOptions) => {
  const response = await createAgentRunStream(agentType, body, { signal });
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('当前浏览器不支持流式响应');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      const parsed = parseSseBlock(block);
      const event = toAgentStreamEvent(parsed);
      if (event) {
        onEvent(event);
        if (shouldYieldAfterEvent(event)) {
          await waitForNextPaint();
        }
      }
    }
  }

  buffer += decoder.decode();
  const parsed = parseSseBlock(buffer);
  const event = toAgentStreamEvent(parsed);
  if (event) {
    onEvent(event);
  }
};

const shouldYieldAfterEvent = (event: AgentStreamEvent) =>
  event.event === 'agent.answer.delta';

const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    if (
      typeof window === 'undefined' ||
      typeof window.requestAnimationFrame !== 'function'
    ) {
      setTimeout(resolve, 16);
      return;
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

const parseSseBlock = (block: string): ParsedSseEvent | undefined => {
  const lines = block.split(/\r?\n/);
  const dataLines: string[] = [];
  let event: string | undefined;

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }

  if (!event && dataLines.length === 0) {
    return undefined;
  }

  return {
    data: dataLines.join('\n'),
    event,
  };
};

const toAgentStreamEvent = (
  parsed?: ParsedSseEvent,
): AgentStreamEvent | undefined => {
  if (!parsed?.event || !parsed.data) {
    return undefined;
  }

  const payload = JSON.parse(parsed.data) as Omit<AgentStreamEvent, 'event'>;
  return {
    ...payload,
    event: parsed.event as AgentStreamEventName,
  };
};
