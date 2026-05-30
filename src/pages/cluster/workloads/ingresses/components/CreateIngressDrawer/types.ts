import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

export type IngressRuleProtocol = 'HTTP' | 'HTTPS';

export type IngressPathType = 'Exact' | 'Prefix' | 'ImplementationSpecific';

export type IngressRoutePathItem = {
  id: string;
  path?: string;
  pathType: IngressPathType;
  serviceName?: string;
  servicePort?: number | string;
};

export type IngressRouteRuleItem = {
  id: string;
  host?: string;
  protocol: IngressRuleProtocol;
  paths: IngressRoutePathItem[];
  enableMetadata?: boolean;
  metadata?: string;
};

export type IngressServiceOption = {
  label: string;
  ports?: {
    label: string;
    value: number | string;
  }[];
  value: string;
};

export type CreateIngressFormValues = {
  name?: string;
  namespace?: string;
  rules: IngressRouteRuleItem[];
  ingressClassName?: string;
  tlsSecretName?: string;
  enablePathRewrite: boolean;
  rewriteTarget?: string;
  labels: KeyValueEditorItem[];
  annotations: KeyValueEditorItem[];
};
