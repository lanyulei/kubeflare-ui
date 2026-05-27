import { ClusterPodList, SectionTitle } from '@/components';

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
    <SectionTitle color={'#36435C'} fontSize={12}>
      已挂载容器组
    </SectionTitle>
    <ClusterPodList
      dataSource={pods}
      loading={loading}
      searchPlaceholder="按名称搜索"
      onRefresh={onRefresh}
    />
  </div>
);

export default PersistentVolumeClaimResourceStatus;
