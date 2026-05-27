import { ClusterPodList } from '@/components';

type PersistentVolumeClaimResourceStatusProps = {
  loading?: boolean;
  pods?: API.ClusterNodePodItem[];
  onRefresh?: () => void;
};

const PersistentVolumeClaimResourceStatus = ({
  loading,
  pods,
  onRefresh,
}: PersistentVolumeClaimResourceStatusProps) => (
  <div>
    <ClusterPodList
      dataSource={pods}
      loading={loading}
      searchPlaceholder="按名称搜索"
      onRefresh={onRefresh}
    />
  </div>
);

export default PersistentVolumeClaimResourceStatus;
