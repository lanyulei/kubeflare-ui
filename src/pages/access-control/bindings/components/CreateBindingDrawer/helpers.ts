import { stringify } from 'yaml';
import type {
  BindingSubjectFormValue,
  CreateBindingFormValues,
  CreateBindingType,
  MetadataItem,
} from './types';

const RBAC_API_VERSION = 'rbac.authorization.k8s.io/v1';
const RBAC_API_GROUP = 'rbac.authorization.k8s.io';
const BINDING_NAME_PATTERN =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

const normalizeText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const createMetadataItem = (): MetadataItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  keyName: '',
  value: '',
});

const createSubjectItem = (
  values?: Partial<BindingSubjectFormValue>,
): BindingSubjectFormValue => ({
  id: values?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  kind: values?.kind || 'ServiceAccount',
  name: values?.name || '',
  namespace: values?.namespace,
});

const metadataItemsToRecord = (items?: MetadataItem[]) => {
  const entries = (items || [])
    .map((item) => [item.keyName.trim(), item.value.trim()] as const)
    .filter(([key]) => key);

  return entries.length ? Object.fromEntries(entries) : undefined;
};

const normalizeSubject = (
  subject: BindingSubjectFormValue,
  bindingNamespace?: string,
) => {
  const kind = subject.kind || 'ServiceAccount';
  const namespace =
    kind === 'ServiceAccount'
      ? normalizeText(subject.namespace) || bindingNamespace
      : undefined;

  return {
    kind,
    name: normalizeText(subject.name),
    ...(namespace ? { namespace } : {}),
    ...(kind === 'ServiceAccount' ? {} : { apiGroup: RBAC_API_GROUP }),
  };
};

const buildCreateBindingManifest = (values: CreateBindingFormValues) => {
  const type = values.type || 'RoleBinding';
  const namespace =
    type === 'RoleBinding' ? normalizeText(values.namespace) : undefined;
  const labels = metadataItemsToRecord(values.labels);
  const annotations = metadataItemsToRecord(values.annotations);
  const roleKind =
    type === 'ClusterRoleBinding' ? 'ClusterRole' : values.roleKind || 'Role';

  return {
    apiVersion: RBAC_API_VERSION,
    kind: type,
    metadata: {
      name: normalizeText(values.name),
      ...(namespace ? { namespace } : {}),
      ...(labels ? { labels } : {}),
      ...(annotations ? { annotations } : {}),
    },
    subjects: (values.subjects || []).map((subject) =>
      normalizeSubject(subject, namespace),
    ),
    roleRef: {
      kind: roleKind,
      name: normalizeText(values.roleName),
      apiGroup: RBAC_API_GROUP,
    },
  };
};

const buildCreateBindingYaml = (values: CreateBindingFormValues) =>
  stringify(buildCreateBindingManifest(values), { indent: 2 });

const getInitialCreateBindingValues = (
  type: CreateBindingType = 'RoleBinding',
  namespace?: string,
): CreateBindingFormValues => ({
  type,
  name: '',
  namespace,
  roleKind: type === 'ClusterRoleBinding' ? 'ClusterRole' : 'Role',
  roleName: '',
  subjects: [createSubjectItem({ namespace })],
  labels: [],
  annotations: [],
});

const getCreateBindingStepFields = (
  step: number,
): (keyof CreateBindingFormValues)[] => {
  if (step === 0) {
    return ['type', 'name', 'namespace'];
  }
  if (step === 1) {
    return ['roleKind', 'roleName'];
  }
  if (step === 2) {
    return ['subjects'];
  }
  return ['labels', 'annotations'];
};

const hasMetadataContent = (items?: MetadataItem[]) =>
  (items || []).some((item) => item.keyName.trim());

const hasSubjectsContent = (values: CreateBindingFormValues) =>
  (values.subjects || []).some(
    (subject) => subject.kind && subject.name?.trim(),
  );

const hasAdvancedContent = (values: CreateBindingFormValues) =>
  hasMetadataContent(values.labels) || hasMetadataContent(values.annotations);

export {
  BINDING_NAME_PATTERN,
  buildCreateBindingManifest,
  buildCreateBindingYaml,
  createMetadataItem,
  createSubjectItem,
  getCreateBindingStepFields,
  getInitialCreateBindingValues,
  hasAdvancedContent,
  hasSubjectsContent,
  RBAC_API_GROUP,
  RBAC_API_VERSION,
};
