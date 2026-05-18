import { QuestionCircleOutlined } from '@ant-design/icons';
import { Form, InputNumber, Tooltip } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  terminationWrapper: {
    marginTop: `16px`,
  },
  terminationLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  terminationHelpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: `14px`,
  },
  termination: {
    padding: `14px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  description: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  content: {
    marginTop: token.marginSM,
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorFillQuaternary,
  },
}));

const PodGracefulTerminationFields = () => {
  const { styles } = useStyles();
  const terminationTip = '设置容器终止前等待的时间，超时后容器将强制终止。';

  return (
    <div className={styles.terminationWrapper}>
      <div className={styles.terminationLabel}>
        <span>容器组优雅终止</span>
      </div>
      <div className={styles.termination}>
        <div className={styles.description}>{terminationTip}</div>
        <div className={styles.content}>
          <Form.Item
            label="终止宽限时间 (s)"
            name="terminationGracePeriodSeconds"
            rules={[{ required: true, message: '请输入终止宽限时间' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </div>
      </div>
    </div>
  );
};

export default PodGracefulTerminationFields;
