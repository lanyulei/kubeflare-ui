import {
  type AiChatStreamEvent,
  type AiChatStreamEventName,
  createAiChatMessageStream,
} from '@/services/kubeflare/ai/chat';

type ReadAiChatStreamOptions = {
  body: API.CreateAiChatMessageParams;
  onEvent: (event: AiChatStreamEvent) => void;
  sessionID: string;
  signal?: AbortSignal;
};

type ParsedSseEvent = {
  data: string;
  event?: string;
};

export const readAiChatStream = async ({
  body,
  onEvent,
  sessionID,
  signal,
}: ReadAiChatStreamOptions) => {
  const response = await createAiChatMessageStream(sessionID, body, { signal });
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
      const event = toAiChatStreamEvent(parsed);
      if (event) {
        onEvent(event);
      }
    }
  }

  buffer += decoder.decode();
  const parsed = parseSseBlock(buffer);
  const event = toAiChatStreamEvent(parsed);
  if (event) {
    onEvent(event);
  }
};

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

const toAiChatStreamEvent = (
  parsed?: ParsedSseEvent,
): AiChatStreamEvent | undefined => {
  if (!parsed?.event || !parsed.data) {
    return undefined;
  }

  const payload = JSON.parse(parsed.data) as Omit<AiChatStreamEvent, 'event'>;
  return {
    ...payload,
    event: parsed.event as AiChatStreamEventName,
  };
};
