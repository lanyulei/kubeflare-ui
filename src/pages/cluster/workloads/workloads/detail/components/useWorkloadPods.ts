import { useCallback, useEffect, useMemo, useState } from 'react';
import { getClusterNamespacePodList } from '@/services/kubeflare/cluster/namespace';
import { getLabelSelector, matchWorkloadPod } from './podHelpers';

const useWorkloadPods = (workload?: API.ClusterWorkloadItem) => {
  const [loading, setLoading] = useState(false);
  const [pods, setPods] = useState<API.ClusterNodePodItem[]>([]);
  const labelSelector = useMemo(
    () => getLabelSelector(workload?.selector),
    [workload?.selector],
  );
  const workloadPods = useMemo(
    () => pods.filter((pod) => matchWorkloadPod(pod, workload)),
    [pods, workload],
  );

  const fetchPods = useCallback(async () => {
    if (!workload?.namespace || !labelSelector) {
      setPods([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getClusterNamespacePodList({
        namespace: workload.namespace,
        labelSelector,
      });
      setPods(res.data.items || []);
    } finally {
      setLoading(false);
    }
  }, [labelSelector, workload?.namespace]);

  useEffect(() => {
    fetchPods();
  }, [fetchPods]);

  return {
    loading,
    pods: workloadPods,
    reload: fetchPods,
  };
};

export default useWorkloadPods;
