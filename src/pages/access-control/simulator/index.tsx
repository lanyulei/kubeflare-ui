import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Space, Tag } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { simulateRbacAccess } from '@/services/kubeflare/cluster/rbac';
import SubjectPermissionPanel from '../components/SubjectPermissionPanel';
import SimulatorForm from './components/SimulatorForm';
import SimulatorResult from './components/SimulatorResult';
import { getSimulatorSubjectQuery, getSimulatorSubjectText } from './helpers';

const useStyles = createStyles(() => ({
  stack: {
    width: '100%',
  },
}));

const Simulator = () => {
  const { styles } = useStyles();
  const [result, setResult] = useState<API.RbacSimulatorResult>();
  const [query, setQuery] = useState<API.RbacSubjectQuery>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (params: API.RbacSimulatorParams) => {
    setLoading(true);
    try {
      const res = await simulateRbacAccess(params);
      const nextQuery = getSimulatorSubjectQuery(params);

      setResult(res.data);
      setQuery(nextQuery);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="权限模拟">
      <Space className={styles.stack} direction="vertical" size={16}>
        <ProCard title="模拟条件">
          <SimulatorForm loading={loading} onSubmit={handleSubmit} />
        </ProCard>
        <SimulatorResult result={result} />
        <SubjectPermissionPanel
          title={
            <Space size={8}>
              <span>主体最终权限</span>
              <Tag>{getSimulatorSubjectText(query)}</Tag>
            </Space>
          }
          query={query}
        />
      </Space>
    </PageContainer>
  );
};

export default Simulator;
