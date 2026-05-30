import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import { useEffect, useState } from 'react';
import { getRbacGraph } from '@/services/kubeflare/cluster/rbac';
import RbacGraphView from '../components/RbacGraphView';
import SubjectPermissionPanel from '../components/SubjectPermissionPanel';
import { SUBJECT_KIND_OPTIONS } from '../constants';

const Permissions = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState<API.RbacSubjectQuery>();
  const [graph, setGraph] = useState<API.RbacGraphData>();

  useEffect(() => {
    const kind = searchParams.get('kind') as API.RbacSubjectKind | null;
    const name = searchParams.get('name');
    const namespace = searchParams.get('namespace') || undefined;

    if (!kind || !name) {
      return;
    }

    const nextQuery = { kind, name, namespace };
    setQuery(nextQuery);
    getRbacGraph(nextQuery).then((res) => setGraph(res.data));
  }, [searchParams]);

  return (
    <PageContainer title="权限反查">
      <ProCard direction="column" gutter={[16, 16]}>
        <ProCard>
          <ProForm
            key={JSON.stringify(query || {})}
            layout="horizontal"
            initialValues={query}
            submitter={{ searchConfig: { submitText: '查询权限' } }}
            onFinish={async (values) => {
              const nextQuery = values as API.RbacSubjectQuery;
              setQuery(nextQuery);
              const res = await getRbacGraph(nextQuery);
              setGraph(res.data);
            }}
          >
            <ProFormSelect
              name="kind"
              label="主体类型"
              width="md"
              rules={[{ required: true }]}
              options={SUBJECT_KIND_OPTIONS}
            />
            <ProFormText
              name="namespace"
              label="ServiceAccount 命名空间"
              width="md"
            />
            <ProFormText
              name="name"
              label="主体名称"
              width="md"
              rules={[{ required: true }]}
            />
            <ProFormText
              name="scopeNamespace"
              label="限定命名空间"
              width="md"
            />
          </ProForm>
        </ProCard>
        <ProCard title="最终权限">
          <SubjectPermissionPanel query={query} />
        </ProCard>
        <ProCard title="权限来源关系">
          <RbacGraphView graph={graph} />
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};

export default Permissions;
