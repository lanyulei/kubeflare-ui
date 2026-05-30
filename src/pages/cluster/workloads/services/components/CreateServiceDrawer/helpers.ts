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
  targetPort: values?.targetPort,
  servicePort: values?.servicePort,
  nodePort: values?.nodePort,
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
  externalAccessAnnotations: [createKeyValueItem()],
  loadBalancerProvider: undefined,
  loadBalancerClass: undefined,
  allocateLoadBalancerNodePorts: true,
  externalTrafficPolicy: undefined,
  internalTrafficPolicy: undefined,
  ipFamilyPolicy: undefined,
  ipFamilies: undefined,
  trafficDistribution: undefined,
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
    'loadBalancerClass',
    'allocateLoadBalancerNodePorts',
    'externalTrafficPolicy',
    'internalTrafficPolicy',
    'ipFamilyPolicy',
    'ipFamilies',
    'trafficDistribution',
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

const toNullableRecordPatch = (
  nextItems?: KeyValueEditorItem[],
  previousRecord?: Record<string, unknown>,
) => {
  const nextRecord = toRecord(nextItems);
  const patch = Object.keys(previousRecord || {}).reduce<
    Record<string, string | null>
  >((record, keyName) => {
    if (!(keyName in nextRecord)) {
      record[keyName] = null;
    }
    return record;
  }, {});

  Object.entries(nextRecord).forEach(([keyName, value]) => {
    patch[keyName] = value;
  });

  return patch;
};

const toKeyValueItems = (record?: Record<string, unknown>) => {
  const entries = Object.entries(record || {});

  return entries.length > 0
    ? entries.map(([keyName, value]) =>
        createKeyValueItem(keyName, String(value)),
      )
    : [createKeyValueItem()];
};

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getArrayValue = (value: unknown) => (Array.isArray(value) ? value : []);

const getStringValue = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const getNumberValue = (value: unknown) =>
  typeof value === 'number' && !Number.isNaN(value) ? value : undefined;

const getBooleanValue = (value: unknown) =>
  typeof value === 'boolean' ? value : undefined;

const getKubernetesProtocol = (protocol: ServicePortProtocol) =>
  protocol === 'UDP' ? 'UDP' : 'TCP';

const getAppProtocol = (protocol: ServicePortProtocol) => {
  if (protocol === 'TCP' || protocol === 'UDP') {
    return undefined;
  }
  return protocol.toLowerCase();
};

const getFormProtocol = (
  protocol?: unknown,
  appProtocol?: unknown,
): ServicePortProtocol => {
  const normalizedAppProtocol = getStringValue(appProtocol)?.toUpperCase();

  if (
    normalizedAppProtocol &&
    ['GRPC', 'HTTP', 'HTTP2', 'HTTPS', 'MONGO', 'REDIS', 'TLS'].includes(
      normalizedAppProtocol,
    )
  ) {
    return normalizedAppProtocol as ServicePortProtocol;
  }

  return getStringValue(protocol) === 'UDP' ? 'UDP' : 'TCP';
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
      } else if (port.targetPort) {
        servicePort.targetPort = port.targetPort;
      }
      if (port.nodePort) {
        servicePort.nodePort = port.nodePort;
      }
      if (appProtocol) {
        servicePort.appProtocol = appProtocol;
      }

      return servicePort;
    });

const setIfDefined = (
  target: Record<string, unknown>,
  key: string,
  value?: boolean | string | string[],
) => {
  if (
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return;
  }
  target[key] = value;
};

