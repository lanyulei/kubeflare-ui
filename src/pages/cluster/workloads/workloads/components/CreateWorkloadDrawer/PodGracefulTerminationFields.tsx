import { Checkbox, Form, InputNumber } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  termination: {
    padding: `14px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  header: {
    display: 'grid',
    gridTemplateColumns: '18px minmax(0, 1fr)',
    gap: token.marginSM,
    alignItems: 'start',
  },
  checkbox: {
    marginTop: 3,
  },
  title: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  description: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  content: {
    marginTop: token.marginMD,
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorFillQuaternary,
  },
}));

const PodGracefulTerminationFields = () => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();
  const enabled = Form.useWatch('enablePodGracefulTermination', form);

  return (
    <div className={styles.termination}>
      <div className={styles.header}>
        <Form.Item
          className={styles.checkbox}
          name="enablePodGracefulTermination"
          valuePropName="checked"
        >
          <Checkbox aria-label="启用容器组优雅终止" />
        </Form.Item>
        <span>
          <div className={styles.title}>容器组优雅终止</div>
          <div className={styles.description}>
            设置容器终止前等待的时间，超时后容器将强制终止。
          </div>
        </span>
      </div>
      {enabled && (
        <div className={styles.content}>
          <Form.Item
            label="终止宽限时间 (s)"
            name="terminationGracePeriodSeconds"
            rules={[{ required: true, message: '请输入终止宽限时间' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </div>
      )}
    </div>
  );
};

export default PodGracefulTerminationFields;
