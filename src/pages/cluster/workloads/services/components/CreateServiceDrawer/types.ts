import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

export type ServiceInternalAccessMode = 'ClusterIP' | 'Headless';

export type ServiceExternalAccessMode = 'NodePort' | 'LoadBalancer';

export type ServicePortProtocol =
  | 'GRPC'
  | 'HTTP'
  | 'HTTP2'
  | 'HTTPS'
  | 'MONGO'
  | 'REDIS'
  | 'TCP'
  | 'TLS'
  | 'UDP';

export type ServicePortItem = {
  id: string;
  protocol: ServicePortProtocol;
  name?: string;
  containerPort?: number;
  servicePort?: number;
};

export type CreateServiceFormValues = {
  name?: string;
  namespace?: string;
  internalAccessMode: ServiceInternalAccessMode;
  selectors: KeyValueEditorItem[];
  ports: ServicePortItem[];
  enableExternalAccess: boolean;
  externalAccessMode: ServiceExternalAccessMode;
  enableSessionAffinity: boolean;
  sessionAffinityTimeoutSeconds?: number;
  labels: KeyValueEditorItem[];
};
