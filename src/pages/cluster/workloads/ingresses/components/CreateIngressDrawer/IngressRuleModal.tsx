import type { FormInstance } from 'antd';
import {
  AutoComplete,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
} from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
import { INGRESS_PATH_TYPE_OPTIONS, INGRESS_PROTOCOL_OPTIONS } from './helpers';
import type { IngressRouteRuleItem } from './types';

const useStyles = createStyles(({ token }) => ({
  modal: {
    '.ant-modal-body': {
      paddingTop: token.paddingMD,
    },
  },
  field: {
    marginBottom: token.marginMD,
  },
}));

type IngressRuleModalProps = {
  form: FormInstance<IngressRouteRuleItem>;
  open: boolean;
  serviceOptions: { label: string; value: string }[];
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
      width={680}
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form form={form} layout="vertical" requiredMark>
        <Row gutter={16}>
          <Col span={12}>
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
          </Col>
          <Col span={12}>
            <Form.Item
              className={styles.field}
              label="协议"
              name="protocol"
              rules={[{ required: true, message: '请选择协议' }]}
            >
              <Select options={INGRESS_PROTOCOL_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              className={styles.field}
              label="路径"
              name="path"
              rules={[
                { required: true, message: '请输入路径' },
                {
                  validator: async (_, value?: string) => {
                    if (!value || value.startsWith('/')) {
                      return;
                    }
                    throw new Error('路径必须以 / 开头');
                  },
                },
              ]}
            >
              <Input placeholder="/api" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              className={styles.field}
              label="路径类型"
              name="pathType"
              rules={[{ required: true, message: '请选择路径类型' }]}
            >
              <Select options={INGRESS_PATH_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              className={styles.field}
              label="服务"
              name="serviceName"
              rules={[{ required: true, message: '请选择或输入服务名称' }]}
            >
              <AutoComplete
                allowClear
                filterOption={(inputValue, option) =>
                  String(option?.value || '')
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
                options={serviceOptions}
                placeholder="请选择或输入服务名称"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              className={styles.field}
              label="服务端口"
              name="servicePort"
              rules={[
                { required: true, message: '请输入服务端口' },
                {
                  type: 'number',
                  min: 1,
                  max: 65535,
                  message: '端口范围为 1 到 65535',
                },
              ]}
            >
              <InputNumber
                min={1}
                max={65535}
                precision={0}
                placeholder="443"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default IngressRuleModal;
