import type { FormInstance } from 'antd';
import { Col, Form, Input, InputNumber, Row, Select, Slider } from 'antd';
import { createStyles } from 'antd-style';
import type { CreatePersistentVolumeFormValues } from './types';

const useStyles = createStyles(({ token }) => ({
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  capacityFormItem: {
    marginBottom: 0,
  },
  capacityRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 122px',
    alignItems: 'center',
    gap: token.marginLG,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: token.marginSM,
    },
  },
  capacitySlider: {
    marginInline: 6,
  },
  capacityInput: {
    width: '100%',
  },
}));

type PersistentVolumeStorageSettingsProps = {
  form: FormInstance<CreatePersistentVolumeFormValues>;
};

const accessModeOptions = [
  { label: 'ReadWriteOnce', value: 'ReadWriteOnce' },
  { label: 'ReadOnlyMany', value: 'ReadOnlyMany' },
  { label: 'ReadWriteMany', value: 'ReadWriteMany' },
  { label: 'ReadWriteOncePod', value: 'ReadWriteOncePod' },
];

const reclaimPolicyOptions = [
  { label: 'Retain', value: 'Retain' },
  { label: 'Delete', value: 'Delete' },
  { label: 'Recycle（不推荐）', value: 'Recycle' },
];

const volumeModeOptions = [
  { label: 'Filesystem', value: 'Filesystem' },
  { label: 'Block', value: 'Block' },
];

const PersistentVolumeStorageSettings = ({
  form,
}: PersistentVolumeStorageSettingsProps) => {
  const { styles } = useStyles();
  const capacityGi = Form.useWatch('capacityGi', {
    form,
    preserve: true,
  });

  return (
    <div className={styles.settings}>
      <Form.Item
        className={styles.capacityFormItem}
        extra="定义持久卷对外声明的存储容量。"
        label="容量"
        required
      >
        <div className={styles.capacityRow}>
          <Slider
            className={styles.capacitySlider}
            marks={{
              0: '0',
              512: '512Gi',
              1024: '1024Gi',
              1536: '1536Gi',
              2048: '2048Gi',
            }}
            max={2048}
            min={0}
            value={capacityGi ?? 10}
            onChange={(value) =>
              form.setFieldValue('capacityGi', Math.max(value, 1))
            }
          />
          <Form.Item
            name="capacityGi"
            noStyle
            rules={[{ required: true, message: '请输入容量' }]}
          >
            <InputNumber
              className={styles.capacityInput}
              controls={false}
              max={2048}
              min={1}
              placeholder="请输入容量"
              suffix="Gi"
            />
          </Form.Item>
        </div>
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            extra="选择一个或多个访问模式，需与后端卷能力保持一致。"
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
            extra="删除 PVC 后，持久卷应如何处理。"
            label="回收策略"
            name="persistentVolumeReclaimPolicy"
            rules={[{ required: true, message: '请选择回收策略' }]}
          >
            <Select
              options={reclaimPolicyOptions}
              placeholder="请选择回收策略"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="卷模式"
            name="volumeMode"
            rules={[{ required: true, message: '请选择卷模式' }]}
          >
            <Select options={volumeModeOptions} placeholder="请选择卷模式" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            extra="留空表示不指定存储类。"
            label="存储类"
            name="storageClassName"
          >
            <Input placeholder="请输入存储类名称" />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default PersistentVolumeStorageSettings;
