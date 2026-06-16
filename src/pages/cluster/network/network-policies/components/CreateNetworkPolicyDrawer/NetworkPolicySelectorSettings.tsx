import { Checkbox, Form } from 'antd';
import { createStyles } from 'antd-style';
import FormSection from './FormSection';
import LabelSelectorEditor from './LabelSelectorEditor';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  policyTypes: {
    '.ant-checkbox-wrapper': {
      minHeight: 32,
      alignItems: 'center',
    },
  },
}));

const POLICY_TYPE_OPTIONS = [
  {
    label: '入站流量',
    value: 'Ingress',
  },
  {
    label: '出站流量',
    value: 'Egress',
  },
];

const NetworkPolicySelectorSettings = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.stack}>
      <FormSection
        description="为空时会匹配当前命名空间内的所有 Pod。"
        title="Pod 选择器"
        tooltip="对应 spec.podSelector，可使用 matchLabels 与 matchExpressions。"
      >
        <Form.Item name="podSelector">
          <LabelSelectorEditor />
        </Form.Item>
      </FormSection>

      <FormSection
        description="选择网络策略生效的流量方向。未选择的方向不会输出对应规则。"
        title="策略类型"
        tooltip="对应 spec.policyTypes。"
      >
        <Form.Item
          className={styles.policyTypes}
          name="policyTypes"
          rules={[
            {
              validator: async (_, value) => {
                if (!value?.length) {
                  throw new Error('请至少选择一种策略类型');
                }
              },
            },
          ]}
        >
          <Checkbox.Group options={POLICY_TYPE_OPTIONS} />
        </Form.Item>
      </FormSection>
    </div>
  );
};

export default NetworkPolicySelectorSettings;
