import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

export type IngressRuleProtocol = 'HTTP' | 'HTTPS';

export type IngressPathType = 'Exact' | 'Prefix' | 'ImplementationSpecific';

export type IngressRouteRuleItem = {
  id: string;
  host?: string;
  path?: string;
  pathType: IngressPathType;
  protocol: IngressRuleProtocol;
  serviceName?: string;
  servicePort?: number;
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
