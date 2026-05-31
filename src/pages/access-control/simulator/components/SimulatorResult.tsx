import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { Alert, Descriptions, Space, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';

type SimulatorResultProps = {
  result?: API.RbacSimulatorResult;
};

const useStyles = createStyles(({ token }) => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.margin,
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: token.marginSM,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  summaryItem: {
    minHeight: 68,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorFillAlter,
  },
  summaryLabel: {
    marginBottom: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
  summaryValue: {
    color: token.colorText,
    fontSize: token.fontSizeLG,
    fontWeight: 600,
  },
}));

const getResultMeta = (result: API.RbacSimulatorResult) => {
  if (result.allowed) {
    return {
      icon: <CheckCircleOutlined />,
      title: '允许访问',
      type: 'success' as const,
    };
  }

  return {
    icon: <StopOutlined />,
    title: '拒绝访问',
    type: 'warning' as const,
  };
};

const formatAllowed = (value?: boolean) => (value ? '允许' : '未允许');

const formatDenied = (value?: boolean) => (value ? '已拒绝' : '未拒绝');

const SimulatorResult = ({ result }: SimulatorResultProps) => {
  const { styles } = useStyles();

  if (!result) {
    return null;
  }

  const meta = getResultMeta(result);
  const description =
    result.reason || result.evaluationError || 'API Server 已返回授权结果';
  const matchedCount = result.matchedPermissions?.length || 0;

  return (
    <ProCard title="模拟结果">
      <div className={styles.content}>
        <Alert
          type={meta.type}
          message={
            <Space size={8}>
              {meta.icon}
              <span>{meta.title}</span>
            </Space>
          }
          description={description}
          showIcon={false}
        />
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>授权结果</div>
            <Typography.Text className={styles.summaryValue}>
              {formatAllowed(result.allowed)}
            </Typography.Text>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>拒绝状态</div>
            <Typography.Text className={styles.summaryValue}>
              {formatDenied(result.denied)}
            </Typography.Text>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>本地匹配</div>
            <Typography.Text className={styles.summaryValue}>
              {matchedCount}
            </Typography.Text>
          </div>
        </div>
        <Descriptions
          column={1}
          items={[
            {
              key: 'evaluationError',
              label: '校验错误',
              children: result.evaluationError || '-',
            },
            {
              key: 'matchedPermissions',
              label: '匹配规则',
              children:
                matchedCount > 0 ? (
                  <Tag color="blue">{matchedCount} 条</Tag>
                ) : (
                  '-'
                ),
            },
          ]}
          size="small"
        />
      </div>
    </ProCard>
  );
};

export default SimulatorResult;
