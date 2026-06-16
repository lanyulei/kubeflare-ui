import type { FormInstance } from 'antd';
import { Alert, Form } from 'antd';
import { createStyles } from 'antd-style';
import FormSection from './FormSection';
import NetworkPolicyRuleEditor from './NetworkPolicyRuleEditor';
import type {
  CreateNetworkPolicyFormValues,
  NetworkPolicyPolicyType,
} from './types';

type NetworkPolicyRuleDirection = 'egress' | 'ingress';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
}));

type NetworkPolicyRuleSettingsProps = {
  direction: NetworkPolicyRuleDirection;
  form: FormInstance<CreateNetworkPolicyFormValues>;
};

const getDirectionMeta = (direction: NetworkPolicyRuleDirection) =>
  direction === 'ingress'
    ? {
        disabledMessage:
          '策略类型未选择入站流量，创建时不会输出 ingress 规则。',
        fieldName: 'ingress' as const,
        policyType: 'Ingress' as NetworkPolicyPolicyType,
        title: '入站规则',
        tooltip:
          '对应 spec.ingress。未添加规则时会输出空数组，表示拒绝所有入站流量。',
      }
    : {
        disabledMessage: '策略类型未选择出站流量，创建时不会输出 egress 规则。',
        fieldName: 'egress' as const,
        policyType: 'Egress' as NetworkPolicyPolicyType,
        title: '出站规则',
        tooltip:
          '对应 spec.egress。未添加规则时会输出空数组，表示拒绝所有出站流量。',
      };

const NetworkPolicyRuleSettings = ({
  direction,
  form,
}: NetworkPolicyRuleSettingsProps) => {
  const { styles } = useStyles();
  const meta = getDirectionMeta(direction);
  const policyTypes =
    (Form.useWatch('policyTypes', {
      form,
      preserve: true,
    }) as NetworkPolicyPolicyType[]) || [];
  const enabled = policyTypes.includes(meta.policyType);

  return (
    <div className={styles.stack}>
      <FormSection bordered={false} title={meta.title} tooltip={meta.tooltip}>
        {enabled ? (
          <Form.Item name={meta.fieldName}>
            <NetworkPolicyRuleEditor direction={direction} />
          </Form.Item>
        ) : (
          <Alert message={meta.disabledMessage} showIcon type="info" />
        )}
      </FormSection>
    </div>
  );
};

export default NetworkPolicyRuleSettings;
