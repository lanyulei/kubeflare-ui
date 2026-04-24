import { Avatar, Card, Col, Row } from 'antd';
import { useIntl } from '@umijs/max';
import type { ProjectNotice } from '../types';
import useStyles from '../style.style';

type TeamCardProps = {
  projectNotice: ProjectNotice[];
};

const TeamCard = ({ projectNotice }: TeamCardProps) => {
  const intl = useIntl();
  const { styles } = useStyles();

  return (
    <Card
      styles={{
        body: {
          paddingBottom: 12,
          paddingTop: 12,
        },
      }}
      title={intl.formatMessage({
        id: 'pages.home.team.title',
        defaultMessage: '团队',
      })}
      variant="borderless"
    >
      <div className={styles.members}>
        <Row gutter={48}>
          {projectNotice.map((item) => (
            <Col key={`members-item-${item.id}`} span={12}>
              <a href={item.memberLink}>
                <Avatar size="small" src={item.logo} />
                <span className={styles.member}>{item.member.substring(0, 3)}</span>
              </a>
            </Col>
          ))}
        </Row>
      </div>
    </Card>
  );
};

export default TeamCard;
