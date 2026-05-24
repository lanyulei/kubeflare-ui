import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

export type IngressRuleProtocol = 'HTTP' | 'HTTPS';

export type IngressPathType = 'Exact' | 'Prefix' | 'ImplementationSpecific';

export type IngressRoutePathItem = {
  id: string;
  path?: string;
  pathType: IngressPathType;
  serviceName?: string;
  servicePort?: number;
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
  ports?: number[];
  value: string;
};

export type CreateIngressFormValues = {
  name?: string;
  namespace?: string;
  rules: IngressRouteRuleItem[];
  enablePathRewrite: boolean;
  rewriteTarget?: string;
  labels: KeyValueEditorItem[];
  annotations: KeyValueEditorItem[];
};
