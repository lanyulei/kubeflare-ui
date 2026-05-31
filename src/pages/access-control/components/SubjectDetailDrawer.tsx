import { ProDescriptions } from '@ant-design/pro-components';
import { Drawer, Space, Statistic, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { KeyValueList } from '@/components';
import RiskLevelTag from './RiskLevelTag';
import SubjectIdentity from './SubjectIdentity';
import SubjectPermissionPanel from './SubjectPermissionPanel';

const useStyles = createStyles(({ token }) => ({
  stack: {
    width: '100%',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: token.marginSM,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  statCard: {
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorFillAlter,
  },
  sectionTitle: {
    marginBottom: token.marginSM,
  },
  permissionSection: {
    '.ant-pro-card .ant-pro-card-body': {
      paddingInline: 0,
      paddingBlock: 0,
    },
  },
}));

type SubjectDetailDrawerProps = {
  open: boolean;
  subject?: API.RbacSubjectItem;
  onClose: () => void;
};

const getSubjectQuery = (
  subject?: API.RbacSubjectItem,
): API.RbacSubjectQuery | undefined =>
  subject
    ? {
        kind: subject.kind,
        name: subject.name,
        namespace: subject.namespace,
      }
    : undefined;

const SubjectDetailDrawer = ({
  open,
  subject,
  onClose,
}: SubjectDetailDrawerProps) => {
  const { styles } = useStyles();
  const title = subject ? `${subject.kind} / ${subject.name}` : '主体详情';

  return (
    <Drawer
      destroyOnHidden
      open={open}
      title={title}
      width="min(960px, 100vw)"
      onClose={onClose}
    >
      {subject ? (
        <Space className={styles.stack} direction="vertical" size="large">
          <SubjectIdentity subject={subject} />
          <div className={styles.summary}>
            <div className={styles.statCard}>
              <Statistic title="绑定数" value={subject.binding_count} />
            </div>
            <div className={styles.statCard}>
              <Statistic
                title="集群级绑定"
                value={subject.cluster_binding_count}
              />
            </div>
            <div className={styles.statCard}>
              <Statistic title="权限规则" value={subject.permission_count} />
            </div>
          </div>
          <ProDescriptions
            column={2}
            dataSource={subject}
            columns={[
              { title: '主体名称', dataIndex: 'name' },
              { title: '主体类型', dataIndex: 'kind' },
              {
                title: '命名空间',
                dataIndex: 'namespace',
                renderText: (_, record) => record.namespace || '全集群',
              },
              {
                title: '风险',
                dataIndex: 'risk_level',
                render: (_, record) => (
                  <RiskLevelTag
                    level={record.risk_level}
                    reasons={record.risk_reasons}
                  />
                ),
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
              items={(subject.risk_reasons.length
                ? subject.risk_reasons
                : ['未发现高风险配置']
              ).map((reason, index) => ({
                key: `${index + 1}`,
                value: reason,
              }))}
            />
          </div>
          <div className={styles.permissionSection}>
            <SubjectPermissionPanel title="最终权限" query={getSubjectQuery(subject)} />
          </div>
        </Space>
      ) : null}
    </Drawer>
  );
};

export type { SubjectDetailDrawerProps };
export default SubjectDetailDrawer;
