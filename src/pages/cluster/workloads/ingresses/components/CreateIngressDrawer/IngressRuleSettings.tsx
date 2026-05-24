import {
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Checkbox, Form, Input, message, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { createIngressRuleItem, isValidIngressRule } from './helpers';
import IngressRuleModal from './IngressRuleModal';
import type { CreateIngressFormValues, IngressRouteRuleItem } from './types';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  card: {
    padding: `${token.paddingMD}px ${token.paddingLG}px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  cardHeader: {
    display: 'grid',
    gridTemplateColumns: '40px minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: token.marginMD,
  },
  icon: {
    color: token.colorTextTertiary,
    fontSize: 32,
  },
  title: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  protocol: {
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
  },
  actionButton: {
    color: token.colorTextTertiary,
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 160px',
    gap: token.marginMD,
    marginTop: token.marginMD,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: token.marginXS,
    },
  },
  summaryItem: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  add: {
    display: 'flex',
    width: '100%',
    minHeight: 64,
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingMD}px ${token.paddingLG}px`,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    cursor: 'pointer',
    textAlign: 'left',

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },
  },
  addText: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginXXS,
  },
  addTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  addDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  rewrite: {
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  rewriteHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
  },
  rewriteTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  rewriteDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  rewriteBody: {
    marginTop: token.marginMD,
    padding: token.paddingSM,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
  },
  rewriteInput: {
    width: 'min(420px, 100%)',
  },
}));

type IngressRuleSettingsProps = {
  form: FormInstance<CreateIngressFormValues>;
  serviceOptions: { label: string; value: string }[];
};

const IngressRuleSettings = ({
  form,
  serviceOptions,
}: IngressRuleSettingsProps) => {
  const { styles } = useStyles();
  const [ruleForm] = Form.useForm<IngressRouteRuleItem>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | undefined>();
  const rules = (Form.useWatch('rules', form) as IngressRouteRuleItem[]) || [];
  const enablePathRewrite = Form.useWatch('enablePathRewrite', form);
  const validRules = useMemo(() => rules.filter(isValidIngressRule), [rules]);

  useEffect(() => {
    if (!enablePathRewrite) {
      return;
    }
    if (!form.getFieldValue('rewriteTarget')) {
      form.setFieldValue('rewriteTarget', '/');
    }
  }, [enablePathRewrite, form]);

  const openModal = (index?: number) => {
    setEditingIndex(index);
    ruleForm.resetFields();
    ruleForm.setFieldsValue(
      index === undefined ? createIngressRuleItem() : rules[index],
    );
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    const values = await ruleForm.validateFields();
    const nextRule = createIngressRuleItem({
      ...values,
      id:
        editingIndex === undefined
          ? values.id
          : rules[editingIndex]?.id || values.id,
    });
    const nextRules =
      editingIndex === undefined
        ? [...rules, nextRule]
        : rules.map((item, index) =>
            index === editingIndex ? nextRule : item,
          );

    form.setFieldValue('rules', nextRules);
    setModalOpen(false);
  };

  const deleteRule = (index: number) => {
    form.setFieldValue(
      'rules',
      rules.filter((_, ruleIndex) => ruleIndex !== index),
    );
  };

  return (
    <div className={styles.stack}>
      <Form.Item
        name="rules"
        required
        rules={[
          {
            validator: async (_, value?: IngressRouteRuleItem[]) => {
              if ((value || []).some(isValidIngressRule)) {
                return;
              }
              throw new Error('请添加至少一个路由规则');
            },
          },
        ]}
      >
        <div className={styles.list}>
          {validRules.map((rule, index) => (
            <div className={styles.card} key={rule.id}>
              <div className={styles.cardHeader}>
                <GlobalOutlined className={styles.icon} />
                <div>
                  <div className={styles.title}>{rule.host}</div>
                  <div className={styles.protocol}>协议： {rule.protocol}</div>
                </div>
                <div className={styles.actions}>
                  <Tooltip title="删除路由规则">
                    <Button
                      aria-label="删除路由规则"
                      className={styles.actionButton}
                      icon={<DeleteOutlined />}
                      type="text"
                      onClick={() => deleteRule(index)}
                    />
                  </Tooltip>
                  <Tooltip title="编辑路由规则">
                    <Button
                      aria-label="编辑路由规则"
                      className={styles.actionButton}
                      icon={<EditOutlined />}
                      type="text"
                      onClick={() => openModal(index)}
                    />
                  </Tooltip>
                </div>
              </div>
              <div className={styles.summary}>
                <span className={styles.summaryItem}>
                  路径： {rule.path || '-'}
                </span>
                <span className={styles.summaryItem}>
                  服务： {rule.serviceName || '-'}
                </span>
                <span className={styles.summaryItem}>
                  端口： {rule.servicePort || '-'}
                </span>
              </div>
            </div>
          ))}
          <button
            className={styles.add}
            type="button"
            onClick={() => openModal()}
          >
            <PlusOutlined />
            <span className={styles.addText}>
              <span className={styles.addTitle}>添加路由规则</span>
              <span className={styles.addDescription}>
                添加一个路由规则将域名路径映射至服务。
              </span>
            </span>
          </button>
        </div>
      </Form.Item>

      <div className={styles.rewrite}>
        <div className={styles.rewriteHeader}>
          <Form.Item name="enablePathRewrite" valuePropName="checked">
            <Checkbox aria-label="路径重写" />
          </Form.Item>
          <span>
            <div className={styles.rewriteTitle}>路径重写</div>
            <div className={styles.rewriteDescription}>
              通过正则表达式去配置应用在当前路由规则的重写路径
            </div>
          </span>
        </div>
        {enablePathRewrite && (
          <div className={styles.rewriteBody}>
            <Form.Item
              label="重写目标"
              name="rewriteTarget"
              rules={[{ required: true, message: '请输入重写目标' }]}
            >
              <Input className={styles.rewriteInput} placeholder="/" />
            </Form.Item>
          </div>
        )}
      </div>

      <IngressRuleModal
        form={ruleForm}
        open={modalOpen}
        serviceOptions={serviceOptions}
        title={editingIndex === undefined ? '添加路由规则' : '编辑路由规则'}
        onCancel={() => setModalOpen(false)}
        onOk={() => {
          handleModalOk().catch(() => {
            message.warning('请完善路由规则配置');
          });
        }}
      />
    </div>
  );
};

export default IngressRuleSettings;
