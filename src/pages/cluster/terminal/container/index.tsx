import { LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import { useParams } from '@umijs/max';
import { Alert, Button, Tag, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type TerminalStatus = 'connecting' | 'connected' | 'closed' | 'error';

type TerminalRouteParams = {
  clusterId?: string;
  namespace?: string;
  podName?: string;
  containerName?: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const maxOutputLength = 120000;

const useStyles = createStyles(({ token }) => ({
  page: {
    minHeight: '100vh',
    padding: token.paddingLG,
    background: token.colorBgLayout,
    color: token.colorText,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginMD,
    marginBottom: '16px',
  },
  title: {
    margin: '0 0 5px 0',
    color: token.colorText,
    fontSize: token.fontSizeLG,
    fontWeight: 600,
    lineHeight: token.lineHeightLG,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: token.marginXS,
    minWidth: 0,
  },
  name: {
    maxWidth: 320,
    overflow: 'hidden',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  panel: {
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgContainer,
    boxShadow: token.boxShadowTertiary,
  },
  terminal: {
    display: 'block',
    boxSizing: 'border-box',
    width: '100%',
    height: 'calc(100vh - 141px)',
    minHeight: 420,
    padding: token.padding,
    overflow: 'auto',
    resize: 'none',
    outline: 'none',
    border: 0,
    borderRadius: token.borderRadius,
    background: '#111827',
    color: '#d1d5db',
    fontFamily:
      'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    cursor: 'text',
  },
}));

const decodeParam = (value?: string) => {
  if (!value) {
    return undefined;
  }

  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
};

const appendCommandParams = (params: URLSearchParams) => {
  [
    '/bin/sh',
    '-c',
    'command -v bash >/dev/null 2>&1 && exec bash || exec sh',
  ].forEach((command) => {
    params.append('command', command);
  });
};

const createTerminalWebSocketUrl = ({
  clusterId,
  namespace,
  podName,
  containerName,
}: Required<TerminalRouteParams>) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const params = new URLSearchParams({
    container: containerName,
    stdin: 'true',
    stdout: 'true',
    stderr: 'true',
    tty: 'true',
    clusterId,
  });

  appendCommandParams(params);

  return `${protocol}//${window.location.host}/kapi/v1/namespaces/${encodeURIComponent(
    namespace,
  )}/pods/${encodeURIComponent(podName)}/exec?${params.toString()}`;
};

const trimOutput = (value: string) => {
  if (value.length <= maxOutputLength) {
    return value;
  }

  return value.slice(value.length - maxOutputLength);
};

const getStatusTag = (status: TerminalStatus) => {
  if (status === 'connected') {
    return <Tag color="success">已连接</Tag>;
  }

  if (status === 'connecting') {
    return (
      <Tag icon={<LoadingOutlined />} color="processing">
        连接中
      </Tag>
    );
  }

  if (status === 'error') {
    return <Tag color="error">连接失败</Tag>;
  }

  return <Tag>已断开</Tag>;
};

const ContainerTerminal = () => {
  const { styles } = useStyles();
  const params = useParams() as TerminalRouteParams;
  const terminalRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<WebSocket | undefined>(undefined);
  const [status, setStatus] = useState<TerminalStatus>('connecting');
  const [output, setOutput] = useState('Connecting...\n');

  const terminalParams = useMemo(() => {
    return {
      clusterId: decodeParam(params.clusterId),
      namespace: decodeParam(params.namespace),
      podName: decodeParam(params.podName),
      containerName: decodeParam(params.containerName),
    };
  }, [
    params.clusterId,
    params.containerName,
    params.namespace,
    params.podName,
  ]);

  const missingParams = !(
    terminalParams.clusterId &&
    terminalParams.namespace &&
    terminalParams.podName &&
    terminalParams.containerName
  );

  const appendOutput = useCallback((value: string) => {
    setOutput((current) => trimOutput(`${current}${value}`));
    requestAnimationFrame(() => {
      const terminal = terminalRef.current;
      if (terminal) {
        terminal.scrollTop = terminal.scrollHeight;
      }
    });
  }, []);

  const sendInput = useCallback((value: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = encoder.encode(value);
    const frame = new Uint8Array(payload.length + 1);
    frame[0] = 0;
    frame.set(payload, 1);
    socket.send(frame);
  }, []);

  const connect = useCallback(() => {
    if (missingParams) {
      setStatus('error');
      setOutput('容器终端参数不完整，无法建立连接。\n');
      return undefined;
    }

    const url = createTerminalWebSocketUrl(
      terminalParams as Required<TerminalRouteParams>,
    );
    const socket = new WebSocket(url, ['v4.channel.k8s.io']);

    socket.binaryType = 'arraybuffer';
    socketRef.current = socket;
    setStatus('connecting');
    setOutput('Connecting...\n');

    socket.onopen = () => {
      console.info('[terminal] websocket open', {
        protocol: socket.protocol,
        extensions: socket.extensions,
        url,
      });
      setStatus('connected');
      setOutput('');
      terminalRef.current?.focus();
    };

    socket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(event.data);
        appendOutput(decoder.decode(bytes.slice(1)));
        return;
      }

      appendOutput(String(event.data));
    };

    socket.onerror = (event) => {
      console.error('[terminal] websocket error', event, {
        readyState: socket.readyState,
        protocol: socket.protocol,
        extensions: socket.extensions,
        url,
      });
      setStatus('error');
      appendOutput('\n连接失败，请检查容器状态或稍后重试。\n');
    };

    socket.onclose = (event) => {
      console.warn('[terminal] websocket close', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        readyState: socket.readyState,
        protocol: socket.protocol,
        extensions: socket.extensions,
        url,
      });
      setStatus((current) => (current === 'error' ? current : 'closed'));
      appendOutput(
        `\nConnection closed. code=${event.code} clean=${event.wasClean}${
          event.reason ? ` reason=${event.reason}` : ''
        }\n`,
      );
    };

    return socket;
  }, [appendOutput, missingParams, terminalParams]);

  useEffect(() => {
    const socket = connect();

    return () => {
      socket?.close();
    };
  }, [connect]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      sendInput('\r');
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      sendInput('\u007f');
      return;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      sendInput(event.key);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    sendInput(event.clipboardData.getData('text'));
  };

  const reconnect = () => {
    socketRef.current?.close();
    connect();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Terminal</h1>
          <div className={styles.meta}>
            {getStatusTag(status)}
            <Tooltip title={terminalParams.containerName}>
              <span className={styles.name}>
                {terminalParams.namespace}/{terminalParams.podName}/
                {terminalParams.containerName}
              </span>
            </Tooltip>
          </div>
        </div>
        <Tooltip title="重连">
          <Button
            aria-label="重连"
            disabled={status === 'connecting'}
            icon={<ReloadOutlined />}
            onClick={reconnect}
            shape="circle"
            type="text"
          />
        </Tooltip>
      </div>

      {missingParams ? (
        <Alert
          message="终端参数不完整"
          showIcon
          type="error"
          description="请从容器组详情中的容器终端入口重新打开。"
        />
      ) : (
        <div className={styles.panel}>
          <textarea
            aria-label="容器终端"
            className={styles.terminal}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            readOnly
            ref={terminalRef}
            value={output || ' '}
          />
        </div>
      )}
    </div>
  );
};

export default ContainerTerminal;
