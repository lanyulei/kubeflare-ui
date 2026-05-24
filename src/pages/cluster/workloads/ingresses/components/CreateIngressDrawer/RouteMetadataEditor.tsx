import type { FormInstance } from 'antd';
import { Checkbox, Form, Input } from 'antd';
import { createStyles } from 'antd-style';
import type { IngressRouteRuleItem } from './types';

const useStyles = createStyles(({ token }) => ({
  metadataCard: {
    padding: '12px 16px',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  metadataHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
  },
  metadataCheckbox: {
    marginTop: 2,
  },
  metadataTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  metadataDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  metadataBody: {
    marginTop: 14,
    padding: token.paddingSM,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
  },
  metadataTextArea: {
    width: '100%',
    background: token.colorBgContainer,
  },
}));

type RouteMetadataEditorProps = {
  form: FormInstance<IngressRouteRuleItem>;
};

const RouteMetadataEditor = ({ form }: RouteMetadataEditorProps) => {
  const { styles } = useStyles();
  const enableMetadata = Form.useWatch('enableMetadata', form);

  return (
    <div className={styles.metadataCard}>
      <div className={styles.metadataHeader}>
        <Form.Item
          className={styles.metadataCheckbox}
          name="enableMetadata"
          valuePropName="checked"
        >
          <Checkbox aria-label="添加元数据" />
        </Form.Item>
        <span>
          <div className={styles.metadataTitle}>添加元数据</div>
          <div className={styles.metadataDescription}>为路由添加元数据。</div>
        </span>
      </div>
      {enableMetadata && (
        <div className={styles.metadataBody}>
          <Form.Item name="metadata">
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              className={styles.metadataTextArea}
            />
          </Form.Item>
        </div>
      )}
    </div>
  );
};

export default RouteMetadataEditor;
