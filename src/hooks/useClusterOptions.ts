import { useEffect, useMemo, useState } from 'react';
import { getClusterList } from '@/services/kubeflare/cluster/info';

export type ClusterSelectOption = {
  label: string;
  value: string;
};

let cachedClusters: API.ClusterItem[] | undefined;
let loadingClusters: Promise<API.ClusterItem[]> | undefined;

const getClusterOptionLabel = (cluster: API.ClusterItem) => {
  const name = cluster.alias || cluster.name || String(cluster.id);
  const originName = cluster.alias && cluster.name ? ` / ${cluster.name}` : '';

  return `${name}${originName} (#${cluster.id})`;
};

const loadClusters = async () => {
  if (cachedClusters) {
    return cachedClusters;
  }

  if (!loadingClusters) {
    loadingClusters = getClusterList(undefined, {
      skipErrorHandler: true,
    })
      .then((res) => {
        cachedClusters = res.data.items || [];
        return cachedClusters;
      })
      .catch(() => {
        return [];
      })
      .finally(() => {
        loadingClusters = undefined;
      });
  }

  return loadingClusters;
};

export const useClusterOptions = () => {
  const [clusters, setClusters] = useState<API.ClusterItem[]>(
    cachedClusters || [],
  );
  const [loading, setLoading] = useState(!cachedClusters);

  useEffect(() => {
    let mounted = true;

    setLoading(!cachedClusters);
    loadClusters()
      .then((items) => {
        if (mounted) {
          setClusters(items);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo<ClusterSelectOption[]>(
    () =>
      clusters.map((cluster) => ({
        label: getClusterOptionLabel(cluster),
        value: String(cluster.id),
      })),
    [clusters],
  );

  return {
    clusters,
    loading,
    options,
  };
};
