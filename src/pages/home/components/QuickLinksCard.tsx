import { Card } from 'antd';
import { Link, useIntl } from '@umijs/max';
import type { ComponentType } from 'react';
import EditableLinkGroup from './EditableLinkGroup';
import type { QuickLink } from '../types';

type QuickLinksCardProps = {
  links: QuickLink[];
};

const QuickLinksCard = ({ links }: QuickLinksCardProps) => {
  const intl = useIntl();

  return (
    <Card
      style={{ marginBottom: 24 }}
      title={intl.formatMessage({
        id: 'pages.home.quickLinks.title',
        defaultMessage: '快速开始 / 便捷导航',
      })}
      variant="borderless"
    >
      <EditableLinkGroup
        linkElement={Link as ComponentType<any>}
        links={links}
        onAdd={() => {}}
      />
    </Card>
  );
};

export default QuickLinksCard;
