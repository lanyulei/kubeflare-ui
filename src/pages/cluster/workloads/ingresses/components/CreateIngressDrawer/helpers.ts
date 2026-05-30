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

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getArrayValue = (value: unknown) => (Array.isArray(value) ? value : []);

const getStringValue = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const getNumberValue = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const mapRecordToKeyValueItems = (
  record?: Record<string, unknown>,
): KeyValueEditorItem[] =>
  Object.entries(record || {}).map(([keyName, value]) =>
    createKeyValueItem(keyName, String(value ?? '')),
  );

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
  ingressClassName: undefined,
  tlsSecretName: undefined,
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
    return [
      'rules',
      'ingressClassName',
      'tlsSecretName',
      'enablePathRewrite',
      'rewriteTarget',
    ];
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

const getIngressTlsHosts = (manifest?: Record<string, unknown>) =>
  new Set(
    getArrayValue(getRecordValue(manifest?.spec)?.tls)
      .map((item) => getRecordValue(item))
      .flatMap((item) => getArrayValue(item?.hosts))
      .map((item) => getStringValue(item))
      .filter(Boolean),
  );

const buildIngressRouteRules = (values: CreateIngressFormValues) => {
  const groupedRules = groupRulesByHost(values.rules || []);

  return Object.entries(groupedRules).map(([host, paths]) => ({
    host,
    http: {
      paths: paths.map((path) => ({
        path: path.path || '/',
        pathType: path.pathType,
        backend: {
          service: {
            name: path.serviceName,
            port:
              typeof path.servicePort === 'number'
                ? {
                    number: path.servicePort,
                  }
                : {
                    name: path.servicePort,
                  },
          },
        },
      })),
    },
  }));
};

const buildIngressTls = (values: CreateIngressFormValues) => {
  const tlsHosts = getTlsHosts(values.rules || []);

  return tlsHosts.length > 0
    ? [
        {
          hosts: tlsHosts,
          ...(values.tlsSecretName?.trim()
            ? { secretName: values.tlsSecretName.trim() }
            : {}),
        },
      ]
    : undefined;
};

export const buildIngressRouteSpec = (values: CreateIngressFormValues) => {
  const spec: Record<string, unknown> = {
    rules: buildIngressRouteRules(values),
  };
  const tls = buildIngressTls(values);

  if (values.ingressClassName?.trim()) {
    spec.ingressClassName = values.ingressClassName.trim();
  }
  if (tls) {
    spec.tls = tls;
  }

  return spec;
};

export const buildIngressMetadata = (values: CreateIngressFormValues) => {
  const annotations = toRecord(values.annotations);
  const labels = toRecord(values.labels);

  if (values.enablePathRewrite) {
    annotations['nginx.ingress.kubernetes.io/use-regex'] ||= 'true';
    annotations['nginx.ingress.kubernetes.io/rewrite-target'] =
      values.rewriteTarget?.trim() || '/';
  }

  return {
    ...(Object.keys(labels).length > 0 ? { labels } : {}),
    ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
  };
};

export const buildIngressRouteManifest = (
  values: CreateIngressFormValues,
  manifest?: Record<string, unknown>,
) => {
  const currentSpec = getRecordValue(manifest?.spec) || {};
  const currentMetadata = getRecordValue(manifest?.metadata) || {};
  const nextSpec = {
    ...currentSpec,
    ...buildIngressRouteSpec(values),
  };
  const annotations = toRecord(values.annotations);
  const labels = toRecord(values.labels);
  const tls = buildIngressTls(values);

  if (tls) {
    nextSpec.tls = tls;
  } else {
    delete nextSpec.tls;
  }
  if (values.ingressClassName?.trim()) {
    nextSpec.ingressClassName = values.ingressClassName.trim();
  } else {
    delete nextSpec.ingressClassName;
  }
  if (values.enablePathRewrite) {
    annotations['nginx.ingress.kubernetes.io/use-regex'] ||= 'true';
    annotations['nginx.ingress.kubernetes.io/rewrite-target'] =
      values.rewriteTarget?.trim() || '/';
  }

  const metadata = {
    ...currentMetadata,
    ...(Object.keys(labels).length > 0 ? { labels } : {}),
    ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
  };

  if (Object.keys(labels).length === 0) {
    delete metadata.labels;
  }
  if (Object.keys(annotations).length === 0) {
    delete metadata.annotations;
  }

  return {
    ...(manifest || {}),
    spec: nextSpec,
    metadata,
  };
};

export const isValidIngressPath = (path?: IngressRoutePathItem) =>
  Boolean(
    path?.path?.trim()?.startsWith('/') &&
      path.pathType &&
      path.serviceName?.trim() &&
      path.servicePort &&
      (typeof path.servicePort === 'number'
        ? path.servicePort >= 1 && path.servicePort <= 65535
        : path.servicePort.trim()),
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
  return {
    apiVersion: INGRESS_API_VERSION,
    kind: INGRESS_KIND,
    metadata: {
      name: values.name,
      namespace: values.namespace,
      ...buildIngressMetadata(values),
    },
    spec: buildIngressRouteSpec(values),
  };
};

export const buildIngressFormValuesFromManifest = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
): CreateIngressFormValues => {
  const metadata = getRecordValue(manifest?.metadata);
  const spec = getRecordValue(manifest?.spec);
  const annotations = {
    ...(getRecordValue(metadata?.annotations) as Record<string, unknown>),
  };
  const rewriteTarget = getStringValue(
    annotations['nginx.ingress.kubernetes.io/rewrite-target'],
  );
  const tlsItems = getArrayValue(spec?.tls)
    .map((item) => getRecordValue(item))
    .filter(Boolean);
  const tlsHosts = getIngressTlsHosts(manifest);
  const tlsSecretName = getStringValue(
    tlsItems.find((item) => getStringValue(item?.secretName))?.secretName,
  );
  const rules = getArrayValue(spec?.rules).flatMap((ruleItem) => {
    const rule = getRecordValue(ruleItem);
    const host = getStringValue(rule?.host);
    const paths = getArrayValue(getRecordValue(rule?.http)?.paths)
      .map((pathItem) => {
        const pathRecord = getRecordValue(pathItem);
        const backend = getRecordValue(pathRecord?.backend);
        const service = getRecordValue(backend?.service);
        const port = getRecordValue(service?.port);
        const servicePort =
          getNumberValue(port?.number) || getStringValue(port?.name);

        if (!servicePort) {
          return undefined;
        }

        return createIngressPathItem({
          path: getStringValue(pathRecord?.path) || '/',
          pathType:
            (getStringValue(pathRecord?.pathType) as IngressPathType) ||
            'Prefix',
          serviceName: getStringValue(service?.name),
          servicePort,
        });
      })
      .filter(Boolean) as IngressRoutePathItem[];

    if (!host || paths.length === 0) {
      return [];
    }

    return [
      createIngressRuleItem({
        host,
        protocol: tlsHosts.has(host) ? 'HTTPS' : 'HTTP',
        paths,
      }),
    ];
  });

  delete annotations['nginx.ingress.kubernetes.io/use-regex'];
  delete annotations['nginx.ingress.kubernetes.io/rewrite-target'];

  return {
    name: getStringValue(metadata?.name),
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace,
    rules,
    ingressClassName: getStringValue(spec?.ingressClassName),
    tlsSecretName,
    enablePathRewrite: Boolean(rewriteTarget),
    rewriteTarget: rewriteTarget || '/',
    annotations: mapRecordToKeyValueItems(annotations),
    labels: mapRecordToKeyValueItems(
      getRecordValue(metadata?.labels) as Record<string, unknown>,
    ),
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
