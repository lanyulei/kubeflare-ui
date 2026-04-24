import { Card, Avatar } from 'antd';
import { Link, useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ProjectNotice } from '../types';
import useStyles from '../style.style';

dayjs.extend(relativeTime);

type ProjectListCardProps = {
  projectNotice: ProjectNotice[];
};

const ProjectListCard = ({ projectNotice }: ProjectListCardProps) => {
  const intl = useIntl();
  const { styles } = useStyles();

  return (
    <Card
      className={styles.projectList}
      extra={<Link to="/home">{intl.formatMessage({ id: 'pages.home.projects.all', defaultMessage: '全部项目' })}</Link>}
      style={{ marginBottom: 24 }}
      title={intl.formatMessage({
        id: 'pages.home.projects.title',
        defaultMessage: '进行中的项目',
      })}
      variant="borderless"
    >
      {projectNotice.map((item) => (
        <Card.Grid className={styles.projectGrid} key={item.id}>
          <Card.Meta
            description={item.description}
            style={{ width: '100%' }}
            title={
              <div className={styles.cardTitle}>
                <Avatar size="small" src={item.logo} />
                <Link to={item.href || '/home'}>{item.title}</Link>
              </div>
            }
          />
          <div className={styles.projectItemContent}>
            <Link to={item.memberLink || '/home'}>{item.member}</Link>
            <span className={styles.datetime} title={item.updatedAt}>
              {dayjs(item.updatedAt).fromNow()}
            </span>
          </div>
        </Card.Grid>
      ))}
    </Card>
  );
};

export default ProjectListCard;
