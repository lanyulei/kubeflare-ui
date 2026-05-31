import { ProDescriptions } from '@ant-design/pro-components';
import { Drawer, Space, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { KeyValueList } from '@/components';
import RiskLevelTag from './RiskLevelTag';

type RbacRiskDetailDrawerProps = {
  item?: API.RbacAuditItem;
  open: boolean;
  onClose: () => void;
};

const useStyles = createStyles(({ token }) => ({
  stack: {
    width: '100%',
  },
  sectionTitle: {
    marginBottom: token.marginSM,
  },
}));

const splitRiskReasons = (action?: string) =>
  (action || '')
    .split(/[、；;]/)
    .map((item) => item.trim())
    .filter(Boolean);

const getResourceType = (resource?: string) => {
  const [type] = (resource || '').split('/');
  return type || '-';
};

const getResourceName = (resource?: string) => {
  const [, ...names] = (resource || '').split('/');
  return names.join('/') || resource || '-';
};

const RbacRiskDetailDrawer = ({
  item,
  open,
  onClose,
}: RbacRiskDetailDrawerProps) => {
  const { styles } = useStyles();
  const title = item ? `风险详情 / ${item.resource}` : '风险详情';
  const reasons = splitRiskReasons(item?.action);

  return (
    <Drawer
      destroyOnHidden
      open={open}
      title={title}
      width="52vw"
      onClose={onClose}
    >
      {item ? (
        <Space className={styles.stack} direction="vertical" size="large">
          <ProDescriptions
            column={2}
            dataSource={item}
            columns={[
              {
                title: '资源类型',
                dataIndex: 'resource',
                render: (_, record) => (
                  <Tag>{getResourceType(record.resource)}</Tag>
                ),
              },
              {
                title: '资源名称',
                dataIndex: 'resourceName',
                renderText: (_, record) => getResourceName(record.resource),
              },
              {
                title: '命名空间',
                dataIndex: 'namespace',
                renderText: (_, record) => record.namespace || '全集群',
              },
              {
                title: '风险等级',
                dataIndex: 'risk_level',
                render: (_, record) => (
                  <RiskLevelTag level={record.risk_level} />
                ),
              },
              {
                title: '状态',
                dataIndex: 'status',
                renderText: (_, record) => record.status || '-',
              },
              {
                title: '创建时间',
                dataIndex: 'time',
                valueType: 'dateTime',
              },
            ]}
          />
          <div>
            <Typography.Title className={styles.sectionTitle} level={5}>
              风险说明
            </Typography.Title>
            <KeyValueList
              keyLabel=""
              valueLabel=""
              items={(reasons.length ? reasons : ['暂无风险说明']).map(
                (reason, index) => ({
                  key: `${index + 1}`,
                  value: reason,
                }),
              )}
            />
          </div>
        </Space>
      ) : null}
    </Drawer>
  );
};

export type { RbacRiskDetailDrawerProps };
export { splitRiskReasons };
export default RbacRiskDetailDrawer;
