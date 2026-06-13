import { AuditOutlined, RollbackOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Alert, Button, Drawer, Space, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import {
  getAgentRuntimeConfigAuditList,
  getAgentRuntimeConfigVersionList,
} from '@/services/kubeflare/agent';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import { prettyJson } from '../utils';
import JsonCodeBlock from './JsonCodeBlock';

const HISTORY_LIMIT = 100;

type RuntimeHistoryDrawerProps = {
  open: boolean;
  rollingBack?: boolean;
  refreshKey?: number;
  onClose: () => void;
  onRollback: (version: API.AgentRuntimeConfigVersion) => void;
};

const ACTION_TEXT: Record<string, string> = {
  reload: '变更',
  reset: '回滚启动',
  rollback: '版本回滚',
};

const CHANGE_TEXT: Record<string, string> = {
  add: '新增',
  remove: '移除',
  update: '更新',
};

const formatTime = (value?: string) =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';

const renderActionTag = (action?: string) => {
  const color =
    action === 'reset' ? 'orange' : action === 'rollback' ? 'purple' : 'blue';
  return <Tag color={color}>{ACTION_TEXT[action || ''] || action || '-'}</Tag>;
};

const renderDiffSummary = (diff?: API.AgentRuntimeConfigDiff) => {
  const toolChanges = diff?.tool_changes || [];
  const skillChanges = diff?.skill_changes || [];
  const changeTypes = [...toolChanges, ...skillChanges].reduce<
    Record<string, number>
  >((counts, item) => {
    counts[item.change_type] = (counts[item.change_type] || 0) + 1;
    return counts;
  }, {});

  return (
    <Space size={[0, 6]} wrap>
      <Tag color={toolChanges.length ? 'blue' : undefined}>
        工具 {toolChanges.length}
      </Tag>
      <Tag color={skillChanges.length ? 'green' : undefined}>
        技能 {skillChanges.length}
      </Tag>
      {Object.entries(changeTypes).map(([type, count]) => (
        <Tag key={type}>
          {CHANGE_TEXT[type] || type} {count}
        </Tag>
      ))}
    </Space>
  );
};

const RuntimeHistoryDrawer = ({
  open,
  rollingBack = false,
  refreshKey,
  onClose,
  onRollback,
}: RuntimeHistoryDrawerProps) => {
  const versionActionRef = useRef<ActionType | null>(null);
  const auditActionRef = useRef<ActionType | null>(null);
  const [activeTab, setActiveTab] = useState('version');
  const [auditVersionID, setAuditVersionID] = useState<string>();

  useEffect(() => {
    if (open) {
      versionActionRef.current?.reload();
    }
  }, [open, refreshKey]);

  useEffect(() => {
    if (open) {
      auditActionRef.current?.reload();
    }
  }, [auditVersionID, open, refreshKey]);

  const openVersionAudit = (versionID: string) => {
    setAuditVersionID(versionID);
    setActiveTab('audit');
  };

  const closeDrawer = () => {
    setAuditVersionID(undefined);
    setActiveTab('version');
    onClose();
  };

  const versionColumns: ProColumns<API.AgentRuntimeConfigVersion>[] = [
    {
      title: '版本',
      dataIndex: 'version',
      width: 90,
      render: (_, record) => (
        <Typography.Text>#{record.version}</Typography.Text>
      ),
    },
    {
      title: '操作者',
      dataIndex: 'operator_id',
      width: 160,
      ellipsis: true,
    },
    {
      title: 'Diff',
      dataIndex: 'diff',
      width: 260,
      render: (_, record) => renderDiffSummary(record.diff),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      ellipsis: true,
      renderText: (value) => value || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      renderText: (value) => formatTime(value),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="audit"
          type="link"
          size="small"
          icon={<AuditOutlined />}
          onClick={() => openVersionAudit(record.id)}
        >
          审计
        </Button>,
        <Button
          key="rollback"
          type="link"
          size="small"
          icon={<RollbackOutlined />}
          loading={rollingBack}
          onClick={() => onRollback(record)}
        >
          回滚
        </Button>,
      ],
    },
  ];

  const auditColumns: ProColumns<API.AgentRuntimeConfigAudit>[] = [
    {
      title: '动作',
      dataIndex: 'action',
      width: 110,
      render: (_, record) => renderActionTag(record.action),
    },
    {
      title: '版本 ID',
      dataIndex: 'version_id',
      width: 220,
      ellipsis: true,
      copyable: true,
    },
    {
      title: '操作者',
      dataIndex: 'operator_id',
      width: 160,
      ellipsis: true,
    },
    {
      title: 'Diff',
      dataIndex: 'diff',
      width: 260,
      render: (_, record) => renderDiffSummary(record.diff),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      ellipsis: true,
      renderText: (value) => value || '-',
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      width: 180,
      renderText: (value) => formatTime(value),
    },
  ];
  const comfortableVersionColumns = withComfortableTableColumns(versionColumns);
  const comfortableAuditColumns = withComfortableTableColumns(auditColumns);

  return (
    <Drawer
      destroyOnHidden
      open={open}
      title="运行时配置历史"
      width="72vw"
      onClose={closeDrawer}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'version',
            label: '版本',
            children: (
              <ProTable<API.AgentRuntimeConfigVersion>
                rowKey="id"
                actionRef={versionActionRef}
                columns={comfortableVersionColumns}
                options={false}
                pagination={false}
                search={false}
                size="small"
                scroll={getComfortableTableScroll(comfortableVersionColumns, {
                  x: 1100,
                })}
                request={async () => {
                  const res = await getAgentRuntimeConfigVersionList(
                    { limit: HISTORY_LIMIT },
                    { skipErrorHandler: true },
                  );
                  const items = res.data.items || [];
                  return { data: items, success: true, total: items.length };
                }}
                expandable={{
                  expandedRowRender: (record) => (
                    <JsonCodeBlock value={prettyJson(record.diff)} />
                  ),
                }}
              />
            ),
          },
          {
            key: 'audit',
            label: auditVersionID ? '审计（已筛选）' : '审计',
            children: (
              <Space
                direction="vertical"
                size="middle"
                style={{ width: '100%' }}
              >
                {auditVersionID ? (
                  <Alert
                    showIcon
                    type="info"
                    message={
                      <Space wrap>
                        <span>仅查看版本 {auditVersionID} 的审计记录</span>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => setAuditVersionID(undefined)}
                        >
                          查看全部
                        </Button>
                      </Space>
                    }
                  />
                ) : null}
                <ProTable<API.AgentRuntimeConfigAudit>
                  rowKey="id"
                  actionRef={auditActionRef}
                  columns={comfortableAuditColumns}
                  options={false}
                  pagination={false}
                  search={false}
                  size="small"
                  scroll={getComfortableTableScroll(comfortableAuditColumns, {
                    x: 1100,
                  })}
                  request={async () => {
                    const params = auditVersionID
                      ? { limit: HISTORY_LIMIT, version_id: auditVersionID }
                      : { limit: HISTORY_LIMIT };
                    const res = await getAgentRuntimeConfigAuditList(params, {
                      skipErrorHandler: true,
                    });
                    const items = res.data.items || [];
                    return { data: items, success: true, total: items.length };
                  }}
                  expandable={{
                    expandedRowRender: (record) => (
                      <JsonCodeBlock value={prettyJson(record.diff)} />
                    ),
                  }}
                />
              </Space>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default RuntimeHistoryDrawer;
