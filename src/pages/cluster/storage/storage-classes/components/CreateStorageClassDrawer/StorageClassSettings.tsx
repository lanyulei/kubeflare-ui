import { Col, Form, Input, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import StorageClassParameterEditor from './StorageClassParameterEditor';

const useStyles = createStyles(({ token }) => ({
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',

    '& > .ant-form-item': {
      marginBottom: 0,
    },
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  parameterField: {
    width: '100%',
  },
}));

const booleanOptions = [
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
];

const reclaimPolicyOptions = [
  { label: 'Delete', value: 'Delete' },
  { label: 'Retain', value: 'Retain' },
];

const volumeBindingModeOptions = [
  { label: '立即绑定', value: 'Immediate' },
  { label: '延迟绑定', value: 'WaitForFirstConsumer' },
];

const accessModeOptions = [
  { label: 'ReadWriteOnce', value: 'ReadWriteOnce' },
  { label: 'ReadOnlyMany', value: 'ReadOnlyMany' },
  { label: 'ReadWriteMany', value: 'ReadWriteMany' },
];

const StorageClassSettings = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.settings}>
      <div className={styles.fieldGroup}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              extra="选择存储类是否允许创建后扩展卷容量。"
              label="卷扩展"
              name="allowVolumeExpansion"
              rules={[{ required: true, message: '请选择是否允许卷扩展' }]}
            >
              <Select options={booleanOptions} placeholder="请选择" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="回收机制"
              name="reclaimPolicy"
              rules={[{ required: true, message: '请选择回收机制' }]}
            >
              <Select
                options={reclaimPolicyOptions}
                placeholder="请选择回收机制"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              extra="选择存储类支持的一种或多种访问模式。"
              label="访问模式"
              name="accessModes"
              rules={[{ required: true, message: '请选择访问模式' }]}
            >
              <Select
                mode="multiple"
                options={accessModeOptions}
                placeholder="请选择访问模式"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="供应者"
              name="provisioner"
              rules={[{ required: true, message: '请输入供应者' }]}
            >
              <Input placeholder="请输入供应者" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="卷绑定模式"
              name="volumeBindingMode"
              rules={[{ required: true, message: '请选择卷绑定模式' }]}
            >
              <Select
                options={volumeBindingModeOptions}
                placeholder="请选择卷绑定模式"
              />
            </Form.Item>
          </Col>
        </Row>
      </div>
      <Form.Item
        className={styles.parameterField}
        label="参数"
        name="parameters"
      >
        <StorageClassParameterEditor />
      </Form.Item>
    </div>
  );
};

export default StorageClassSettings;
