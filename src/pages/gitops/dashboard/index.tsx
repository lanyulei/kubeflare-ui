import {
  AppstoreOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudSyncOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, Card, Col, Row, Statistic, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import {
  getGitOpsDashboard,
  getGitOpsReleaseList,
  getGitOpsSyncList,
} from '@/services/kubeflare/gitops';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import { ReleaseStatusTag, SyncStatusTag } from '../components/status';
import { formatDateTimeText, getGitOpsErrorMessage } from '../utils';

const useStyles = createStyles(({ token }) => ({
  body: {
    display: 'grid',
    gap: token.marginLG,
  },
  statCard: {
    borderRadius: 8,
  },
  statIcon: {
    color: token.colorPrimary,
    fontSize: 20,
  },
  sectionTitle: {
    marginBottom: token.marginSM,
  },
}));

const EMPTY_STATS: API.GitOpsDashboardStats = {
  application_count: 0,
  drifted_sync_count: 0,
  environment_count: 0,
  failed_release_count: 0,
  provider_count: 0,
  release_count: 0,
  syncing_release_count: 0,
  waiting_approval_count: 0,
};

const GitOpsDashboard = () => {
  const { message } = App.useApp();
  const { styles } = useStyles();
  const [stats, setStats] = useState<API.GitOpsDashboardStats>(EMPTY_STATS);

  useEffect(() => {
    getGitOpsDashboard({ skipErrorHandler: true })
      .then((res) => setStats({ ...EMPTY_STATS, ...res.data }))
      .catch((error) =>
        message.error(getGitOpsErrorMessage(error, 'GitOps 总览加载失败')),
      );
  }, [message]);

  const releaseColumns = useMemo<ProColumns<API.GitOpsRelease>[]>(
    () =>
      withComfortableTableColumns([
        {
          title: '发布单',
          dataIndex: 'title',
          ellipsis: true,
        },
        {
          title: '状态',
          dataIndex: 'status',
          width: 120,
          render: (_, record) => <ReleaseStatusTag status={record.status} />,
        },
        {
          title: '目标版本',
          dataIndex: 'target_revision',
          ellipsis: true,
        },
        {
          title: '创建时间',
          dataIndex: 'created_at',
          width: 180,
          renderText: (value) => formatDateTimeText(value),
        },
      ]),
    [],
  );

  const syncColumns = useMemo<ProColumns<API.GitOpsSyncRecord>[]>(
    () =>
      withComfortableTableColumns([
        {
          title: '同步资源',
          dataIndex: 'resource_name',
          ellipsis: true,
          renderText: (_, record) =>
            record.resource_name || record.release_id || record.id,
        },
        {
          title: '状态',
          dataIndex: 'status',
          width: 110,
          render: (_, record) => <SyncStatusTag status={record.status} />,
        },
        {
          title: 'Revision',
          dataIndex: 'revision',
          ellipsis: true,
        },
        {
          title: '更新时间',
          dataIndex: 'updated_at',
          width: 180,
          renderText: (value) => formatDateTimeText(value),
        },
      ]),
    [],
  );

  return (
    <PageContainer title="GitOps 总览">
      <div className={styles.body}>
        <Row gutter={[16, 16]}>
          {[
            {
              icon: <BranchesOutlined className={styles.statIcon} />,
              title: 'Provider',
              value: stats.provider_count,
            },
            {
              icon: <AppstoreOutlined className={styles.statIcon} />,
              title: '应用',
              value: stats.application_count,
            },
            {
              icon: <CloudSyncOutlined className={styles.statIcon} />,
              title: '环境',
              value: stats.environment_count,
            },
            {
              icon: <ClockCircleOutlined className={styles.statIcon} />,
              title: '待审批',
              value: stats.waiting_approval_count,
            },
            {
              icon: <CheckCircleOutlined className={styles.statIcon} />,
              title: '同步中',
              value: stats.syncing_release_count,
            },
            {
              icon: <ExclamationCircleOutlined className={styles.statIcon} />,
              title: '失败/漂移',
              value: stats.failed_release_count + stats.drifted_sync_count,
            },
          ].map((item) => (
            <Col key={item.title} xs={24} sm={12} lg={8} xl={4}>
              <Card className={styles.statCard}>
                <Statistic
                  prefix={item.icon}
                  title={item.title}
                  value={item.value}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <div>
          <Typography.Title className={styles.sectionTitle} level={5}>
            最近发布
          </Typography.Title>
          <ProTable<API.GitOpsRelease>
            rowKey="id"
            search={false}
            options={false}
            columns={releaseColumns}
            scroll={getComfortableTableScroll(releaseColumns)}
            pagination={false}
            request={async () => {
              const res = await getGitOpsReleaseList({ pageSize: 5 });
              return {
                data: res.data.items || [],
                success: true,
              };
            }}
            onRow={() => ({
              onDoubleClick: () => history.push('/gitops/release'),
            })}
          />
        </div>

        <div>
          <Typography.Title className={styles.sectionTitle} level={5}>
            同步状态
          </Typography.Title>
          <ProTable<API.GitOpsSyncRecord>
            rowKey="id"
            search={false}
            options={false}
            columns={syncColumns}
            scroll={getComfortableTableScroll(syncColumns)}
            pagination={false}
            request={async () => {
              const res = await getGitOpsSyncList({ pageSize: 5 });
              return {
                data: res.data.items || [],
                success: true,
              };
            }}
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default GitOpsDashboard;
