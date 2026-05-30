import { Empty, Tag } from 'antd';
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
    gridTemplateColumns: 'minmax(0, 1fr) 96px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginSM,
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    background: token.colorBgContainer,
  },
  node: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  relation: {
    textAlign: 'center',
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
              {source?.label}
              {source?.risk_level ? (
                <RiskLevelTag level={source.risk_level} />
              ) : null}
            </span>
            <span className={styles.relation}>{edge.label}</span>
            <span className={styles.node}>
              <Tag>{target?.type}</Tag>
              {target?.label}
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
