const CURRENT_CLUSTER_STORAGE_KEY = 'kubeflare.currentClusterId';

type ContainerTerminalParams = {
  namespace?: string;
  podName?: string;
  containerName?: string;
};

type OpenTerminalResult =
  | {
      ok: true;
      url: string;
    }
  | {
      ok: false;
      reason: 'missing-params' | 'popup-blocked';
    };

const encodePath = (value: string) => encodeURIComponent(value);

const getCurrentClusterId = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.localStorage.getItem(CURRENT_CLUSTER_STORAGE_KEY) || undefined;
};

export const buildContainerTerminalPath = ({
  namespace,
  podName,
  containerName,
}: ContainerTerminalParams) => {
  const clusterId = getCurrentClusterId();

  if (!clusterId || !namespace || !podName || !containerName) {
    return undefined;
  }

  return [
    '/terminal/cluster',
    encodePath(clusterId),
    'namespaces',
    encodePath(namespace),
    'pods',
    encodePath(podName),
    'containers',
    encodePath(containerName),
  ].join('/');
};

export const openContainerTerminalWindow = (
  params: ContainerTerminalParams,
): OpenTerminalResult => {
  const url = buildContainerTerminalPath(params);

  if (!url) {
    return {
      ok: false,
      reason: 'missing-params',
    };
  }

  const popup = window.open(
    url,
    '_blank',
    'width=1180,height=760,noopener=no,noreferrer=no',
  );

  if (!popup) {
    return {
      ok: false,
      reason: 'popup-blocked',
    };
  }

  popup.opener = null;
  popup.focus();

  return {
    ok: true,
    url,
  };
};
