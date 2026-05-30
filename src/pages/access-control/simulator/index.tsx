import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, Descriptions } from 'antd';
import { useState } from 'react';
import { simulateRbacAccess } from '@/services/kubeflare/cluster/rbac';
import SubjectPermissionPanel from '../components/SubjectPermissionPanel';
import { RBAC_VERB_OPTIONS, SUBJECT_KIND_OPTIONS } from '../constants';

const Simulator = () => {
  const [result, setResult] = useState<API.RbacSimulatorResult>();
  const [query, setQuery] = useState<API.RbacSubjectQuery>();

  return (
    <PageContainer title="权限模拟">
      <ProCard direction="column" gutter={[16, 16]}>
        <ProCard>
          <ProForm
            layout="horizontal"
            submitter={{ searchConfig: { submitText: '模拟访问' } }}
            onFinish={async (values) => {
              const params = values as API.RbacSimulatorParams;
              const res = await simulateRbacAccess(params);
              setResult(res.data);
              if (params.subjectKind !== 'Self' && params.subjectName) {
                setQuery({
                  kind: params.subjectKind as API.RbacSubjectKind,
                  name: params.subjectName,
                  namespace: params.subjectNamespace,
                  scopeNamespace: params.namespace,
                });
              } else {
                setQuery(undefined);
              }
            }}
          >
            <ProFormSelect
              name="subjectKind"
              label="主体类型"
              width="md"
              initialValue="Self"
              options={[
                { label: '当前用户', value: 'Self' },
                ...SUBJECT_KIND_OPTIONS,
              ]}
              rules={[{ required: true }]}
            />
            <ProFormText
              name="subjectNamespace"
              label="主体命名空间"
              width="md"
            />
            <ProFormText name="subjectName" label="主体名称" width="md" />
            <ProFormText name="namespace" label="资源命名空间" width="md" />
            <ProFormText
              name="apiGroup"
              label="API 组"
              width="md"
              placeholder="core 资源可留空"
            />
            <ProFormText name="resource" label="资源" width="md" />
            <ProFormText name="subresource" label="子资源" width="md" />
            <ProFormText name="resourceName" label="资源名称" width="md" />
            <ProFormSelect
              name="verb"
              label="动作"
              width="md"
              options={RBAC_VERB_OPTIONS}
              rules={[{ required: true }]}
            />
            <ProFormText name="nonResourceURL" label="非资源 URL" width="md" />
          </ProForm>
        </ProCard>
        {result ? (
          <ProCard title="模拟结果">
            <Alert
              type={result.allowed ? 'success' : 'warning'}
              message={result.allowed ? '允许访问' : '拒绝访问'}
              description={
                result.reason ||
                result.evaluationError ||
                'API Server 已返回授权结果'
              }
              showIcon
            />
            <Descriptions column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="allowed">
                {String(Boolean(result.allowed))}
              </Descriptions.Item>
              <Descriptions.Item label="denied">
                {String(Boolean(result.denied))}
              </Descriptions.Item>
              <Descriptions.Item label="evaluationError">
                {result.evaluationError || '-'}
              </Descriptions.Item>
            </Descriptions>
          </ProCard>
        ) : null}
        <ProCard title="本地 RBAC 匹配规则">
          <SubjectPermissionPanel query={query} />
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};

export default Simulator;
