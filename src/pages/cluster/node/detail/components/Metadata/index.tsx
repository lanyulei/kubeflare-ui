import { Empty } from 'antd';
import { ClusterMetadata } from '@/components';

type MetadataProps = {
  node?: API.ClusterNodeItem;
};

const NodeMetadata = ({ node }: MetadataProps) => {
  if (!node) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <ClusterMetadata labels={node.labels} annotations={node.annotations} />
  );
};

export default NodeMetadata;
