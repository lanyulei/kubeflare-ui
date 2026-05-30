import { App } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  matchClusterEvent,
  watchClusterEvents,
} from '@/services/kubeflare/cluster/event';
import { mergeEventItems } from './eventHelpers';

type WatchStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

type UseClusterEventWatchOptions = {
  enabled: boolean;
  filters?: API.ClusterEventListParams;
  resourceVersion?: string;
  onResourceVersionChange?: (resourceVersion?: string) => void;
};

const MAX_RECONNECT_DELAY = 30000;
const WATCH_COMPLETE_RECONNECT_DELAY = 500;

const useClusterEventWatch = ({
  enabled,
  filters,
  resourceVersion,
  onResourceVersionChange,
}: UseClusterEventWatchOptions) => {
  const { message } = App.useApp();
  const [items, setItems] = useState<API.ClusterEventItem[]>([]);
  const [status, setStatus] = useState<WatchStatus>('idle');
  const reconnectCountRef = useRef(0);
  const enabledRef = useRef(enabled);
  const filtersRef = useRef(filters);
  const resourceVersionRef = useRef(resourceVersion);

  useEffect(() => {
    enabledRef.current = enabled;
    filtersRef.current = filters;
    resourceVersionRef.current = resourceVersion;
  }, [enabled, filters, resourceVersion]);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    const abortController = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const connect = async () => {
      setStatus(reconnectCountRef.current > 0 ? 'reconnecting' : 'connecting');
      try {
        await watchClusterEvents({
          signal: abortController.signal,
          params: {
            ...filtersRef.current,
            resourceVersion: resourceVersionRef.current,
          },
          onEvent: (watchEvent) => {
            if (watchEvent.resourceVersion) {
              resourceVersionRef.current = watchEvent.resourceVersion;
              onResourceVersionChange?.(watchEvent.resourceVersion);
            }
            if (watchEvent.type === 'ERROR') {
              throw new Error(watchEvent.errorMessage || '事件 Watch 异常');
            }
            if (
              watchEvent.object &&
              watchEvent.type !== 'DELETED' &&
              matchClusterEvent(watchEvent.object, filtersRef.current)
            ) {
              setItems((currentItems) =>
                mergeEventItems(
                  currentItems,
                  watchEvent.object as API.ClusterEventItem,
                ),
              );
            }
            if (
              watchEvent.object &&
              watchEvent.type === 'DELETED' &&
              matchClusterEvent(watchEvent.object, filtersRef.current)
            ) {
              setItems((currentItems) =>
                mergeEventItems(currentItems, {
                  ...watchEvent.object,
                  expired: true,
                } as API.ClusterEventItem),
              );
            }
            setStatus('connected');
            reconnectCountRef.current = 0;
          },
        });
        if (!abortController.signal.aborted && !stopped && enabledRef.current) {
          reconnectTimer = setTimeout(connect, WATCH_COMPLETE_RECONNECT_DELAY);
        }
      } catch (_error) {
        if (abortController.signal.aborted || stopped || !enabledRef.current) {
          return;
        }

        const reconnectDelay = Math.min(
          MAX_RECONNECT_DELAY,
          1000 * 2 ** reconnectCountRef.current,
        );
        reconnectCountRef.current += 1;
        setStatus('error');
        message.warning('事件实时连接已断开，正在尝试重连');
        reconnectTimer = setTimeout(connect, reconnectDelay);
      }
    };

    connect();

    return () => {
      stopped = true;
      abortController.abort();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      reconnectCountRef.current = 0;
    };
  }, [enabled, filters, message, onResourceVersionChange, resourceVersion]);

  return {
    clearItems,
    items,
    status,
  };
};

export type { WatchStatus };
export default useClusterEventWatch;
