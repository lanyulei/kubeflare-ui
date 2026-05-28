import {
  CloudServerOutlined,
  DatabaseOutlined,
  HddOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Form, Input, InputNumber, Select, Slider, Spin } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type {
  CreatePersistentVolumeClaimFormValues,
  PersistentVolumeClaimCreateMode,
} from './types';

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
  compactField: {
    maxWidth: 456,

    '.ant-form-item': {
      marginBottom: token.marginMD,
    },

    '.ant-form-item:last-child': {
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
  createModeSelect: {
    width: '100%',

    '.ant-select-selector': {
      minHeight: 66,
      alignItems: 'center',
    },
  },
  modeOption: {
    display: 'grid',
    gridTemplateColumns: '34px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginMD,
    width: '100%',
  },
  modeIcon: {
    display: 'inline-flex',
    width: 30,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#38475f',
    fontSize: 28,
  },
  modeTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  modeDescription: {
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
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

type CreateModeOption = {
  description: string;
  icon: ReactNode;
  label: string;
  value: PersistentVolumeClaimCreateMode;
};

type PersistentVolumeClaimStorageSettingsProps = {
  form: FormInstance<CreatePersistentVolumeClaimFormValues>;
  loading?: boolean;
  storageClasses: API.ClusterStorageClassItem[];
};

const accessModeOptions = [
  { label: 'ReadWriteOnce', value: 'ReadWriteOnce' },
  { label: 'ReadOnlyMany', value: 'ReadOnlyMany' },
  { label: 'ReadWriteMany', value: 'ReadWriteMany' },
];

const createModeOptions: CreateModeOption[] = [
  {
    description: '选择已有的存储类来创建卷。',
    icon: <DatabaseOutlined />,
    label: '通过存储类创建',
    value: 'storageClass',
  },
  {
    description: '选择已有的持久卷来创建卷。',
    icon: <CloudServerOutlined />,
    label: '绑定已有持久卷创建',
    value: 'persistentVolume',
  },
  {
    description: '选择已有 NAS 卷创建卷。',
    icon: <HddOutlined />,
    label: '绑定已有 NAS 卷创建',
    value: 'nas',
  },
];

const ModeOption = ({ description, icon, label }: CreateModeOption) => {
  const { styles } = useStyles();

  return (
    <div className={styles.modeOption}>
      <span className={styles.modeIcon}>{icon}</span>
      <span>
        <div className={styles.modeTitle}>{label}</div>
        <div className={styles.modeDescription}>{description}</div>
      </span>
    </div>
  );
};

const PersistentVolumeClaimStorageSettings = ({
  form,
  loading = false,
  storageClasses,
}: PersistentVolumeClaimStorageSettingsProps) => {
  const { styles } = useStyles();
  const createMode = Form.useWatch('createMode', form);
  const storageSizeGi = Form.useWatch('storageSizeGi', {
    form,
    preserve: true,
  });
  const storageClassOptions = useMemo(
    () =>
      storageClasses.map((item) => ({
        label: item.name,
        value: item.name,
      })),
    [storageClasses],
  );
  const showStorageClass = createMode !== 'persistentVolume';
  const showVolumeName =
    createMode === 'persistentVolume' || createMode === 'nas';

  const handleCreateModeChange = (
    nextMode: PersistentVolumeClaimCreateMode,
  ) => {
    form.setFieldsValue({
      createMode: nextMode,
      storageClassName:
        nextMode === 'persistentVolume'
          ? undefined
          : form.getFieldValue('storageClassName') || storageClasses[0]?.name,
      volumeName: undefined,
    });
    form.setFields(
      (['storageClassName', 'volumeName'] as const).map((name) => ({
        name,
        errors: [],
      })),
    );
  };

  return (
    <div className={styles.settings}>
      <Form.Item
        className={styles.compactField}
        label="创建方式"
        name="createMode"
        rules={[{ required: true, message: '请选择创建方式' }]}
      >
        <Select
          className={styles.createModeSelect}
          options={createModeOptions.map((option) => ({
            ...option,
            label: <ModeOption {...option} />,
          }))}
          onChange={handleCreateModeChange}
        />
      </Form.Item>

      <div className={styles.fieldGroup}>
        {showStorageClass && (
          <Form.Item
            className={styles.compactField}
            extra="选择一个存储类来创建特定种类的卷。"
            label="存储类"
            name="storageClassName"
            rules={[{ required: true, message: '请选择存储类' }]}
          >
            <Select
              allowClear
              loading={loading}
              notFoundContent={
                loading ? <Spin size="small" /> : '未发现可用存储类'
              }
              options={storageClassOptions}
              placeholder="请选择存储类"
              showSearch
            />
          </Form.Item>
        )}
        {showVolumeName && (
          <Form.Item
            className={styles.compactField}
            extra={
              createMode === 'nas'
                ? '输入需要绑定的 NAS 卷名称。'
                : '输入需要绑定的持久卷名称。'
            }
            label={createMode === 'nas' ? 'NAS 卷' : '持久卷'}
            name="volumeName"
            rules={[{ required: true, message: '请输入卷名称' }]}
          >
            <Input placeholder="请输入卷名称" />
          </Form.Item>
        )}
        <Form.Item
          className={styles.compactField}
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
      </div>

      <Form.Item className={styles.capacityFormItem} label="卷容量" required>
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
            value={storageSizeGi ?? 10}
            onChange={(value) =>
              form.setFieldValue('storageSizeGi', Math.max(value, 1))
            }
          />
          <Form.Item
            name="storageSizeGi"
            noStyle
            rules={[{ required: true, message: '请输入卷容量' }]}
          >
            <InputNumber
              className={styles.capacityInput}
              controls={false}
              max={2048}
              min={1}
              placeholder="请输入卷容量"
              suffix="Gi"
            />
          </Form.Item>
        </div>
      </Form.Item>
    </div>
  );
};

export default PersistentVolumeClaimStorageSettings;
