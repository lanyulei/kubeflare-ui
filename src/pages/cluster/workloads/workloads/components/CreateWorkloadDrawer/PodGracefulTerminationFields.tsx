import { QuestionCircleOutlined } from '@ant-design/icons';
import { Checkbox, Col, Form, InputNumber, Row, Tooltip } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  terminationWrapper: {
    marginTop: `16px`,
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
  terminationHeader: {
    display: 'grid',
    gridTemplateColumns: '18px minmax(0, 1fr)',
    gap: token.marginSM,
    alignItems: 'start',
  },
  terminationCheckbox: {
    marginTop: 3,
  },
  terminationTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  terminationHelpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: `14px`,
  },
  terminationDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  terminationGroupTitle: {
    margin: `16px 0 8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  terminationGroup: {
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorFillQuaternary,
  },
}));

const PodGracefulTerminationFields = () => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();
  const enabled = Form.useWatch('enablePodGracefulTermination', form);
  const terminationTip = '设置容器终止前等待的时间，超时后容器将强制终止。';

  return (
    <div className={styles.terminationWrapper}>
      <div className={styles.termination}>
        <div className={styles.terminationHeader}>
          <Form.Item
            className={styles.terminationCheckbox}
            name="enablePodGracefulTermination"
            valuePropName="checked"
          >
            <Checkbox
              aria-label="启用容器组优雅终止"
              onChange={(event) => {
                if (
                  event.target.checked &&
                  form.getFieldValue('terminationGracePeriodSeconds') == null
                ) {
                  form.setFieldValue('terminationGracePeriodSeconds', 30);
                }
              }}
            />
          </Form.Item>
          <span>
            <div className={styles.terminationTitle}>
              <span>容器组优雅终止</span>
              <Tooltip title={terminationTip}>
                <QuestionCircleOutlined
                  className={styles.terminationHelpIcon}
                />
              </Tooltip>
            </div>
            <div className={styles.terminationDescription}>
              设置容器终止前的等待时间。
            </div>
          </span>
        </div>

        {enabled && (
          <>
            <div className={styles.terminationGroupTitle}>终止配置</div>
            <div className={styles.terminationGroup}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="终止宽限时间 (s)"
                    name="terminationGracePeriodSeconds"
                    rules={[{ required: true, message: '请输入终止宽限时间' }]}
                  >
                    <InputNumber
                      min={0}
                      precision={0}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PodGracefulTerminationFields;
