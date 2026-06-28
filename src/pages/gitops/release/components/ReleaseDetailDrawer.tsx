import { LinkOutlined } from '@ant-design/icons';
import { ProDescriptions } from '@ant-design/pro-components';
import { Button, Drawer, Space } from 'antd';
import { EnvironmentTierTag, ReleaseStatusTag } from '../../components/status';
import { formatDateTimeText } from '../../utils';

type ReleaseDetailDrawerProps = {
  loading?: boolean;
  open: boolean;
  release?: API.GitOpsRelease;
  onClose: () => void;
};

const renderText = (value?: number | string) => value || '-';

const renderBoolean = (value?: boolean) =>
  typeof value === 'boolean' ? (value ? '是' : '否') : '-';

const ReleaseDetailDrawer = ({
  loading,
  open,
  release,
  onClose,
}: ReleaseDetailDrawerProps) => {
  const title = release ? `${release.title} / ${release.id}` : '发布详情';

  return (
    <Drawer
      destroyOnHidden
      loading={loading}
      open={open}
      title={title}
      width="62vw"
      onClose={onClose}
    >
      {release ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <ProDescriptions<API.GitOpsRelease>
            column={2}
            dataSource={release}
            title="发布状态"
            columns={[
              { title: '发布单 ID', dataIndex: 'id', copyable: true, span: 2 },
              {
                title: '状态',
                dataIndex: 'status',
                render: (_, record) => (
                  <ReleaseStatusTag status={record.status} />
                ),
              },
              {
                title: '操作者',
                dataIndex: 'operator_id',
                renderText: (_, record) => renderText(record.operator_id),
              },
              {
                title: 'Source Ref',
                dataIndex: 'source_ref',
                copyable: true,
                renderText: (_, record) => renderText(record.source_ref),
              },
              {
                title: '目标版本',
                dataIndex: 'target_revision',
                copyable: true,
                renderText: (_, record) => renderText(record.target_revision),
              },
              {
                title: '镜像 Digest',
                dataIndex: 'image_digest',
                copyable: true,
                span: 2,
                renderText: (_, record) => renderText(record.image_digest),
              },
              {
                title: '发布说明',
                dataIndex: 'reason',
                span: 2,
                renderText: (_, record) => renderText(record.reason),
              },
              {
                title: '错误信息',
                dataIndex: 'error_message',
                span: 2,
                renderText: (_, record) => renderText(record.error_message),
              },
              {
                title: '创建时间',
                dataIndex: 'created_at',
                renderText: (_, record) =>
                  formatDateTimeText(record.created_at),
              },
              {
                title: '完成时间',
                dataIndex: 'completed_at',
                renderText: (_, record) =>
                  formatDateTimeText(record.completed_at),
              },
            ]}
          />

          <ProDescriptions<API.GitOpsRelease>
            column={2}
            dataSource={release}
            title="Git 与同步"
            columns={[
              {
                title: 'Merge Request',
                dataIndex: 'mr_url',
                span: 2,
                render: (_, record) =>
                  record.mr_url ? (
                    <Button
                      href={record.mr_url}
                      icon={<LinkOutlined />}
                      rel="noreferrer"
                      size="small"
                      target="_blank"
                      type="link"
                    >
                      {record.mr_iid ? `!${record.mr_iid}` : '查看 MR'}
                    </Button>
                  ) : (
                    '-'
                  ),
              },
              {
                title: 'Project ID',
                dataIndex: 'project_id',
                copyable: true,
                renderText: (_, record) => renderText(record.project_id),
              },
              {
                title: 'MR IID',
                dataIndex: 'mr_iid',
                copyable: true,
                renderText: (_, record) => renderText(record.mr_iid),
              },
              {
                title: 'Commit SHA',
                dataIndex: 'commit_sha',
                copyable: true,
                span: 2,
                renderText: (_, record) => renderText(record.commit_sha),
              },
              {
                title: 'Flux Revision',
                dataIndex: 'flux_revision',
                copyable: true,
                span: 2,
                renderText: (_, record) => renderText(record.flux_revision),
              },
              {
                title: 'Pipeline',
                dataIndex: 'pipeline_url',
                span: 2,
                render: (_, record) =>
                  record.pipeline_url ? (
                    <Button
                      href={record.pipeline_url}
                      icon={<LinkOutlined />}
                      rel="noreferrer"
                      size="small"
                      target="_blank"
                      type="link"
                    >
                      查看 Pipeline
                    </Button>
                  ) : (
                    '-'
                  ),
              },
            ]}
          />

          <ProDescriptions<API.GitOpsRelease>
            column={2}
            dataSource={release}
            title="应用与环境"
            columns={[
              {
                title: '应用',
                dataIndex: ['application', 'display_name'],
                renderText: (_, record) =>
                  renderText(
                    record.application?.display_name ||
                      record.application?.name,
                  ),
              },
              {
                title: '环境',
                dataIndex: ['environment', 'name'],
                renderText: (_, record) =>
                  renderText(record.environment?.name || record.environment_id),
              },
              {
                title: '环境等级',
                dataIndex: ['environment', 'tier'],
                render: (_, record) => (
                  <EnvironmentTierTag tier={record.environment?.tier} />
                ),
              },
              {
                title: '命名空间',
                dataIndex: ['environment', 'namespace'],
                renderText: (_, record) =>
                  renderText(record.environment?.namespace),
              },
              {
                title: '自动审批',
                dataIndex: ['environment', 'auto_approve'],
                renderText: (_, record) =>
                  renderBoolean(record.environment?.auto_approve),
              },
              {
                title: '允许自审批',
                dataIndex: ['environment', 'allow_self_approve'],
                renderText: (_, record) =>
                  renderBoolean(record.environment?.allow_self_approve),
              },
              {
                title: '签名要求',
                dataIndex: ['environment', 'require_signed_image'],
                renderText: (_, record) =>
                  renderBoolean(record.environment?.require_signed_image),
              },
              {
                title: 'Flux 资源',
                dataIndex: ['environment', 'flux_kustomization'],
                renderText: (_, record) =>
                  renderText(
                    record.environment?.flux_kustomization ||
                      record.environment?.flux_helm_release,
                  ),
              },
            ]}
          />
        </Space>
      ) : null}
    </Drawer>
  );
};

export default ReleaseDetailDrawer;
