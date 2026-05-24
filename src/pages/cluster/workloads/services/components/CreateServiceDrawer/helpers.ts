import { stringify } from 'yaml';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type {
  CreateServiceFormValues,
  ServicePortItem,
  ServicePortProtocol,
} from './types';

export const SERVICE_API_VERSION = 'v1';
export const SERVICE_KIND = 'Service';
export const SERVICE_RESOURCE_TYPE = 'Service';
export const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createKeyValueItem = (
  keyName = '',
  value = '',
): KeyValueEditorItem => ({
  id: createId(),
  keyName,
  value,
});

export const createServicePortItem = (
  values?: Partial<ServicePortItem>,
): ServicePortItem => ({
  id: createId(),
  protocol: values?.protocol || 'HTTP',
  name: values?.name || 'http-',
  containerPort: values?.containerPort,
  servicePort: values?.servicePort,
});

export const getInitialCreateServiceValues = (
  namespace?: string,
): CreateServiceFormValues => ({
  name: undefined,
  namespace,
  internalAccessMode: 'ClusterIP',
  selectors: [createKeyValueItem()],
  ports: [createServicePortItem()],
  enableExternalAccess: false,
  externalAccessMode: 'NodePort',
  enableSessionAffinity: false,
  sessionAffinityTimeoutSeconds: 10800,
  labels: [createKeyValueItem()],
});

export const getServiceStepFields = (step: number) => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 1) {
    return ['internalAccessMode', 'selectors', 'ports'];
  }
  return [
    'enableExternalAccess',
    'externalAccessMode',
    'enableSessionAffinity',
    'sessionAffinityTimeoutSeconds',
    'labels',
  ];
};

const toRecord = (items?: KeyValueEditorItem[]) =>
  (items || []).reduce<Record<string, string>>((record, item) => {
    const keyName = item.keyName.trim();
    if (keyName) {
      record[keyName] = item.value.trim();
    }
    return record;
  }, {});

const getKubernetesProtocol = (protocol: ServicePortProtocol) =>
  protocol === 'UDP' ? 'UDP' : 'TCP';

const getAppProtocol = (protocol: ServicePortProtocol) => {
  if (protocol === 'TCP' || protocol === 'UDP') {
    return undefined;
  }
  return protocol.toLowerCase();
};

const getServicePorts = (ports?: ServicePortItem[]) =>
  (ports || [])
    .filter((port) => port.servicePort)
    .map((port) => {
      const servicePort: Record<string, unknown> = {
        port: port.servicePort,
        protocol: getKubernetesProtocol(port.protocol),
      };
      const name = port.name?.trim();
      const appProtocol = getAppProtocol(port.protocol);

      if (name) {
        servicePort.name = name;
      }
      if (port.containerPort) {
        servicePort.targetPort = port.containerPort;
      }
      if (appProtocol) {
        servicePort.appProtocol = appProtocol;
      }

      return servicePort;
    });

export const buildCreateServiceManifest = (
  values: CreateServiceFormValues,
) => {
  const labels = toRecord(values.labels);
  const selectors = toRecord(values.selectors);
  const spec: Record<string, unknown> = {
    type: values.enableExternalAccess ? values.externalAccessMode : 'ClusterIP',
    selector: selectors,
    ports: getServicePorts(values.ports),
  };

  if (values.internalAccessMode === 'Headless' && !values.enableExternalAccess) {
    spec.clusterIP = 'None';
  }
  if (values.enableSessionAffinity) {
    spec.sessionAffinity = 'ClientIP';
    spec.sessionAffinityConfig = {
      clientIP: {
        timeoutSeconds: values.sessionAffinityTimeoutSeconds || 10800,
      },
    };
  }

  return {
    apiVersion: SERVICE_API_VERSION,
    kind: SERVICE_KIND,
    metadata: {
      name: values.name,
      namespace: values.namespace,
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
    },
    spec,
  };
};

export const buildCreateServiceYaml = (values: CreateServiceFormValues) =>
  stringify(buildCreateServiceManifest(values));
