import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import { App, Space, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useState } from 'react';
import { getRbacGraph } from '@/services/kubeflare/cluster/rbac';
import RbacGraphView from '../components/RbacGraphView';
import RbacSubjectQueryForm from '../components/RbacSubjectQueryForm';
import RbacSubjectQuerySummary from '../components/RbacSubjectQuerySummary';
import SubjectPermissionPanel from '../components/SubjectPermissionPanel';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : '查询失败，请稍后重试';

const useStyles = createStyles(() => ({
  stack: {
    width: '100%',
  },
}));

const Permissions = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState<API.RbacSubjectQuery>();
  const [graph, setGraph] = useState<API.RbacGraphData>();
  const [graphLoading, setGraphLoading] = useState(false);

  const handleQuery = useCallback(
    async (nextQuery: API.RbacSubjectQuery) => {
      setQuery(nextQuery);
      setGraph(undefined);
      setGraphLoading(true);
      try {
        const res = await getRbacGraph(nextQuery);
        setGraph(res.data);
      } catch (error) {
        message.error(getErrorMessage(error));
        setGraph(undefined);
      } finally {
        setGraphLoading(false);
      }
    },
    [message],
  );

  const handleReset = () => {
    setQuery(undefined);
    setGraph(undefined);
  };

  useEffect(() => {
    const kind = searchParams.get('kind') as API.RbacSubjectKind | null;
    const name = searchParams.get('name');
    const namespace = searchParams.get('namespace') || undefined;
    const scopeNamespace = searchParams.get('scopeNamespace') || undefined;

    if (!kind || !name) {
      setQuery(undefined);
      setGraph(undefined);
      return;
    }

    void handleQuery({ kind, name, namespace, scopeNamespace });
  }, [handleQuery, searchParams]);

  return (
    <PageContainer title="权限反查">
      <Space className={styles.stack} direction="vertical" size={16}>
        <ProCard>
          <RbacSubjectQueryForm
            key={JSON.stringify(query || {})}
            initialValues={query}
            loading={graphLoading}
            onReset={handleReset}
            onSubmit={handleQuery}
          />
        </ProCard>
        {query ? <RbacSubjectQuerySummary graph={graph} query={query} /> : null}
        <SubjectPermissionPanel title="最终权限" query={query} />
        <ProCard title="权限来源关系">
          <Spin spinning={graphLoading}>
            <RbacGraphView graph={graph} />
          </Spin>
        </ProCard>
      </Space>
    </PageContainer>
  );
};

export default Permissions;
