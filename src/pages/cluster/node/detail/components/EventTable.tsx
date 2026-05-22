import { ClusterEventTable } from '@/components';
import useStyles from '../styles';

type EventTableProps = {
  nodeName: string;
};

const EventTable = ({ nodeName }: EventTableProps) => {
  const { styles } = useStyles();

  return (
    <ClusterEventTable
      className={styles.eventTable}
      params={{ nodeName }}
      placeholder="搜索事件原因 / 来源 / 消息"
    />
  );
};

export default EventTable;
