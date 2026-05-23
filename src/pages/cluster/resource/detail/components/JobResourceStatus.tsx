import { ClusterPodList } from '@/components';

type JobResourceStatusProps = {
  loading?: boolean;
  pods?: API.ClusterNodePodItem[];
  onRefresh?: () => void;
};

const JobResourceStatus = ({
  loading,
  pods,
  onRefresh,
}: JobResourceStatusProps) => (
  <ClusterPodList
    dataSource={pods}
    loading={loading}
    searchPlaceholder="按名称搜索"
    onRefresh={onRefresh}
  />
);

export default JobResourceStatus;