export const buildCreateServiceManifest = (values: CreateServiceFormValues) => {
  const labels = toRecord(values.labels);
  const selectors = toRecord(values.selectors);
  const spec: Record<string, unknown> = {
    type:
      values.enableExternalAccess && values.externalAccessMode !== 'None'
        ? values.externalAccessMode
        : 'ClusterIP',
    selector: selectors,
    ports: getServicePorts(values.ports),
  };

  if (
    values.internalAccessMode === 'Headless' &&
    !values.enableExternalAccess
  ) {
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
  setIfDefined(spec, 'ipFamilyPolicy', values.ipFamilyPolicy);
  setIfDefined(spec, 'ipFamilies', values.ipFamilies);
  setIfDefined(spec, 'internalTrafficPolicy', values.internalTrafficPolicy);
  setIfDefined(spec, 'trafficDistribution', values.trafficDistribution);
  if (spec.type === 'NodePort' || spec.type === 'LoadBalancer') {
    setIfDefined(spec, 'externalTrafficPolicy', values.externalTrafficPolicy);
  }
  if (spec.type === 'LoadBalancer') {
    setIfDefined(spec, 'loadBalancerClass', values.loadBalancerClass?.trim());
    setIfDefined(
      spec,
      'allocateLoadBalancerNodePorts',
      values.allocateLoadBalancerNodePorts,
    );
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

export const buildServiceFormValuesFromManifest = (
  manifest?: Record<string, unknown>,
): CreateServiceFormValues => {
  const metadata = getRecordValue(manifest?.metadata);
  const spec = getRecordValue(manifest?.spec);
  const serviceType = getStringValue(spec?.type) || 'ClusterIP';
  const sessionAffinityConfig = getRecordValue(spec?.sessionAffinityConfig);
  const clientIP = getRecordValue(sessionAffinityConfig?.clientIP);
  const ports = getArrayValue(spec?.ports)
    .map((item) => getRecordValue(item))
    .filter(Boolean)
    .map((port) =>
      createServicePortItem({
        protocol: getFormProtocol(port?.protocol, port?.appProtocol),
        name: getStringValue(port?.name),
        containerPort: getNumberValue(port?.targetPort),
        targetPort:
          typeof port?.targetPort === 'number' ||
          typeof port?.targetPort === 'string'
            ? port.targetPort
            : undefined,
        servicePort: getNumberValue(port?.port),
        nodePort: getNumberValue(port?.nodePort),
      }),
    );

  return {
    name: getStringValue(metadata?.name),
    namespace: getStringValue(metadata?.namespace),
    internalAccessMode: spec?.clusterIP === 'None' ? 'Headless' : 'ClusterIP',
    selectors: toKeyValueItems(getRecordValue(spec?.selector)),
    ports: ports.length > 0 ? ports : [createServicePortItem()],
    enableExternalAccess:
      serviceType === 'NodePort' || serviceType === 'LoadBalancer',
    externalAccessMode:
      serviceType === 'LoadBalancer'
        ? 'LoadBalancer'
        : serviceType === 'NodePort'
          ? 'NodePort'
          : 'None',
    enableSessionAffinity: spec?.sessionAffinity === 'ClientIP',
    sessionAffinityTimeoutSeconds:
      getNumberValue(clientIP?.timeoutSeconds) || 10800,
    externalAccessAnnotations: toKeyValueItems(
      getRecordValue(metadata?.annotations),
    ),
    loadBalancerProvider: getStringValue(
      getRecordValue(metadata?.annotations)?.[
        'kubeflare.io/load-balancer-provider'
      ],
    ),
    loadBalancerClass: getStringValue(spec?.loadBalancerClass),
    allocateLoadBalancerNodePorts:
      getBooleanValue(spec?.allocateLoadBalancerNodePorts) ?? true,
    externalTrafficPolicy:
      getStringValue(spec?.externalTrafficPolicy) === 'Local'
        ? 'Local'
        : getStringValue(spec?.externalTrafficPolicy) === 'Cluster'
          ? 'Cluster'
          : undefined,
    internalTrafficPolicy:
      getStringValue(spec?.internalTrafficPolicy) === 'Local'
        ? 'Local'
        : getStringValue(spec?.internalTrafficPolicy) === 'Cluster'
          ? 'Cluster'
          : undefined,
    ipFamilyPolicy:
      getStringValue(spec?.ipFamilyPolicy) === 'PreferDualStack'
        ? 'PreferDualStack'
        : getStringValue(spec?.ipFamilyPolicy) === 'RequireDualStack'
          ? 'RequireDualStack'
          : getStringValue(spec?.ipFamilyPolicy) === 'SingleStack'
            ? 'SingleStack'
            : undefined,
    ipFamilies: getArrayValue(spec?.ipFamilies).filter(
      (item): item is 'IPv4' | 'IPv6' => item === 'IPv4' || item === 'IPv6',
    ),
    trafficDistribution:
      getStringValue(spec?.trafficDistribution) === 'PreferClose'
        ? 'PreferClose'
        : getStringValue(spec?.trafficDistribution) === 'PreferSameZone'
          ? 'PreferSameZone'
          : getStringValue(spec?.trafficDistribution) === 'PreferSameNode'
            ? 'PreferSameNode'
            : undefined,
    labels: toKeyValueItems(getRecordValue(metadata?.labels)),
  };
};

export const buildServiceSettingsSpecPatch = (
  values: CreateServiceFormValues,
) => {
  const spec: Record<string, unknown> = {
    selector: toRecord(values.selectors),
    ports: getServicePorts(values.ports),
  };

  if (values.enableSessionAffinity) {
    spec.sessionAffinity = 'ClientIP';
    spec.sessionAffinityConfig = {
      clientIP: {
        timeoutSeconds: values.sessionAffinityTimeoutSeconds || 10800,
      },
    };
  } else {
    spec.sessionAffinity = 'None';
    spec.sessionAffinityConfig = null;
  }
  setIfDefined(spec, 'ipFamilyPolicy', values.ipFamilyPolicy);
  setIfDefined(spec, 'ipFamilies', values.ipFamilies);
  setIfDefined(spec, 'internalTrafficPolicy', values.internalTrafficPolicy);
  setIfDefined(spec, 'trafficDistribution', values.trafficDistribution);

  return spec;
};

export const buildServiceExternalAccessSpecPatch = (
  values: CreateServiceFormValues,
  manifest?: Record<string, unknown>,
) => {
  const externalAccessMode = values.externalAccessMode;
  const enabled = externalAccessMode !== 'None';
  const metadata = getRecordValue(manifest?.metadata);
  const previousAnnotations = getRecordValue(metadata?.annotations);
  const annotations = toNullableRecordPatch(
    values.externalAccessAnnotations,
    previousAnnotations,
  );

  if (values.loadBalancerProvider) {
    annotations['kubeflare.io/load-balancer-provider'] =
      values.loadBalancerProvider;
  }

  return {
    spec: {
      type: enabled ? externalAccessMode : 'ClusterIP',
      ports: getServicePorts(
        values.ports?.map((port) =>
          enabled ? port : { ...port, nodePort: undefined },
        ),
      ),
      ...(enabled && externalAccessMode === 'LoadBalancer'
        ? {
            ...(values.loadBalancerClass?.trim()
              ? { loadBalancerClass: values.loadBalancerClass.trim() }
              : {}),
            allocateLoadBalancerNodePorts:
              values.allocateLoadBalancerNodePorts ?? true,
          }
        : {
            allocateLoadBalancerNodePorts: null,
          }),
      ...(enabled && values.externalTrafficPolicy
        ? { externalTrafficPolicy: values.externalTrafficPolicy }
        : { externalTrafficPolicy: null }),
    },
    ...(externalAccessMode === 'LoadBalancer'
      ? {
          metadata: {
            annotations,
          },
        }
      : {}),
  };
};
