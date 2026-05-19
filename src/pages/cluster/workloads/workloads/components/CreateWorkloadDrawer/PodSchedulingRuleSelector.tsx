import {
  DeleteOutlined,
  DownOutlined,
  QuestionCircleOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, message, Select, Tooltip } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { getClusterWorkloadList } from '@/services/kubeflare/cluster/workload';
import type { WorkloadSchedulingCustomRule } from './types';

type PodSchedulingRuleType = 'default' | 'spread' | 'centralized' | 'custom';

type PodSchedulingRuleSelectorProps = {
  label?: string;
  name?: NamePath;
};

type DeploymentOption = {
  label: ReactNode;
  searchText: string;
  value: string;
  name: string;
  namespace?: string;
  selector?: Record<string, string>;
};

const createEmptyCustomRule = () => ({
  type: undefined,
  strategy: undefined,
  target: undefined,
  targetName: undefined,
  targetLabels: undefined,
});

const useStyles = createStyles(({ token }) => ({
  schedulingRules: {
    marginTop: `16px`,
  },
  schedulingLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  schedulingHelpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: `14px`,
  },
  ruleSelect: {
    position: 'relative',
    overflow: 'visible',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  ruleOptions: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    left: 0,
    zIndex: 10,
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    boxShadow: token.boxShadowSecondary,
  },
  ruleOption: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'minmax(0, 1fr) 24px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `12px 16px`,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',

    '& + &': {
      borderTop: `1px solid ${token.colorBorderSecondary}`,
    },

    '&:hover': {
      background: token.colorFillQuaternary,
    },
  },
  ruleTitle: {
    display: 'block',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  ruleDescription: {
    display: 'block',
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  ruleArrow: {
    justifySelf: 'end',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  },
  customRule: {
    marginTop: token.marginSM,
    padding: `15px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  customRuleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    marginBottom: `10px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  customRuleRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(160px, 1fr) minmax(160px, 1fr) minmax(160px, 1fr) 32px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `6px 10px 6px 18px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 999,
    background: token.colorFillQuaternary,

    '& + &': {
      marginTop: token.marginSM,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      borderRadius: token.borderRadiusSM,
      padding: token.paddingSM,
    },
  },
  customRuleActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: token.marginSM,
  },
  deleteButton: {
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  targetNamespace: {
    color: token.colorTextTertiary,
  },
}));

const schedulingRuleOptions: {
  title: string;
  value: PodSchedulingRuleType;
  description: string;
}[] = [
  {
    title: '默认规则',
    value: 'default',
    description: '按照默认的规则将容器组副本调度到节点。',
  },
  {
    title: '分散调度',
    value: 'spread',
    description: '尽可能将容器组副本调度到不同的节点上。',
  },
  {
    title: '集中调度',
    value: 'centralized',
    description: '尽可能将容器组副本调度到同一节点上。',
  },
  {
    title: '自定义规则',
    value: 'custom',
    description: '按照自定义的规则将容器组副本调度到节点。',
  },
];

const customTypeOptions = [
  {
    label: '与目标调度到一起',
    value: 'affinity',
  },
  {
    label: '远离目标调度',
    value: 'antiAffinity',
  },
];

const customStrategyOptions = [
  {
    label: '尽可能匹配',
    value: 'preferred',
  },
  {
    label: '必须匹配',
    value: 'required',
  },
];

const PodSchedulingRuleSelector = ({
  label = '容器组调度规则',
  name = 'podSchedulingRule',
}: PodSchedulingRuleSelectorProps) => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();
  const [open, setOpen] = useState(false);
  const [deploymentOptions, setDeploymentOptions] = useState<
    DeploymentOption[]
  >([]);
  const [deploymentLoading, setDeploymentLoading] = useState(false);
  const schedulingRule =
    (Form.useWatch(name, form) as PodSchedulingRuleType) || 'default';
  const namespace = Form.useWatch('namespace', form);
  const workloadName = Form.useWatch('name', form);
  const customRules = (Form.useWatch('podSchedulingCustomRules', form) ||
    []) as WorkloadSchedulingCustomRule[];
  const customRuleAddDisabled =
    customRules.length === 0 ||
    customRules.some((rule) => !(rule?.type && rule?.strategy && rule?.target));
  const selectedRule =
    schedulingRuleOptions.find((option) => option.value === schedulingRule) ||
    schedulingRuleOptions[0];
  const targetOptions = useMemo(
    () =>
      deploymentOptions.filter(
        (option) =>
          option.name !== workloadName?.trim() ||
          option.namespace !== namespace,
      ),
    [deploymentOptions, namespace, workloadName],
  );

  useEffect(() => {
    if (schedulingRule !== 'custom') {
      setDeploymentOptions([]);
      return;
    }

    let ignore = false;

    const loadDeployments = async () => {
      setDeploymentLoading(true);
      try {
        const res = await getClusterWorkloadList({
          type: 'Deployment',
        });
        if (ignore) {
          return;
        }
        setDeploymentOptions(
          (res.data.items || []).map((item) => {
            const itemNamespace = item.namespace || '-';

            return {
              label: (
                <span>
                  {item.name}{' '}
                  <span className={styles.targetNamespace}>
                    ({itemNamespace})
                  </span>
                </span>
              ),
              searchText: `${item.name} ${itemNamespace}`,
              value: `${itemNamespace}/${item.name}`,
              name: item.name,
              namespace: item.namespace,
              selector: item.selector,
            };
          }),
        );
      } catch {
        if (!ignore) {
          message.error('获取 Deployment 列表失败');
          setDeploymentOptions([]);
        }
      } finally {
        if (!ignore) {
          setDeploymentLoading(false);
        }
      }
    };

    loadDeployments();

    return () => {
      ignore = true;
    };
  }, [schedulingRule]);

  useEffect(() => {
    if (schedulingRule === 'custom' && customRules.length === 0) {
      form.setFieldValue('podSchedulingCustomRules', [createEmptyCustomRule()]);
    }
  }, [customRules.length, form, schedulingRule]);

  const selectRule = (value: PodSchedulingRuleType) => {
    form.setFieldValue(name, value);
    if (value === 'custom') {
      form.setFieldValue('podSchedulingCustomRules', [createEmptyCustomRule()]);
    }
    if (value !== 'custom') {
      form.setFieldsValue({
        podSchedulingCustomType: undefined,
        podSchedulingCustomStrategy: undefined,
        podSchedulingCustomTarget: undefined,
        podSchedulingCustomTargetName: undefined,
        podSchedulingCustomTargetLabels: undefined,
        podSchedulingCustomRules: [],
      });
    }
    setOpen(false);
  };

  const clearCustomRule = (index: number) => {
    form.setFieldValue(
      ['podSchedulingCustomRules', index],
      createEmptyCustomRule(),
    );
  };

  const selectTargetDeployment = (targetValue: string, index: number) => {
    const target = deploymentOptions.find(
      (option) => option.value === targetValue,
    );
    form.setFieldValue(
      ['podSchedulingCustomRules', index, 'targetName'],
      target?.name,
    );
    form.setFieldValue(
      ['podSchedulingCustomRules', index, 'targetLabels'],
      target?.selector,
    );
  };

  const renderRuleOption = (
    option: (typeof schedulingRuleOptions)[number],
    showArrow: boolean,
  ) => (
    <button
      className={styles.ruleOption}
      key={option.value}
      type="button"
      onClick={() =>
        showArrow
          ? setOpen((currentOpen) => !currentOpen)
          : selectRule(option.value)
      }
    >
      <span>
        <span className={styles.ruleTitle}>{option.title}</span>
        <span className={styles.ruleDescription}>{option.description}</span>
      </span>
      {showArrow && (
        <span className={styles.ruleArrow}>
          {open ? <UpOutlined /> : <DownOutlined />}
        </span>
      )}
    </button>
  );

  return (
    <div className={styles.schedulingRules}>
      <div className={styles.schedulingLabel}>
        <span>{label}</span>
        <Tooltip title="设置容器组副本调度到节点的规则">
          <QuestionCircleOutlined className={styles.schedulingHelpIcon} />
        </Tooltip>
      </div>
      <Form.Item name={name} hidden>
        <Input />
      </Form.Item>
      <div className={styles.ruleSelect}>
        {renderRuleOption(selectedRule, true)}
        {open && (
          <div className={styles.ruleOptions}>
            {schedulingRuleOptions
              .filter((option) => option.value !== selectedRule.value)
              .map((option) => renderRuleOption(option, false))}
          </div>
        )}
      </div>
      {schedulingRule === 'custom' && (
        <div className={styles.customRule}>
          <div className={styles.customRuleLabel}>自定义规则</div>
          <Form.List name="podSchedulingCustomRules">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <div className={styles.customRuleRow} key={field.key}>
                    <Form.Item
                      name={[field.name, 'type']}
                      rules={[{ required: true, message: '请选择类型' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        options={customTypeOptions}
                        optionFilterProp="label"
                        placeholder="请选择类型"
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'strategy']}
                      rules={[{ required: true, message: '请选择策略' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        options={customStrategyOptions}
                        optionFilterProp="label"
                        placeholder="请选择策略"
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'target']}
                      rules={[{ required: true, message: '请选择目标' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        optionFilterProp="searchText"
                        options={targetOptions}
                        placeholder="请选择目标"
                        loading={deploymentLoading}
                        notFoundContent="暂无目标"
                        onChange={(targetValue) =>
                          selectTargetDeployment(targetValue, field.name)
                        }
                      />
                    </Form.Item>
                    <Button
                      aria-label="清空自定义调度规则"
                      className={styles.deleteButton}
                      icon={<DeleteOutlined />}
                      type="text"
                      onClick={() =>
                        fields.length > 1
                          ? remove(field.name)
                          : clearCustomRule(field.name)
                      }
                    />
                  </div>
                ))}
                <div className={styles.customRuleActions}>
                  <Button
                    disabled={customRuleAddDisabled}
                    onClick={() => add(createEmptyCustomRule())}
                  >
                    添加
                  </Button>
                </div>
              </>
            )}
          </Form.List>
        </div>
      )}
    </div>
  );
};

export type { PodSchedulingRuleSelectorProps, PodSchedulingRuleType };
export default PodSchedulingRuleSelector;
