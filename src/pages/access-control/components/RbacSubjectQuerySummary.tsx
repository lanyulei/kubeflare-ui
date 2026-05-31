import { Space, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import SubjectIdentity from './SubjectIdentity';

const useStyles = createStyles(({ token }) => ({
  summary: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1.5fr) repeat(3, minmax(140px, 1fr))',
    gap: token.marginSM,

    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  item: {
    minWidth: 0,
    minHeight: 86,
    padding: `${token.padding}px ${token.paddingLG}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgContainer,
    boxShadow: token.boxShadowTertiary,
  },
  label: {
    marginBottom: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
  value: {
    minWidth: 0,
  },
  number: {
    fontSize: token.fontSizeHeading4,
    fontWeight: token.fontWeightStrong,
    lineHeight: 1.35,
  },
}));

type RbacSubjectQuerySummaryProps = {
  graph?: API.RbacGraphData;
  query: API.RbacSubjectQuery;
};

const RbacSubjectQuerySummary = ({
  graph,
  query,
}: RbacSubjectQuerySummaryProps) => {
  const { styles } = useStyles();
  const nodeCount = graph?.nodes.length || 0;
  const edgeCount = graph?.edges.length || 0;

  return (
    <div className={styles.summary}>
      <div className={styles.item}>
        <div className={styles.label}>当前主体</div>
        <SubjectIdentity subject={query} />
      </div>
      <div className={styles.item}>
        <div className={styles.label}>查询范围</div>
        <Space className={styles.value} size={[6, 6]} wrap>
          <Tag color={query.scopeNamespace ? 'blue' : 'default'}>
            {query.scopeNamespace || '全部命名空间'}
          </Tag>
        </Space>
      </div>
      <div className={styles.item}>
        <div className={styles.label}>关系节点</div>
        <Typography.Text className={styles.number}>{nodeCount}</Typography.Text>
      </div>
      <div className={styles.item}>
        <div className={styles.label}>授权链路</div>
        <Typography.Text className={styles.number}>{edgeCount}</Typography.Text>
      </div>
    </div>
  );
};

export type { RbacSubjectQuerySummaryProps };
export default RbacSubjectQuerySummary;
