import { useEffect, useState } from 'react';
import { ClusterPodList } from '@/components';
import { getClusterNodePodList } from '@/services/kubeflare/cluster/node';

type PodsProps = {
  nodeName?: string;
};

const Pods = ({ nodeName }: PodsProps) => {
  const [loading, setLoading] = useState(false);
  const [pods, setPods] = useState<API.ClusterNodePodItem[]>([]);

  const fetchPods = async () => {
    if (!nodeName) {
      setPods([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getClusterNodePodList({ nodeName });
      setPods(res.data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPods();
  }, [nodeName]);

  return (
    <ClusterPodList dataSource={pods} loading={loading} onRefresh={fetchPods} />
  );
};

export default Pods;
