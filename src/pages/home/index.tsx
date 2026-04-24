import { PageContainer } from '@ant-design/pro-components';
import { Col, Row } from 'antd';
import { useModel } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ActivitiesCard from './components/ActivitiesCard';
import ExtraContent from './components/ExtraContent';
import PageHeaderContent from './components/PageHeaderContent';
import ProjectListCard from './components/ProjectListCard';
import QuickLinksCard from './components/QuickLinksCard';
import RadarCard from './components/RadarCard';
import TeamCard from './components/TeamCard';
import { activities, fallbackCurrentUser, projectNotices, quickLinks, radarData } from './data';

dayjs.extend(relativeTime);

const HomePage = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser ?? fallbackCurrentUser;

  return (
    <PageContainer
      content={<PageHeaderContent currentUser={currentUser} />}
      extraContent={<ExtraContent />}
    >
      <Row gutter={24}>
        <Col lg={24} md={24} sm={24} xl={16} xs={24}>
          <ProjectListCard projectNotice={projectNotices} />
          <ActivitiesCard activities={activities} />
        </Col>
        <Col lg={24} md={24} sm={24} xl={8} xs={24}>
          <QuickLinksCard links={quickLinks} />
          <RadarCard data={radarData} />
          <TeamCard projectNotice={projectNotices} />
        </Col>
      </Row>
    </PageContainer>
  );
};

export default HomePage;
