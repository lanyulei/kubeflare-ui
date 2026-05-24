import { stringify } from 'yaml';
import type {
  CreateSecretFormValues,
  RegistryProtocol,
  SecretDataItem,
  SecretType,
} from './types';

export const SECRET_API_VERSION = 'v1';
export const SECRET_KIND = 'Secret';
export const SECRET_RESOURCE_TYPE: API.ClusterResourceCreateType = 'Secret';
export const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createSecretDataItem = (
  keyName = '',
  value = '',
): SecretDataItem => ({
  id: createId(),
  keyName,
  value,
});

export const secretTypeOptions: { label: string; value: SecretType }[] = [
  {
    label: '默认',
    value: 'Opaque',
  },
  {
    label: 'TLS 信息',
    value: 'kubernetes.io/tls',
  },
  {
    label: '镜像服务信息',
    value: 'kubernetes.io/dockerconfigjson',
  },
  {
    label: '用户名和密码',
    value: 'kubernetes.io/basic-auth',
  },
];

export const registryProtocolOptions: {
  label: RegistryProtocol;
  value: RegistryProtocol;
}[] = [
  {
    label: 'https://',
    value: 'https://',
  },
  {
    label: 'http://',
    value: 'http://',
  },
];

export const getInitialCreateSecretValues = (
  namespace?: string,
): CreateSecretFormValues => ({
  name: undefined,
  namespace,
  type: 'Opaque',
  dataItems: [],
  tlsCertificate: undefined,
  tlsPrivateKey: undefined,
  registryProtocol: 'https://',
  registryAddress: undefined,
  registryUsername: undefined,
  registryPassword: undefined,
  registryEmail: undefined,
  skipTlsVerify: true,
  setAsDefault: false,
  basicAuthUsername: undefined,
  basicAuthPassword: undefined,
});

const normalizeText = (value?: string) => value?.trim() || '';

const toStringDataRecord = (items?: SecretDataItem[]) =>
  (items || []).reduce<Record<string, string>>((record, item) => {
    const keyName = normalizeText(item.keyName);
    if (keyName) {
      record[keyName] = item.value;
    }
    return record;
  }, {});

const encodeBase64 = (value: string) => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};

const normalizeRegistryServer = (
  protocol: RegistryProtocol,
  address?: string,
) => {
  const trimmedAddress = normalizeText(address);

  if (!trimmedAddress) {
    return '';
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedAddress)) {
    return trimmedAddress;
  }

  return `${protocol}${trimmedAddress}`;
};

const getDockerConfigJson = (values: CreateSecretFormValues) => {
  const server = normalizeRegistryServer(
    values.registryProtocol,
    values.registryAddress,
  );
  const username = normalizeText(values.registryUsername);
  const password = values.registryPassword || '';
  const email = normalizeText(values.registryEmail);

  return JSON.stringify({
    auths: {
      [server]: {
        username,
        password,
        ...(email ? { email } : {}),
        auth: encodeBase64(`${username}:${password}`),
      },
    },
  });
};

const getMetadataAnnotations = (values: CreateSecretFormValues) => {
  if (values.type !== 'kubernetes.io/dockerconfigjson') {
    return {};
  }

  const annotations: Record<string, string> = {};

  if (values.skipTlsVerify) {
    annotations['kubeflare.io/skip-tls-verify'] = 'true';
  }
  if (values.setAsDefault) {
    annotations['kubeflare.io/default-image-pull-secret'] = 'true';
  }

  return Object.keys(annotations).length > 0 ? { annotations } : {};
};

const getSecretStringData = (values: CreateSecretFormValues) => {
  if (values.type === 'kubernetes.io/tls') {
    return {
      'tls.crt': values.tlsCertificate || '',
      'tls.key': values.tlsPrivateKey || '',
    };
  }
  if (values.type === 'kubernetes.io/dockerconfigjson') {
    return {
      ...toStringDataRecord(values.dataItems),
      '.dockerconfigjson': getDockerConfigJson(values),
    };
  }
  if (values.type === 'kubernetes.io/basic-auth') {
    return {
      username: values.basicAuthUsername || '',
      password: values.basicAuthPassword || '',
    };
  }

  return toStringDataRecord(values.dataItems);
};

export const buildCreateSecretManifest = (
  values: CreateSecretFormValues,
): Record<string, unknown> => ({
  apiVersion: SECRET_API_VERSION,
  kind: SECRET_KIND,
  metadata: {
    name: normalizeText(values.name),
    namespace: normalizeText(values.namespace),
    ...getMetadataAnnotations(values),
  },
  type: values.type,
  stringData: getSecretStringData(values),
});

export const buildCreateSecretYaml = (values: CreateSecretFormValues) =>
  stringify(buildCreateSecretManifest(values), { indent: 2 });

export const getSecretStepFields = (
  step: number,
  type: SecretType,
): (keyof CreateSecretFormValues)[] => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (type === 'kubernetes.io/tls') {
    return ['type', 'tlsCertificate', 'tlsPrivateKey'];
  }
  if (type === 'kubernetes.io/dockerconfigjson') {
    return [
      'type',
      'registryProtocol',
      'registryAddress',
      'registryUsername',
      'registryPassword',
      'registryEmail',
      'skipTlsVerify',
      'setAsDefault',
      'dataItems',
    ];
  }
  if (type === 'kubernetes.io/basic-auth') {
    return ['type', 'basicAuthUsername', 'basicAuthPassword'];
  }

  return ['type', 'dataItems'];
};

export const hasSecretDataSettingsContent = (
  values: Partial<CreateSecretFormValues>,
) => {
  if (values.type === 'kubernetes.io/tls') {
    return Boolean(values.tlsCertificate && values.tlsPrivateKey);
  }
  if (values.type === 'kubernetes.io/dockerconfigjson') {
    return Boolean(
      values.registryAddress &&
        values.registryUsername &&
        values.registryPassword,
    );
  }
  if (values.type === 'kubernetes.io/basic-auth') {
    return Boolean(values.basicAuthUsername && values.basicAuthPassword);
  }

  return Boolean(values.dataItems?.some((item) => item.keyName.trim()));
};
