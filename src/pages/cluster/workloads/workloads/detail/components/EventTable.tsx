import { ClusterEventTable } from '@/components';

type EventTableProps = {
  name?: string;
  namespace?: string;
  type?: API.ClusterWorkloadType;
};

const EventTable = ({ name, namespace, type }: EventTableProps) => (
  <ClusterEventTable
    disabled={!type || !namespace || !name}
    params={{
      objectKind: type,
      objectName: name,
      namespace,
    }}
  />
);

export default EventTable;
