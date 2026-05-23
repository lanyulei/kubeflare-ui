import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Card, Empty, Spin, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { stringify } from 'yaml';
import { ClusterMetadata, SectionTitle, YamlEditor } from '@/components';
import { getClusterResourceManifest } from '@/services/kubeflare/cluster/resource';

const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';

const resourceTypeLabels: Record<API.ClusterResourceCreateType, string> = {
  Job: '任务',
  CronJob: '定时任务',
  Pod: '容器组',
  Service: '服务',
  Ingress: '应用路由',
  Secret: '保密字典',
  ConfigMap: '配置字典',
  ServiceAccount: '服务账户',
  CustomResourceDefinition: '定制资源定义',
  PersistentVolumeClaim: '持久卷声明',
  StorageClass: '存储类',
};

const resourceTypes = Object.keys(
  resourceTypeLabels,
) as API.ClusterResourceCreateType[];

const useStyles = createStyles(({ token }) => ({
  content: {
    backgroundColor: token.colorBgContainer,
    border: `1px solid ${token.colorBorder}80`,
    borderRadius: token.borderRadiusLG,
    padding: 20,
  },
  moreInfo: {
    marginTop: 15,
  },
  moreInfoCard: {
    borderColor: `${token.colorBorder}80`,

    '.ant-card-body': {
      paddingTop: 2,
    },
  },
  yamlPanel: {
    paddingTop: token.paddingSM,
    background: token.colorBgContainer,
  },
}));

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const isResourceType = (type?: string): type is API.ClusterResourceCreateType =>
  resourceTypes.includes(type as API.ClusterResourceCreateType);

const ClusterResourceDetail = () => {
  const { styles } = useStyles();
  const params = useParams<{
    type?: string;
    namespace?: string;
    name?: string;
  }>();
  const type = isResourceType(params.type) ? params.type : undefined;
  const namespace = params.namespace === '-' ? undefined : params.namespace;
  const name = params.name;
  const [loading, setLoading] = useState(false);
  const [manifest, setManifest] = useState<Record<string, unknown>>();
  const metadata = useMemo(
    () => getRecordValue(manifest?.metadata),
    [manifest],
  );

  const fetchManifest = useCallback(async () => {
    if (!type || !name) {
      setManifest(undefined);
      return;
    }

    setLoading(true);
    try {
      const res = await getClusterResourceManifest({
        type,
        namespace,
        name,
      });
      setManifest(res.data);
    } finally {
      setLoading(false);
    }
  }, [name, namespace, type]);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  useEffect(() => {
    window.addEventListener(CURRENT_CLUSTER_CHANGE_EVENT, fetchManifest);
    return () => {
      window.removeEventListener(CURRENT_CLUSTER_CHANGE_EVENT, fetchManifest);
    };
  }, [fetchManifest]);

  const title = name || '资源详情';
  const resourceLabel = type ? resourceTypeLabels[type] : '-';

  return (
    <PageContainer
      title={title}
      onBack={() => {
        history.back();
      }}
    >
      <div>
        <SectionTitle>基本信息</SectionTitle>
        <div className={styles.content}>
          <Spin spinning={loading}>
            {manifest ? (
              <ProDescriptions
                column={2}
                dataSource={{
                  type: resourceLabel,
                  name: metadata?.name || name,
                  namespace: metadata?.namespace || namespace || '-',
                  uid: metadata?.uid,
                  create_time: metadata?.creationTimestamp,
                }}
                columns={[
                  {
                    title: '资源类型',
                    dataIndex: 'type',
                  },
                  {
                    title: '名称',
                    dataIndex: 'name',
                  },
                  {
                    title: '命名空间',
                    dataIndex: 'namespace',
                  },
                  {
                    title: 'UID',
                    dataIndex: 'uid',
                    copyable: true,
                    ellipsis: true,
                    renderText: (value) => value || '-',
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'create_time',
                    valueType: 'dateTime',
                  },
                ]}
              />
            ) : (
              <Empty description="暂无资源详情" />
            )}
          </Spin>
        </div>
      </div>
      <div className={styles.moreInfo}>
        <Card className={styles.moreInfoCard}>
          <Tabs
            items={[
              {
                key: 'yaml',
                label: 'YAML',
                children: (
                  <div className={styles.yamlPanel}>
                    <YamlEditor
                      readOnly
                      minHeight={420}
                      maxHeight={720}
                      value={manifest ? stringify(manifest) : ''}
                    />
                  </div>
                ),
              },
              {
                key: 'metadata',
                label: '元数据',
                children: (
                  <ClusterMetadata
                    labels={
                      getRecordValue(metadata?.labels) as
                        | Record<string, string>
                        | undefined
                    }
                    annotations={
                      getRecordValue(metadata?.annotations) as
                        | Record<string, string>
                        | undefined
                    }
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </PageContainer>
  );
};

export default ClusterResourceDetail;
