import { DeleteOutlined } from '@ant-design/icons';
import { Button, Form, Input, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import {
  CONFIG_MAP_KEY_PATTERN,
  createConfigMapDataItem,
  validateConfigMapDataItems,
} from './helpers';
import type { ConfigMapDataItem } from './types';

const useStyles = createStyles(({ token }) => ({
  dataSetting: {
    width: '100%',
  },
  label: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
  },
  dataList: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  addCard: {
    width: '100%',
    minHeight: 66,
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    textAlign: 'left',
    cursor: 'pointer',
    border: `1px dashed ${token.colorPrimaryBorderHover}`,
    borderRadius: token.borderRadius,
    background: token.colorBgContainer,
    boxShadow: token.boxShadowTertiary,
    transition: `border-color ${token.motionDurationMid} ${token.motionEaseOut}, background ${token.motionDurationMid} ${token.motionEaseOut}`,

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },

    '&:focus-visible': {
      outline: `${token.lineWidthFocus}px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 2,
    },
  },
  addTitle: {
    display: 'block',
    marginBottom: token.marginXXS,
    color: token.colorText,
    fontWeight: token.fontWeightStrong,
    lineHeight: token.lineHeight,
  },
  addDescription: {
    display: 'block',
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  dataItem: {
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  valueTextArea: {
    '&.ant-input': {
      minHeight: 92,
    },
  },
  errors: {
    marginTop: token.marginXS,
  },
}));

const ConfigMapDataSettings = () => {
  const { styles } = useStyles();

  const renderAddCard = (onAdd: () => void) => (
    <button className={styles.addCard} type="button" onClick={onAdd}>
      <span className={styles.addTitle}>添加数据</span>
      <span className={styles.addDescription}>添加键值对数据。</span>
    </button>
  );

  return (
    <div className={styles.dataSetting}>
      <div className={styles.label}>数据</div>
      <Form.List
        name="dataItems"
        rules={[
          {
            validator: async (_, value?: ConfigMapDataItem[]) => {
              const error = validateConfigMapDataItems(value);
              if (error) {
                throw new Error(error);
              }
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => {
          const handleAdd = () => add(createConfigMapDataItem());

          return (
            <div className={styles.dataList}>
              {fields.length === 0
                ? renderAddCard(handleAdd)
                : fields.map((field) => (
                    <div className={styles.dataItem} key={field.key}>
                      <Tooltip title="删除数据">
                        <Button
                          aria-label="删除数据"
                          className={styles.deleteButton}
                          icon={<DeleteOutlined />}
                          type="text"
                          onClick={() => remove(field.name)}
                        />
                      </Tooltip>
                      <Form.Item
                        label="键"
                        name={[field.name, 'keyName']}
                        rules={[
                          { required: true, message: '请输入键' },
                          { max: 253, message: '键最长 253 个字符' },
                          {
                            pattern: CONFIG_MAP_KEY_PATTERN,
                            message:
                              '键只能包含字母、数字、点（.）、下划线（_）和连字符（-）',
                          },
                        ]}
                      >
                        <Input placeholder="请输入键" />
                      </Form.Item>
                      <Form.Item label="值" name={[field.name, 'value']}>
                        <Input.TextArea
                          className={styles.valueTextArea}
                          placeholder="请输入值"
                          rows={4}
                        />
                      </Form.Item>
                    </div>
                  ))}
              {fields.length > 0 && renderAddCard(handleAdd)}
              <Form.ErrorList className={styles.errors} errors={errors} />
            </div>
          );
        }}
      </Form.List>
    </div>
  );
};

export default ConfigMapDataSettings;
