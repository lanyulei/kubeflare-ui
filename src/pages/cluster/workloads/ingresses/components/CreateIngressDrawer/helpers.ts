import { stringify } from 'yaml';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type {
  CreateIngressFormValues,
  IngressPathType,
  IngressRoutePathItem,
  IngressRouteRuleItem,
  IngressRuleProtocol,
} from './types';

export const INGRESS_API_VERSION = 'networking.k8s.io/v1';
export const INGRESS_KIND = 'Ingress';
export const INGRESS_RESOURCE_TYPE: API.ClusterResourceCreateType = 'Ingress';
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

export const createIngressPathItem = (
  values?: Partial<IngressRoutePathItem>,
): IngressRoutePathItem => ({
  id: values?.id || createId(),
  path: values?.path || '/',
  pathType: values?.pathType || 'Prefix',
  serviceName: values?.serviceName,
  servicePort: values?.servicePort,
});

export const createIngressRuleItem = (
  values?: Partial<IngressRouteRuleItem>,
): IngressRouteRuleItem => ({
  id: values?.id || createId(),
  host: values?.host,
  protocol: values?.protocol || 'HTTP',
  enableMetadata: values?.enableMetadata || false,
  metadata: values?.enableMetadata ? values.metadata : undefined,
  paths:
    values?.paths && values.paths.length > 0
      ? values.paths.map((path) => createIngressPathItem(path))
      : [createIngressPathItem()],
});

export const getInitialCreateIngressValues = (
  namespace?: string,
): CreateIngressFormValues => ({
  name: undefined,
  namespace,
  rules: [],
  enablePathRewrite: false,
  rewriteTarget: '/',
  annotations: [createKeyValueItem()],
  labels: [createKeyValueItem()],
});

export const getIngressStepFields = (step: number) => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 1) {
    return ['rules', 'enablePathRewrite', 'rewriteTarget'];
  }
  return ['annotations', 'labels'];
};

export const toRecord = (items?: KeyValueEditorItem[]) =>
  (items || []).reduce<Record<string, string>>((record, item) => {
    const keyName = item.keyName.trim();
    if (keyName) {
      record[keyName] = item.value.trim();
    }
    return record;
  }, {});

export const isValidIngressPath = (path?: IngressRoutePathItem) =>
  Boolean(
    path?.path?.trim()?.startsWith('/') &&
      path.pathType &&
      path.serviceName?.trim() &&
      path.servicePort &&
      path.servicePort >= 1 &&
      path.servicePort <= 65535,
  );

export const isValidIngressRule = (rule?: IngressRouteRuleItem) =>
  Boolean(rule?.host?.trim() && (rule.paths || []).some(isValidIngressPath));

const groupRulesByHost = (rules: IngressRouteRuleItem[]) =>
  rules.reduce<Record<string, IngressRoutePathItem[]>>((record, rule) => {
    const host = rule.host?.trim();
    const paths = (rule.paths || []).filter(isValidIngressPath);
    if (!host || paths.length === 0) {
      return record;
    }

    if (!record[host]) {
      record[host] = [];
    }
    record[host].push(...paths);
    return record;
  }, {});

const getTlsHosts = (rules: IngressRouteRuleItem[]) =>
  Array.from(
    new Set(
      rules
        .filter(
          (rule) =>
            rule.protocol === 'HTTPS' &&
            rule.host?.trim() &&
            (rule.paths || []).some(isValidIngressPath),
        )
        .map((rule) => rule.host?.trim() || ''),
    ),
  );

export const buildCreateIngressManifest = (values: CreateIngressFormValues) => {
  const annotations = toRecord(values.annotations);
  const labels = toRecord(values.labels);
  const groupedRules = groupRulesByHost(values.rules || []);
  const specRules = Object.entries(groupedRules).map(([host, paths]) => ({
    host,
    http: {
      paths: paths.map((path) => ({
        path: path.path || '/',
        pathType: path.pathType,
        backend: {
          service: {
            name: path.serviceName,
            port: {
              number: path.servicePort,
            },
          },
        },
      })),
    },
  }));
  const tlsHosts = getTlsHosts(values.rules || []);

  if (values.enablePathRewrite) {
    annotations['nginx.ingress.kubernetes.io/use-regex'] ||= 'true';
    annotations['nginx.ingress.kubernetes.io/rewrite-target'] =
      values.rewriteTarget?.trim() || '/';
  }

  const spec: Record<string, unknown> = {
    rules: specRules,
  };

  if (tlsHosts.length > 0) {
    spec.tls = [
      {
        hosts: tlsHosts,
      },
    ];
  }

  return {
    apiVersion: INGRESS_API_VERSION,
    kind: INGRESS_KIND,
    metadata: {
      name: values.name,
      namespace: values.namespace,
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
      ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    },
    spec,
  };
};

export const buildCreateIngressYaml = (values: CreateIngressFormValues) =>
  stringify(buildCreateIngressManifest(values), { indent: 2 });

export const INGRESS_PROTOCOL_OPTIONS: {
  label: string;
  value: IngressRuleProtocol;
}[] = [
  { label: 'HTTP', value: 'HTTP' },
  { label: 'HTTPS', value: 'HTTPS' },
];

export const INGRESS_PATH_TYPE_OPTIONS: {
  label: string;
  value: IngressPathType;
}[] = [
  { label: 'Prefix', value: 'Prefix' },
  { label: 'Exact', value: 'Exact' },
  { label: 'ImplementationSpecific', value: 'ImplementationSpecific' },
];
