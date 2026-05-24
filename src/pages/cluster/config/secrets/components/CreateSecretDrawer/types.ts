type SecretType =
  | 'Opaque'
  | 'kubernetes.io/basic-auth'
  | 'kubernetes.io/dockerconfigjson'
  | 'kubernetes.io/tls';

type SecretDataItem = {
  id: string;
  keyName: string;
  value: string;
};

type RegistryProtocol = 'http://' | 'https://';

type CreateSecretFormValues = {
  name?: string;
  namespace?: string;
  type: SecretType;
  dataItems: SecretDataItem[];
  tlsCertificate?: string;
  tlsPrivateKey?: string;
  registryProtocol: RegistryProtocol;
  registryAddress?: string;
  registryUsername?: string;
  registryPassword?: string;
  registryEmail?: string;
  skipTlsVerify: boolean;
  setAsDefault: boolean;
  basicAuthUsername?: string;
  basicAuthPassword?: string;
};

export type {
  CreateSecretFormValues,
  RegistryProtocol,
  SecretDataItem,
  SecretType,
};
