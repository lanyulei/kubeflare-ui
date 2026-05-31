import {
  AppstoreOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  SafetyCertificateOutlined,
  SlidersOutlined,
  UpOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
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
import PolicyRuleEditor from '../../../components/PolicyRuleEditor';
import {
  buildCreateRoleManifest,
  buildCreateRoleYaml,
  createMetadataItem,
  getCreateRoleStepFields,
  getInitialCreateRoleValues,
  hasAdvancedContent,
  hasRulesContent,
  normalizeStringList,
  RBAC_API_VERSION,
  ROLE_NAME_PATTERN,
} from './helpers';
import type {
  CreateRoleFormValues,
  CreateRoleType,
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
  ruleSectionTitle: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
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
  advancedOptionHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
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
  advancedCheckbox: {
    marginTop: 2,
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
  advancedBody: {
    marginTop: 14,
    borderRadius: token.borderRadiusSM,
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
  aggregationExpressions: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  expressionRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 150px minmax(0, 1.4fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,
  },
  expressionFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
}));

type CreateRoleDrawerProps = {
  defaultNamespace?: string;
  defaultType?: CreateRoleType;
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

const ROLE_TYPE_OPTIONS: { label: string; value: CreateRoleType }[] = [
  { label: 'Role', value: 'Role' },
  { label: 'ClusterRole', value: 'ClusterRole' },
];

const SELECTOR_OPERATOR_OPTIONS = [
  { label: 'In', value: 'In' },
  { label: 'NotIn', value: 'NotIn' },
  { label: 'Exists', value: 'Exists' },
  { label: 'DoesNotExist', value: 'DoesNotExist' },
];

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getArrayValue = (value: unknown) => (Array.isArray(value) ? value : []);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateRoleFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (
    index === 0 &&
    values.name &&
    (values.type === 'ClusterRole' || values.namespace)
  ) {
    return '已设置';
  }
  if (index === 1 && hasRulesContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasAdvancedContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const validatePolicyRules = (values: CreateRoleFormValues) => {
  const rules = values.rules || [];

  if (!rules.length) {
    message.warning('请至少添加一条权限规则');
    return false;
  }

  for (const [index, rule] of rules.entries()) {
    const verbs = normalizeStringList(rule.verbs);
    const resources = normalizeStringList(rule.resources);
    const nonResourceURLs = normalizeStringList(rule.nonResourceURLs);

    if (!verbs.length) {
      message.warning(`权限规则 ${index + 1} 需要选择动作`);
      return false;
    }
    if (rule.mode === 'nonResource') {
      if (values.type !== 'ClusterRole') {
        message.warning('非资源 URL 权限仅适用于 ClusterRole');
        return false;
      }
      if (!nonResourceURLs.length) {
        message.warning(`权限规则 ${index + 1} 需要填写非资源 URL`);
        return false;
      }
      continue;
    }
    if (!resources.length) {
      message.warning(`权限规则 ${index + 1} 需要选择资源`);
      return false;
    }
  }

  return true;
};

const validateAggregation = (values: CreateRoleFormValues) => {
  if (values.type !== 'ClusterRole' || !values.aggregationEnabled) {
    return true;
  }

  const hasLabels = (values.aggregationLabels || []).some((item) =>
    item.keyName.trim(),
  );
  const hasExpressions = (values.aggregationExpressions || []).some((item) =>
    item.key?.trim(),
  );

  if (!hasLabels && !hasExpressions) {
    message.warning('请为聚合规则至少配置一个标签选择器');
    return false;
  }

  const invalidExpressionIndex = (
    values.aggregationExpressions || []
  ).findIndex((item) => {
    if (!item.key?.trim()) {
      return false;
    }
    if (!item.operator) {
      return true;
    }
    return (
      (item.operator === 'In' || item.operator === 'NotIn') &&
      !normalizeStringList(item.values).length
    );
  });

  if (invalidExpressionIndex >= 0) {
    message.warning(
      `聚合匹配表达式 ${invalidExpressionIndex + 1} 需要选择操作符，In/NotIn 需要填写标签值`,
    );
    return false;
  }

  return true;
};

const validateYamlManifest = (resource: Record<string, unknown>) => {
  const metadata = getRecordValue(resource.metadata);
  const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';
  const namespace =
    typeof metadata?.namespace === 'string' ? metadata.namespace.trim() : '';
  const kind = typeof resource.kind === 'string' ? resource.kind : '';
  const apiVersion =
    typeof resource.apiVersion === 'string' ? resource.apiVersion : '';
  const rules = getArrayValue(resource.rules);

  if (kind !== 'Role' && kind !== 'ClusterRole') {
    message.error('YAML kind 必须为 Role 或 ClusterRole');
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
  if (kind === 'Role' && !namespace) {
    message.error('Role YAML 必须包含 metadata.namespace');
    return false;
  }
  if (!rules.length) {
    message.error('YAML 必须至少包含一条 rules');
    return false;
  }

  const invalidRuleIndex = rules.findIndex((rule) => {
    const ruleRecord = getRecordValue(rule);
    if (!ruleRecord || !Array.isArray(ruleRecord.verbs)) {
      return true;
    }
    const resources = Array.isArray(ruleRecord.resources)
      ? ruleRecord.resources
      : [];
    const nonResourceURLs = Array.isArray(ruleRecord.nonResourceURLs)
      ? ruleRecord.nonResourceURLs
      : [];
    return (
      !ruleRecord.verbs.length ||
      (resources.length > 0 && nonResourceURLs.length > 0) ||
      (resources.length === 0 && nonResourceURLs.length === 0) ||
      (kind === 'Role' && nonResourceURLs.length > 0)
    );
  });

  if (invalidRuleIndex >= 0) {
    message.error(
      `YAML rules[${invalidRuleIndex}] 需要包含 verbs，且 resources 与 nonResourceURLs 不能同时或同时不配置`,
    );
    return false;
  }

  return true;
};

const CreateRoleDrawer = ({
  defaultNamespace,
  defaultType = 'Role',
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateRoleDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<CreateRoleFormValues>();
  const [current, setCurrent] = useState(0);
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const labels = (Form.useWatch('labels', form) as MetadataItem[]) || [];
  const annotations =
    (Form.useWatch('annotations', form) as MetadataItem[]) || [];
  const aggregationLabels =
    (Form.useWatch('aggregationLabels', form) as MetadataItem[]) || [];
  const roleType = Form.useWatch('type', form) || defaultType;
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '权限规则',
        icon: <SafetyCertificateOutlined />,
      },
      {
        title: '高级设置',
        icon: <SlidersOutlined />,
      },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialCreateRoleValues(
      defaultType,
      defaultNamespace,
    );
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setMetadataOpen(true);
    setYamlMode(false);
    setYamlValue(buildCreateRoleYaml(initialValues));
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
    if (
      roleType === 'ClusterRole' &&
      values.aggregationEnabled &&
      aggregationLabels.length === 0
    ) {
      form.setFieldValue('aggregationLabels', [createMetadataItem()]);
    }
  }, [aggregationLabels.length, form, roleType, values.aggregationEnabled]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateRoleYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    await form.validateFields(getCreateRoleStepFields(current));
    const formValues = form.getFieldsValue(true);

    if (current === 1) {
      return validatePolicyRules(formValues);
    }
    if (current === 2) {
      return validateAggregation(formValues);
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
        type === 'Role' && typeof metadata?.namespace === 'string'
          ? metadata.namespace.trim()
          : undefined;

      await onSubmit({ type, namespace, manifest: resource });
      return;
    }

    await form.validateFields([
      ...getCreateRoleStepFields(0),
      ...getCreateRoleStepFields(1),
      ...getCreateRoleStepFields(2),
    ]);
    const formValues = form.getFieldsValue(true);

    if (!validatePolicyRules(formValues) || !validateAggregation(formValues)) {
      return;
    }

    await onSubmit({
      type: formValues.type || 'Role',
      namespace:
        formValues.type === 'Role' ? formValues.namespace?.trim() : undefined,
      manifest: buildCreateRoleManifest(formValues),
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
              pattern: ROLE_NAME_PATTERN,
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
              required: roleType === 'Role',
              message: '请选择命名空间',
            },
          ]}
        >
          <Select
            disabled={roleType === 'ClusterRole'}
            options={namespaceOptions}
            optionFilterProp="label"
            placeholder={
              roleType === 'ClusterRole'
                ? 'ClusterRole 不需要命名空间'
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
          <Select
            options={ROLE_TYPE_OPTIONS}
            onChange={(nextType) => {
              if (nextType === 'ClusterRole') {
                form.setFieldValue('namespace', undefined);
              }
            }}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderRuleSettings = () => (
    <>
      <div className={styles.ruleSectionTitle}>权限规则</div>
      <PolicyRuleEditor clusterScoped={roleType === 'ClusterRole'} />
    </>
  );

  const renderAggregationExpressions = () => (
    <Form.List name="aggregationExpressions">
      {(fields, { add, remove }) => (
        <>
          <div className={styles.aggregationExpressions}>
            {fields.map((field) => (
              <div className={styles.expressionRow} key={field.key}>
                <Form.Item name={[field.name, 'key']} noStyle>
                  <Input placeholder="标签键" />
                </Form.Item>
                <Form.Item name={[field.name, 'operator']} noStyle>
                  <Select
                    options={SELECTOR_OPERATOR_OPTIONS}
                    placeholder="操作符"
                  />
                </Form.Item>
                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) => {
                    const operator = getFieldValue([
                      'aggregationExpressions',
                      field.name,
                      'operator',
                    ]);
                    return (
                      <Form.Item name={[field.name, 'values']} noStyle>
                        <Select
                          disabled={
                            operator === 'Exists' || operator === 'DoesNotExist'
                          }
                          mode="tags"
                          placeholder="标签值"
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>
                <Button
                  aria-label="删除匹配表达式"
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() => remove(field.name)}
                />
              </div>
            ))}
          </div>
          <div className={styles.expressionFooter}>
            <Button
              onClick={() =>
                add({
                  key: '',
                  operator: 'In',
                  values: [],
                })
              }
            >
              添加匹配表达式
            </Button>
          </div>
        </>
      )}
    </Form.List>
  );

  const renderAdvancedSettings = () => (
    <div className={styles.advancedStack}>
      {roleType === 'ClusterRole' && (
        <div>
          <div className={styles.advancedSectionTitle}>聚合规则</div>
          <div className={styles.advancedOption}>
            <div className={styles.advancedOptionHeader}>
              <Form.Item
                className={styles.advancedCheckbox}
                name="aggregationEnabled"
                valuePropName="checked"
              >
                <Checkbox aria-label="聚合 ClusterRole" />
              </Form.Item>
              <span>
                <div className={styles.advancedTitle}>聚合 ClusterRole</div>
                <div className={styles.advancedDescription}>
                  按标签选择器聚合其他 ClusterRole
                  的权限规则，适合组合多个细粒度角色
                </div>
              </span>
            </div>
            {values.aggregationEnabled && (
              <div className={styles.advancedMetadataBody}>
                <div>
                  <div className={styles.advancedFieldLabel}>
                    聚合标签选择器
                  </div>
                  <Form.Item name="aggregationLabels">
                    <KeyValueEditor
                      addIcon={false}
                      addText="添加"
                      deleteAriaLabel="删除匹配标签"
                      keyPlaceholder="标签键"
                      valuePlaceholder="标签值"
                      onAddBlocked={() =>
                        message.warning('请先填写已有匹配标签的键。')
                      }
                      onCreateItem={createMetadataItem}
                    />
                  </Form.Item>
                </div>
                <div>
                  <div className={styles.advancedFieldLabel}>
                    聚合匹配表达式
                  </div>
                  <Form.Item>{renderAggregationExpressions()}</Form.Item>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                为角色资源添加标签和注解，便于筛选、识别和自动化管理
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
    renderRuleSettings,
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
      title={`创建 ${roleType}`}
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
                  setYamlValue(buildCreateRoleYaml(form.getFieldsValue(true)));
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

export default CreateRoleDrawer;
