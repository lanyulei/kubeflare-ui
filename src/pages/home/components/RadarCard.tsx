import { Card } from 'antd';
import { useIntl } from '@umijs/max';
import RadarChart from './RadarChart';
import type { RadarDataItem } from '../types';

type RadarCardProps = {
  data: RadarDataItem[];
};

const RadarCard = ({ data }: RadarCardProps) => {
  const intl = useIntl();

  return (
    <Card
      style={{ marginBottom: 24 }}
      title={intl.formatMessage({
        id: 'pages.home.radar.title',
        defaultMessage: 'XX 指数',
      })}
      variant="borderless"
    >
      <RadarChart data={data} />
    </Card>
  );
};

export default RadarCard;
