import { Avatar, Card, List } from 'antd';
import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ReactNode } from 'react';
import type { ActivityItem } from '../types';
import useStyles from '../style.style';

dayjs.extend(relativeTime);

type ActivitiesCardProps = {
  activities: ActivityItem[];
};

const ActivitiesCard = ({ activities }: ActivitiesCardProps) => {
  const intl = useIntl();
  const { styles } = useStyles();

  const renderTemplate = (item: ActivityItem): ReactNode[] =>
    item.template.split(/@\{([^{}]*)\}/gi).map((segment) => {
      const entity = item[segment as keyof ActivityItem];
      if (entity && typeof entity === 'object' && 'name' in entity) {
        return (
          <a href={entity.link} key={`${item.id}-${segment}`}>
            {entity.name}
          </a>
        );
      }
      return segment;
    });

  return (
    <Card
      className={styles.activeCard}
      styles={{
        body: {
          padding: 0,
        },
      }}
      title={intl.formatMessage({
        id: 'pages.home.activities.title',
        defaultMessage: '动态',
      })}
      variant="borderless"
    >
      <List<ActivityItem>
        className={styles.activitiesList}
        dataSource={activities}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <List.Item.Meta
              avatar={<Avatar src={item.user.avatar} />}
              description={
                <span className={styles.datetime} title={item.updatedAt}>
                  {dayjs(item.updatedAt).fromNow()}
                </span>
              }
              title={
                <span>
                  <a className={styles.username} href={item.user.link}>
                    {item.user.name}
                  </a>
                  {' '}
                  <span className={styles.event}>{renderTemplate(item)}</span>
                </span>
              }
            />
          </List.Item>
        )}
        size="large"
      />
    </Card>
  );
};

export default ActivitiesCard;
