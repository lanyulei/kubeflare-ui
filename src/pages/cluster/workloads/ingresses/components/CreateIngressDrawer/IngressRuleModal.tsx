import type { FormInstance } from 'antd';
import { Form, Input, Modal, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
import { INGRESS_PROTOCOL_OPTIONS } from './helpers';
import RouteMetadataEditor from './RouteMetadataEditor';
import RoutePathEditor from './RoutePathEditor';
import type { IngressRouteRuleItem, IngressServiceOption } from './types';

const useStyles = createStyles(({ token }) => ({
  modal: {
    '.ant-modal-body': {
      paddingTop: token.paddingMD,
    },
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  field: {
    width: 'min(456px, 100%)',
    marginBottom: token.marginMD,
  },
  pathLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  requiredMark: {
    marginInlineStart: token.marginXXS,
    color: token.colorError,
  },
}));

type IngressRuleModalProps = {
  form: FormInstance<IngressRouteRuleItem>;
  open: boolean;
  serviceOptions: IngressServiceOption[];
  title: string;
  onCancel: () => void;
  onOk: () => void;
};

const IngressRuleModal = ({
  form,
  open,
  serviceOptions,
  title,
  onCancel,
  onOk,
}: IngressRuleModalProps) => {
  const { styles } = useStyles();

  useEffect(() => {
    if (!open) {
      return;
    }
    window.setTimeout(() => {
      form.getFieldInstance('host')?.focus?.();
    });
  }, [form, open]);

  return (
    <Modal
      className={styles.modal}
      destroyOnHidden
      maskClosable={false}
      open={open}
      title={title}
      width={960}
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form className={styles.form} form={form} layout="vertical" requiredMark>
        <div>
          <Form.Item
            className={styles.field}
            label="域名"
            name="host"
            rules={[
              { required: true, message: '请输入域名' },
              { max: 253, message: '域名最长 253 个字符' },
            ]}
          >
            <Input placeholder="example.com" />
          </Form.Item>
          <Form.Item
            className={styles.field}
            label="协议"
            name="protocol"
            rules={[{ required: true, message: '请选择协议' }]}
          >
            <Select options={INGRESS_PROTOCOL_OPTIONS} />
          </Form.Item>
          <div className={styles.pathLabel}>
            路径
            <span className={styles.requiredMark}>*</span>
          </div>
          <RoutePathEditor form={form} serviceOptions={serviceOptions} />
        </div>

        <RouteMetadataEditor form={form} />
      </Form>
    </Modal>
  );
};

export default IngressRuleModal;
