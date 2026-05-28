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

const decodeBase64 = (value?: string) => {
  if (!value) {
    return undefined;
  }

  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder().decode(bytes);
  } catch {
    return undefined;
  }
};

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getStringValue = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const isSecretType = (value?: string): value is SecretType =>
  secretTypeOptions.some((option) => option.value === value);

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

const getRegistryServerParts = (server?: string) => {
  const value = normalizeText(server);
  const matched = value.match(/^(https?:\/\/)(.+)$/i);

  if (!matched) {
    return {
      registryProtocol: 'https://' as RegistryProtocol,
      registryAddress: value,
    };
  }

  return {
    registryProtocol: matched[1].toLowerCase() as RegistryProtocol,
    registryAddress: matched[2],
  };
};

export const getDockerConfigJson = (values: CreateSecretFormValues) => {
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
  const annotations: Record<string, string> = {};

  if (
    values.type === 'kubernetes.io/dockerconfigjson' &&
    values.skipTlsVerify
  ) {
    annotations['kubeflare.io/skip-tls-verify'] = 'true';
  }
  if (values.type === 'kubernetes.io/dockerconfigjson' && values.setAsDefault) {
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

const getManifestAnnotations = (manifest?: Record<string, unknown>) =>
  getRecordValue(getRecordValue(manifest?.metadata)?.annotations) || {};

const getSecretPlainData = (manifest?: Record<string, unknown>) => {
  const data = getRecordValue(manifest?.data) || {};
  const stringData = getRecordValue(manifest?.stringData) || {};
  const decodedData = Object.entries(data).reduce<Record<string, string>>(
    (record, [key, value]) => {
      if (typeof value === 'string') {
        record[key] = decodeBase64(value) ?? value;
      }

      return record;
    },
    {},
  );

  return {
    ...decodedData,
    ...Object.entries(stringData).reduce<Record<string, string>>(
      (record, [key, value]) => {
        if (typeof value === 'string') {
          record[key] = value;
        }

        return record;
      },
      {},
    ),
  };
};

const getDockerConfigValues = (value?: string) => {
  if (!value) {
    return undefined;
  }

  try {
    const config = getRecordValue(JSON.parse(value));
    const auths = getRecordValue(config?.auths);
    const firstAuth = Object.entries(auths || {})[0];

    if (!firstAuth) {
      return undefined;
    }

    const [server, authValue] = firstAuth;
    const auth = getRecordValue(authValue);
    const authPair = decodeBase64(getStringValue(auth?.auth));
    const separatorIndex = authPair?.indexOf(':') ?? -1;

    return {
      ...getRegistryServerParts(server),
      registryUsername:
        getStringValue(auth?.username) ||
        (separatorIndex >= 0 ? authPair?.slice(0, separatorIndex) : undefined),
      registryPassword:
        getStringValue(auth?.password) ||
        (separatorIndex >= 0 ? authPair?.slice(separatorIndex + 1) : undefined),
      registryEmail: getStringValue(auth?.email),
    };
  } catch {
    return undefined;
  }
};

export const getSecretFormValuesFromManifest = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
): CreateSecretFormValues => {
  const metadata = getRecordValue(manifest?.metadata);
  const annotations = getManifestAnnotations(manifest);
  const data = getSecretPlainData(manifest);
  const manifestType = getStringValue(manifest?.type);
  const type = isSecretType(manifestType) ? manifestType : 'Opaque';
  const dockerConfigValues =
    type === 'kubernetes.io/dockerconfigjson'
      ? getDockerConfigValues(data['.dockerconfigjson'])
      : undefined;

  return {
    ...getInitialCreateSecretValues(
      getStringValue(metadata?.namespace) || fallbackNamespace,
    ),
    name: getStringValue(metadata?.name),
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace,
    type,
    dataItems: Object.entries(data)
      .filter(([key]) => key && key !== '.dockerconfigjson')
      .map(([keyName, value]) => createSecretDataItem(keyName, value)),
    tlsCertificate: data['tls.crt'],
    tlsPrivateKey: data['tls.key'],
    registryProtocol: dockerConfigValues?.registryProtocol || 'https://',
    registryAddress: dockerConfigValues?.registryAddress,
    registryUsername: dockerConfigValues?.registryUsername,
    registryPassword: dockerConfigValues?.registryPassword,
    registryEmail: dockerConfigValues?.registryEmail,
    skipTlsVerify:
      annotations['kubeflare.io/skip-tls-verify'] === undefined
        ? true
        : annotations['kubeflare.io/skip-tls-verify'] === 'true',
    setAsDefault:
      annotations['kubeflare.io/default-image-pull-secret'] === 'true',
    basicAuthUsername: data.username,
    basicAuthPassword: data.password,
  };
};

export const buildUpdatedSecretSettingsManifest = (
  manifest: Record<string, unknown>,
  values: CreateSecretFormValues,
): Record<string, unknown> => {
  const metadata: Record<string, unknown> = {
    ...(getRecordValue(manifest.metadata) || {}),
  };
  const annotations = {
    ...getManifestAnnotations(manifest),
  };
  const imagePullSecretAnnotations = getMetadataAnnotations(values).annotations;

  delete annotations['kubeflare.io/skip-tls-verify'];
  delete annotations['kubeflare.io/default-image-pull-secret'];

  const nextAnnotations = {
    ...annotations,
    ...(imagePullSecretAnnotations || {}),
  };

  if (Object.keys(nextAnnotations).length > 0) {
    metadata.annotations = nextAnnotations;
  } else {
    delete metadata.annotations;
  }

  const nextManifest: Record<string, unknown> = {
    ...manifest,
    metadata,
    type: values.type,
    stringData: getSecretStringData(values),
  };

  delete nextManifest.data;

  return nextManifest;
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

export const validateSecretDataItems = (items?: SecretDataItem[]) => {
  const normalizedKeys = (items || [])
    .map((item) => normalizeText(item.keyName))
    .filter(Boolean);

  if (normalizedKeys.length === 0) {
    return '请添加至少一条数据';
  }
  if (new Set(normalizedKeys).size !== normalizedKeys.length) {
    return '数据键不能重复';
  }

  return undefined;
};

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
