import { Empty, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import RiskLevelTag from './RiskLevelTag';

const useStyles = createStyles(({ token }) => ({
  graph: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  edge: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 88px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginSM,
    minHeight: 56,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorFillAlter,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: token.marginXS,
    },
  },
  node: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    minWidth: 0,
  },
  nodeLabel: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  relation: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    textAlign: 'center',

    '@media (max-width: 768px)': {
      textAlign: 'left',
    },
  },
}));

type RbacGraphViewProps = {
  graph?: API.RbacGraphData;
};

const RbacGraphView = ({ graph }: RbacGraphViewProps) => {
  const { styles } = useStyles();
  const nodeMap = new Map((graph?.nodes || []).map((node) => [node.id, node]));

  if (!graph?.edges.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className={styles.graph}>
      {graph.edges.map((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);

        return (
          <div
            className={styles.edge}
            key={`${edge.source}-${edge.label}-${edge.target}`}
          >
            <span className={styles.node}>
              <Tag>{source?.type}</Tag>
              <Typography.Text
                className={styles.nodeLabel}
                ellipsis={{ tooltip: source?.label }}
              >
                {source?.label || '-'}
              </Typography.Text>
              {source?.risk_level ? (
                <RiskLevelTag level={source.risk_level} />
              ) : null}
            </span>
            <span className={styles.relation}>{edge.label}</span>
            <span className={styles.node}>
              <Tag>{target?.type}</Tag>
              <Typography.Text
                className={styles.nodeLabel}
                ellipsis={{ tooltip: target?.label }}
              >
                {target?.label || '-'}
              </Typography.Text>
              {target?.risk_level ? (
                <RiskLevelTag level={target.risk_level} />
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RbacGraphView;
