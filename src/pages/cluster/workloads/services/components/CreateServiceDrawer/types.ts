import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

export type ServiceInternalAccessMode = 'ClusterIP' | 'Headless';

export type ServiceExternalAccessMode = 'None' | 'NodePort' | 'LoadBalancer';

export type ServiceIpFamilyPolicy =
  | 'SingleStack'
  | 'PreferDualStack'
  | 'RequireDualStack';

export type ServiceIpFamily = 'IPv4' | 'IPv6';

export type ServiceTrafficPolicy = 'Cluster' | 'Local';

export type ServiceInternalTrafficPolicy = 'Cluster' | 'Local';

export type ServiceTrafficDistribution =
  | 'PreferClose'
  | 'PreferSameZone'
  | 'PreferSameNode';

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
  targetPort?: string | number;
  servicePort?: number;
  nodePort?: number;
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
  externalAccessAnnotations?: KeyValueEditorItem[];
  loadBalancerProvider?: string;
  loadBalancerClass?: string;
  allocateLoadBalancerNodePorts?: boolean;
  externalTrafficPolicy?: ServiceTrafficPolicy;
  internalTrafficPolicy?: ServiceInternalTrafficPolicy;
  ipFamilyPolicy?: ServiceIpFamilyPolicy;
  ipFamilies?: ServiceIpFamily[];
  trafficDistribution?: ServiceTrafficDistribution;
  labels: KeyValueEditorItem[];
};
