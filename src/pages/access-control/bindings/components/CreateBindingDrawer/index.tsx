import {
  AppstoreOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SlidersOutlined,
  TeamOutlined,
  UpOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Steps,
  Switch,
} from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { KeyValueEditor, YamlEditor } from '@/components';
import {
  getRbacRoleList,
  getRbacSubjectList,
} from '@/services/kubeflare/cluster/rbac';
import { getClusterServiceAccountList } from '@/services/kubeflare/cluster/resource';
import { getUserList } from '@/services/kubeflare/system/users';
import {
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
} from './helpers';
import type {
  BindingSubjectFormValue,
  CreateBindingFormValues,
  CreateBindingType,
  MetadataItem,
} from './types';

const useStyles = createStyles(({ token }) => ({
  drawer: {
    '.ant-drawer-header': {
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
    },
    '.ant-drawer-body': {
      padding: 0,
      background: token.colorBgLayout,
    },
    '.ant-drawer-footer': {
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      background: token.colorBgContainer,
    },
  },
  headerExtra: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
  },
  yamlSwitch: {
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    borderRadius: 999,
    background: token.colorFillSecondary,
  },
  steps: {
    padding: '15px 20px',
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,

    '.ant-steps-item-icon': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    '.ant-steps-item-title': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeightSM,
    },

    '.ant-steps-item-description': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  body: {
    height: 'calc(100vh - 205px)',
    overflow: 'auto',
    padding: token.paddingLG,
    background: token.colorBgContainer,

    '.ant-form-item-extra': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  yamlBody: {
    height: 'calc(100vh - 131px)',
    padding: token.paddingLG,
    background: token.colorBgContainer,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  footerActions: {
    display: 'flex',
    gap: token.marginSM,
  },
  section: {
    marginBottom: token.marginLG,
  },
  sectionTitle: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  subjectStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  subjectRow: {
    display: 'grid',
    gridTemplateColumns: '150px minmax(0, 1.2fr) minmax(0, 1.4fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,

    '.ant-select-selector, .ant-input': {
      backgroundColor: token.colorBgContainer,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  subjectTypeField: {
    minWidth: 0,
  },
  subjectNameField: {
    minWidth: 0,

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
      gridRow: 3,
    },
  },
  subjectNamespaceField: {
    minWidth: 0,

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
      gridRow: 2,
    },
  },
  subjectDeleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  subjectFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  advancedStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  advancedSectionTitle: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  advancedOption: {
    padding: '12px 16px',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  advancedOptionHeaderButton: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
    width: '100%',
    padding: 0,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
  },
  advancedHeaderIcon: {
    color: '#36435C',
    fontSize: token.fontSizeSM,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advancedTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  advancedDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  advancedMetadataBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
    marginTop: 14,
    borderRadius: token.borderRadiusSM,
  },
  advancedFieldLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type CreateBindingDrawerProps = {
  defaultNamespace?: string;
  defaultType?: CreateBindingType;
  loading?: boolean;
  namespaceOptions: { label: string; value: string }[];
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    type: API.ClusterResourceCreateType;
    namespace?: string;
    manifest: Record<string, unknown>;
  }) => Promise<void>;
};

const BINDING_TYPE_OPTIONS: { label: string; value: CreateBindingType }[] = [
  { label: 'RoleBinding', value: 'RoleBinding' },
  { label: 'ClusterRoleBinding', value: 'ClusterRoleBinding' },
];

const SUBJECT_KIND_OPTIONS: { label: string; value: API.RbacSubjectKind }[] = [
  { label: 'ServiceAccount', value: 'ServiceAccount' },
  { label: 'User', value: 'User' },
  { label: 'Group', value: 'Group' },
];

const ROLE_KIND_OPTIONS: {
  label: string;
  value: CreateBindingFormValues['roleKind'];
}[] = [
  { label: 'Role', value: 'Role' },
  { label: 'ClusterRole', value: 'ClusterRole' },
];

type SelectOption = {
  label: string;
  value: string;
};

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getArrayValue = (value: unknown) => (Array.isArray(value) ? value : []);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateBindingFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (
    index === 0 &&
    values.name &&
    (values.type === 'ClusterRoleBinding' || values.namespace)
  ) {
    return '已设置';
  }
  if (index === 1 && values.roleKind && values.roleName) {
    return '已设置';
  }
  if (index === 2 && hasSubjectsContent(values)) {
    return '已设置';
  }
  if (index === 3 && hasAdvancedContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const validateSubjects = (values: CreateBindingFormValues) => {
  const subjects = values.subjects || [];

  if (!subjects.length) {
    message.warning('请至少添加一个授权主体');
    return false;
  }

  for (const [index, subject] of subjects.entries()) {
    if (!subject.kind) {
      message.warning(`授权主体 ${index + 1} 需要选择类型`);
      return false;
    }
    if (!subject.name?.trim()) {
      message.warning(`授权主体 ${index + 1} 需要填写名称`);
      return false;
    }
    if (subject.kind === 'ServiceAccount' && !subject.namespace?.trim()) {
      message.warning(`授权主体 ${index + 1} 需要选择命名空间`);
      return false;
    }
  }

  return true;
};

const validateYamlManifest = (resource: Record<string, unknown>) => {
  const metadata = getRecordValue(resource.metadata);
  const roleRef = getRecordValue(resource.roleRef);
  const subjects = getArrayValue(resource.subjects);
  const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';
  const namespace =
    typeof metadata?.namespace === 'string' ? metadata.namespace.trim() : '';
  const kind = typeof resource.kind === 'string' ? resource.kind : '';
  const apiVersion =
    typeof resource.apiVersion === 'string' ? resource.apiVersion : '';
  const roleKind = typeof roleRef?.kind === 'string' ? roleRef.kind : '';
  const roleName = typeof roleRef?.name === 'string' ? roleRef.name.trim() : '';

  if (kind !== 'RoleBinding' && kind !== 'ClusterRoleBinding') {
    message.error('YAML kind 必须为 RoleBinding 或 ClusterRoleBinding');
    return false;
  }
  if (apiVersion !== RBAC_API_VERSION) {
    message.error(`YAML apiVersion 必须为 ${RBAC_API_VERSION}`);
    return false;
  }
  if (!name) {
    message.error('YAML 必须包含 metadata.name');
    return false;
  }
  if (kind === 'RoleBinding' && !namespace) {
    message.error('RoleBinding YAML 必须包含 metadata.namespace');
    return false;
  }
  if (kind === 'ClusterRoleBinding' && namespace) {
    message.error('ClusterRoleBinding YAML 不应包含 metadata.namespace');
    return false;
  }
  if (!roleRef || !roleName) {
    message.error(
      'YAML 必须包含 roleRef.kind、roleRef.name 和 roleRef.apiGroup',
    );
    return false;
  }
  if (roleRef.apiGroup !== RBAC_API_GROUP) {
    message.error(`YAML roleRef.apiGroup 必须为 ${RBAC_API_GROUP}`);
    return false;
  }
  if (
    (kind === 'RoleBinding' &&
      roleKind !== 'Role' &&
      roleKind !== 'ClusterRole') ||
    (kind === 'ClusterRoleBinding' && roleKind !== 'ClusterRole')
  ) {
    message.error(
      kind === 'ClusterRoleBinding'
        ? 'ClusterRoleBinding 只能引用 ClusterRole'
        : 'RoleBinding 只能引用 Role 或 ClusterRole',
    );
    return false;
  }
  if (!subjects.length) {
    message.error('YAML 必须至少包含一个 subjects 项');
    return false;
  }

  const invalidSubjectIndex = subjects.findIndex((subject) => {
    const subjectRecord = getRecordValue(subject);
    return (
      !subjectRecord ||
      !['ServiceAccount', 'User', 'Group'].includes(
        String(subjectRecord.kind || ''),
      ) ||
      typeof subjectRecord.name !== 'string' ||
      !subjectRecord.name.trim() ||
      (subjectRecord.kind === 'ServiceAccount' &&
        (typeof subjectRecord.namespace !== 'string' ||
          !subjectRecord.namespace.trim()))
    );
  });

  if (invalidSubjectIndex >= 0) {
    message.error(
      `YAML subjects[${invalidSubjectIndex}] 需要包含 kind 和 name，ServiceAccount 还需要 namespace`,
    );
    return false;
  }

  return true;
};

const CreateBindingDrawer = ({
  defaultNamespace,
  defaultType = 'RoleBinding',
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateBindingDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<CreateBindingFormValues>();
  const [current, setCurrent] = useState(0);
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const [roleOptions, setRoleOptions] = useState<API.RbacRoleItem[]>([]);
  const [serviceAccountOptions, setServiceAccountOptions] = useState<
    Record<string, SelectOption[]>
  >({});
  const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
  const [groupOptions, setGroupOptions] = useState<SelectOption[]>([]);
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const labels = (Form.useWatch('labels', form) as MetadataItem[]) || [];
  const annotations =
    (Form.useWatch('annotations', form) as MetadataItem[]) || [];
  const subjects =
    (Form.useWatch('subjects', {
      form,
      preserve: true,
    }) as BindingSubjectFormValue[]) || [];
  const bindingType =
    Form.useWatch('type', { form, preserve: true }) || defaultType;
  const bindingNamespace =
    Form.useWatch('namespace', { form, preserve: true }) || defaultNamespace;
  const roleKind =
    Form.useWatch('roleKind', { form, preserve: true }) || 'Role';
  const roleName = Form.useWatch('roleName', { form, preserve: true });
  const steps = useMemo(
    () => [
      { title: '基本信息', icon: <AppstoreOutlined /> },
      { title: '引用角色', icon: <SafetyCertificateOutlined /> },
      { title: '授权主体', icon: <TeamOutlined /> },
      { title: '高级设置', icon: <SlidersOutlined /> },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialCreateBindingValues(
      defaultType,
      defaultNamespace,
    );
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setMetadataOpen(true);
    setYamlMode(false);
    setYamlValue(buildCreateBindingYaml(initialValues));
    setServiceAccountOptions({});
    getUserList({ skipErrorHandler: true })
      .then((res) => {
        setUserOptions(
          (res.data.items || []).map((item) => ({
            label: item.nickname
              ? `${item.nickname}（${item.username}）`
              : item.username,
            value: item.username,
          })),
        );
      })
      .catch(() => setUserOptions([]));
    getRbacSubjectList({ kind: 'Group' }, { skipErrorHandler: true })
      .then((res) => {
        const groupNames = Array.from(
          new Set(
            (res.data.items || []).map((item) => item.name).filter(Boolean),
          ),
        );
        setGroupOptions(
          groupNames.map((name) => ({
            label: name,
            value: name,
          })),
        );
      })
      .catch(() => setGroupOptions([]));
  }, [defaultNamespace, defaultType, form, open]);

  useEffect(() => {
    if (!metadataOpen) {
      return;
    }

    if (labels.length === 0) {
      form.setFieldValue('labels', [createMetadataItem()]);
    }
    if (annotations.length === 0) {
      form.setFieldValue('annotations', [createMetadataItem()]);
    }
  }, [annotations.length, form, labels.length, metadataOpen]);

  useEffect(() => {
    if (bindingType === 'ClusterRoleBinding') {
      form.setFieldValue('namespace', undefined);
      form.setFieldValue('roleKind', 'ClusterRole');
      form.setFieldValue('roleName', undefined);
    }
  }, [bindingType, form]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const namespaces = Array.from(
      new Set(
        subjects
          .filter((subject) => subject.kind === 'ServiceAccount')
          .map((subject) => subject.namespace)
          .filter(Boolean) as string[],
      ),
    ).filter((namespace) => !serviceAccountOptions[namespace]);

    if (!namespaces.length) {
      return;
    }

    let active = true;
    namespaces.forEach((namespace) => {
      getClusterServiceAccountList({ namespace }, { skipErrorHandler: true })
        .then((res) => {
          if (!active) {
            return;
          }

          setServiceAccountOptions((options) => ({
            ...options,
            [namespace]: (res.data.items || []).map((item) => ({
              label: item.name,
              value: item.name,
            })),
          }));
        })
        .catch(() => {
          if (!active) {
            return;
          }

          setServiceAccountOptions((options) => ({
            ...options,
            [namespace]: [],
          }));
        });
    });

    return () => {
      active = false;
    };
  }, [open, serviceAccountOptions, subjects]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const queryRoleKind =
      bindingType === 'ClusterRoleBinding' ? 'ClusterRole' : roleKind;

    if (queryRoleKind === 'Role' && !bindingNamespace) {
      setRoleOptions([]);
      return;
    }

    let active = true;
    getRbacRoleList({
      type: queryRoleKind,
      namespace: queryRoleKind === 'Role' ? bindingNamespace : undefined,
    })
      .then((res) => {
        if (active) {
          setRoleOptions(res.data.items || []);
        }
      })
      .catch(() => {
        if (active) {
          setRoleOptions([]);
        }
      });

    return () => {
      active = false;
    };
  }, [bindingNamespace, bindingType, open, roleKind]);

  const filteredRoleOptions = useMemo(
    () =>
      roleOptions
        .filter((role) => {
          if (bindingType === 'ClusterRoleBinding') {
            return role.type === 'ClusterRole';
          }
          if (roleKind === 'ClusterRole') {
            return role.type === 'ClusterRole';
          }
          return role.type === 'Role' && role.namespace === bindingNamespace;
        })
        .map((role) => ({
          label:
            role.type === 'ClusterRole'
              ? role.name
              : `${role.namespace || '-'} / ${role.name}`,
          value: role.name,
        })),
    [bindingNamespace, bindingType, roleKind, roleOptions],
  );

  useEffect(() => {
    if (
      roleName &&
      !filteredRoleOptions.some((option) => option.value === roleName)
    ) {
      form.setFieldValue('roleName', undefined);
    }
  }, [filteredRoleOptions, form, roleName]);

  const syncSubjectNamespaces = (namespace?: string) => {
    const subjects = form.getFieldValue('subjects') || [];
    form.setFieldValue(
      'subjects',
      subjects.map((subject: { kind?: API.RbacSubjectKind }) =>
        subject.kind === 'ServiceAccount' ? { ...subject, namespace } : subject,
      ),
    );
  };

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateBindingYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    await form.validateFields(getCreateBindingStepFields(current));
    const formValues = form.getFieldsValue(true);

    if (current === 2) {
      return validateSubjects(formValues);
    }

    return true;
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();

    if (!valid) {
      return;
    }

    setCurrent((step) => Math.min(step + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    if (yamlMode) {
      let manifest: unknown;
      try {
        manifest = parse(yamlValue);
      } catch {
        message.error('YAML 格式不正确，请检查后重试');
        return;
      }

      if (
        !manifest ||
        typeof manifest !== 'object' ||
        Array.isArray(manifest)
      ) {
        message.error('YAML 内容必须是有效的资源对象');
        return;
      }

      const resource = manifest as Record<string, unknown>;
      if (!validateYamlManifest(resource)) {
        return;
      }
      const metadata = getRecordValue(resource.metadata);
      const type = resource.kind as API.ClusterResourceCreateType;
      const namespace =
        type === 'RoleBinding' && typeof metadata?.namespace === 'string'
          ? metadata.namespace.trim()
          : undefined;

      await onSubmit({ type, namespace, manifest: resource });
      return;
    }

    await form.validateFields([
      ...getCreateBindingStepFields(0),
      ...getCreateBindingStepFields(1),
      ...getCreateBindingStepFields(2),
      ...getCreateBindingStepFields(3),
    ]);
    const formValues = form.getFieldsValue(true);

    if (!validateSubjects(formValues)) {
      return;
    }

    await onSubmit({
      type: formValues.type || 'RoleBinding',
      namespace:
        formValues.type === 'RoleBinding'
          ? formValues.namespace?.trim()
          : undefined,
      manifest: buildCreateBindingManifest(formValues),
    });
  };

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          tooltip="名称只能包含小写字母、数字、连字符（-）和点（.）"
          label="名称"
          name="name"
          rules={[
            { required: true, message: '请输入名称' },
            { max: 253, message: '名称最长 253 个字符' },
            {
              pattern: BINDING_NAME_PATTERN,
              message:
                '名称只能包含小写字母、数字、连字符（-）和点（.），且不能以连字符或点开头结尾',
            },
          ]}
        >
          <Input autoFocus placeholder="请输入名称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="命名空间"
          name="namespace"
          rules={[
            {
              required: bindingType === 'RoleBinding',
              message: '请选择命名空间',
            },
          ]}
        >
          <Select
            disabled={bindingType === 'ClusterRoleBinding'}
            options={namespaceOptions}
            optionFilterProp="label"
            onChange={(namespace) => {
              if (form.getFieldValue('roleKind') === 'Role') {
                form.setFieldValue('roleName', undefined);
              }
              syncSubjectNamespaces(namespace);
            }}
            placeholder={
              bindingType === 'ClusterRoleBinding'
                ? 'ClusterRoleBinding 不需要命名空间'
                : '请选择命名空间'
            }
            showSearch
          />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item
          label="类型"
          name="type"
          rules={[{ required: true, message: '请选择类型' }]}
        >
          <Select options={BINDING_TYPE_OPTIONS} />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderRoleRefSettings = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label="引用角色类型"
          name="roleKind"
          rules={[{ required: true, message: '请选择引用角色类型' }]}
          extra={
            bindingType === 'ClusterRoleBinding'
              ? 'ClusterRoleBinding 只能绑定 ClusterRole'
              : 'RoleBinding 可绑定同命名空间 Role 或全集群 ClusterRole'
          }
        >
          <Select
            disabled={bindingType === 'ClusterRoleBinding'}
            options={
              bindingType === 'ClusterRoleBinding'
                ? ROLE_KIND_OPTIONS.filter(
                    (option) => option.value === 'ClusterRole',
                  )
                : ROLE_KIND_OPTIONS
            }
            onChange={() => form.setFieldValue('roleName', undefined)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="引用角色"
          name="roleName"
          rules={[{ required: true, message: '请选择引用角色' }]}
        >
          <Select
            allowClear
            showSearch
            notFoundContent={
              roleKind === 'Role' && !bindingNamespace
                ? '请先选择命名空间'
                : '暂无可选角色'
            }
            optionFilterProp="label"
            options={filteredRoleOptions}
            placeholder={
              roleKind === 'Role'
                ? '请选择同命名空间 Role'
                : '请选择 ClusterRole'
            }
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderSubjectNameField = (fieldName: number) => (
    <Form.Item shouldUpdate noStyle>
      {({ getFieldValue }) => {
        const kind = getFieldValue(['subjects', fieldName, 'kind']);
        const namespace = getFieldValue(['subjects', fieldName, 'namespace']);
        const options =
          kind === 'ServiceAccount'
            ? namespace
              ? serviceAccountOptions[namespace] || []
              : []
            : kind === 'User'
              ? userOptions
              : kind === 'Group'
                ? groupOptions
                : [];

        return (
          <Form.Item
            getValueProps={(value?: string) => ({ value: value || undefined })}
            name={[fieldName, 'name']}
            noStyle
            rules={[
              { required: true, message: '请选择主体名称' },
              { max: 253, message: '主体名称最长 253 个字符' },
            ]}
          >
            <Select
              allowClear
              showSearch
              className={styles.subjectNameField}
              notFoundContent={
                kind === 'ServiceAccount' && !namespace
                  ? '请先选择命名空间'
                  : '暂无可选主体'
              }
              optionFilterProp="label"
              options={options}
              placeholder="请选择授权主体"
            />
          </Form.Item>
        );
      }}
    </Form.Item>
  );

  const renderSubjectNamespaceField = (fieldName: number) => (
    <Form.Item shouldUpdate noStyle>
      {({ getFieldValue }) => {
        const kind = getFieldValue(['subjects', fieldName, 'kind']);
        return (
          <Form.Item
            name={[fieldName, 'namespace']}
            noStyle
            rules={[
              {
                required: kind === 'ServiceAccount',
                message: '请选择命名空间',
              },
            ]}
          >
            <Select
              className={styles.subjectNamespaceField}
              disabled={kind !== 'ServiceAccount'}
              onChange={() =>
                form.setFieldValue(['subjects', fieldName, 'name'], undefined)
              }
              options={namespaceOptions}
              optionFilterProp="label"
              placeholder={
                kind === 'ServiceAccount'
                  ? '请选择命名空间'
                  : 'User/Group 不需要命名空间'
              }
              showSearch
            />
          </Form.Item>
        );
      }}
    </Form.Item>
  );

  const renderSubjectSettings = () => (
    <>
      <div className={styles.sectionTitle}>授权主体</div>
      <Form.List name="subjects">
        {(fields, { add, remove }) => (
          <>
            <div className={styles.subjectStack}>
              {fields.map((field) => (
                <div className={styles.subjectRow} key={field.key}>
                  <Form.Item
                    name={[field.name, 'kind']}
                    noStyle
                    rules={[{ required: true, message: '请选择类型' }]}
                  >
                    <Select
                      className={styles.subjectTypeField}
                      options={SUBJECT_KIND_OPTIONS}
                      placeholder="主体类型"
                      onChange={(kind) => {
                        form.setFieldValue(
                          ['subjects', field.name, 'name'],
                          undefined,
                        );
                        if (kind === 'ServiceAccount') {
                          form.setFieldValue(
                            ['subjects', field.name, 'namespace'],
                            bindingNamespace,
                          );
                        } else {
                          form.setFieldValue(
                            ['subjects', field.name, 'namespace'],
                            undefined,
                          );
                        }
                      }}
                    />
                  </Form.Item>
                  {renderSubjectNamespaceField(field.name)}
                  {renderSubjectNameField(field.name)}
                  <Button
                    aria-label="删除授权主体"
                    className={styles.subjectDeleteButton}
                    icon={<DeleteOutlined />}
                    type="text"
                    onClick={() => {
                      if (fields.length <= 1) {
                        form.setFieldValue(
                          ['subjects', field.name],
                          createSubjectItem({ namespace: bindingNamespace }),
                        );
                        return;
                      }
                      remove(field.name);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className={styles.subjectFooter}>
              <Button
                onClick={() =>
                  add(createSubjectItem({ namespace: bindingNamespace }))
                }
              >
                <PlusOutlined />
                添加授权主体
              </Button>
            </div>
          </>
        )}
      </Form.List>
    </>
  );

  const renderAdvancedSettings = () => (
    <div className={styles.advancedStack}>
      <div>
        <div className={styles.advancedSectionTitle}>元数据</div>
        <div className={styles.advancedOption}>
          <button
            className={styles.advancedOptionHeaderButton}
            type="button"
            onClick={() => setMetadataOpen((nextOpen) => !nextOpen)}
          >
            <span className={styles.advancedHeaderIcon}>
              {metadataOpen ? <UpOutlined /> : <DownOutlined />}
            </span>
            <span>
              <div className={styles.advancedTitle}>添加元数据</div>
              <div className={styles.advancedDescription}>
                为绑定资源添加标签和注解，便于筛选、识别和自动化管理
              </div>
            </span>
          </button>
          {metadataOpen && (
            <div className={styles.advancedMetadataBody}>
              <div>
                <div className={styles.advancedFieldLabel}>标签</div>
                <Form.Item name="labels">
                  <KeyValueEditor
                    addIcon={false}
                    addText="添加"
                    deleteAriaLabel="删除标签"
                    keyPlaceholder="标签键"
                    minRows={1}
                    valuePlaceholder="标签值"
                    onAddBlocked={() =>
                      message.warning('请先填写已有标签的键。')
                    }
                    onCreateItem={createMetadataItem}
                  />
                </Form.Item>
              </div>
              <div>
                <div className={styles.advancedFieldLabel}>注解</div>
                <Form.Item name="annotations">
                  <KeyValueEditor
                    addIcon={false}
                    addText="添加"
                    deleteAriaLabel="删除注解"
                    keyPlaceholder="注解键"
                    minRows={1}
                    valuePlaceholder="注解值"
                    onAddBlocked={() =>
                      message.warning('请先填写已有注解的键。')
                    }
                    onCreateItem={createMetadataItem}
                  />
                </Form.Item>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const stepContent = [
    renderBasicInfo,
    renderRoleRefSettings,
    renderSubjectSettings,
    renderAdvancedSettings,
  ][current];

  return (
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      extra={
        <div className={styles.headerExtra}>
          <Space className={styles.yamlSwitch}>
            <span>编辑 YAML</span>
            <Switch checked={yamlMode} onChange={handleYamlModeChange} />
          </Space>
        </div>
      }
      footer={
        <div className={styles.footer}>
          <span />
          <div className={styles.footerActions}>
            <Button onClick={onCancel}>取消</Button>
            {!yamlMode && current > 0 && (
              <Button onClick={() => setCurrent((step) => step - 1)}>
                上一步
              </Button>
            )}
            {!yamlMode && current < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button loading={loading} type="primary" onClick={handleSubmit}>
                创建
              </Button>
            )}
          </div>
        </div>
      }
      keyboard={false}
      maskClosable={false}
      open={open}
      title={`创建 ${bindingType}`}
      width="78vw"
      onClose={onCancel}
    >
      {yamlMode ? (
        <div className={styles.yamlBody}>
          <YamlEditor
            height="calc(100vh - 179px)"
            value={yamlValue}
            onChange={setYamlValue}
          />
        </div>
      ) : (
        <>
          <Steps
            className={styles.steps}
            current={current}
            items={steps.map((step, index) => ({
              ...step,
              disabled: index > current + 1,
              description: getStepStatusText(current, index, values),
            }))}
            onChange={async (nextStep) => {
              if (nextStep <= current) {
                setCurrent(nextStep);
                return;
              }
              if (nextStep > current + 1) {
                return;
              }
              const valid = await validateCurrentStep();
              if (valid) {
                setCurrent(nextStep);
              }
            }}
          />
          <div className={styles.body}>
            <Form
              form={form}
              layout="vertical"
              requiredMark
              onValuesChange={() => {
                if (!yamlMode) {
                  setYamlValue(
                    buildCreateBindingYaml(form.getFieldsValue(true)),
                  );
                }
              }}
            >
              <div className={styles.section}>{stepContent()}</div>
            </Form>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default CreateBindingDrawer;
