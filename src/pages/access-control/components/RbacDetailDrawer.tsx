import { ProDescriptions } from '@ant-design/pro-components';
import { Drawer, Space, Tag, Typography } from 'antd';
import { KeyValueList } from '@/components';
import { getBindingScopeText, getSubjectText } from '../utils';
import PolicyRuleTable from './PolicyRuleTable';
import RiskLevelTag from './RiskLevelTag';

type RbacDetailDrawerProps = {
  open: boolean;
  item?: API.RbacRoleItem | API.RbacBindingItem;
  onClose: () => void;
};

const isRole = (
  item?: API.RbacRoleItem | API.RbacBindingItem,
): item is API.RbacRoleItem =>
  item?.type === 'Role' || item?.type === 'ClusterRole';

const RbacDetailDrawer = ({ open, item, onClose }: RbacDetailDrawerProps) => {
  const title = item ? `${item.type} / ${item.name}` : 'RBAC 详情';

  return (
    <Drawer
      destroyOnHidden
      open={open}
      title={title}
      width="58vw"
      onClose={onClose}
    >
      {item ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <ProDescriptions
            column={2}
            dataSource={item}
            columns={[
              { title: '名称', dataIndex: 'name' },
              { title: '类型', dataIndex: 'type' },
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
              {
                title: '系统资源',
                dataIndex: 'system',
                renderText: (_, record) => (record.system ? '是' : '否'),
              },
              {
                title: '创建时间',
                dataIndex: 'create_time',
                valueType: 'dateTime',
              },
            ]}
          />
          {isRole(item) ? (
            <>
              <Typography.Title level={5}>权限规则</Typography.Title>
              <PolicyRuleTable rules={item.rules} />
            </>
          ) : (
            <>
              <Typography.Title level={5}>绑定关系</Typography.Title>
              <KeyValueList
                keyLabel=""
                valueLabel=""
                items={[
                  { key: '授权范围', value: getBindingScopeText(item) },
                  {
                    key: '引用角色',
                    value: `${item.roleRef?.kind || '-'}:${item.roleRef?.name || '-'}`,
                  },
                  {
                    key: '主体',
                    value: (
                      <Space size={[0, 6]} wrap>
                        {item.subjects.map((subject) => (
                          <Tag key={getSubjectText(subject)}>
                            {getSubjectText(subject)}
                          </Tag>
                        ))}
                      </Space>
                    ),
                  },
                ]}
              />
              <Typography.Title level={5}>风险说明</Typography.Title>
              <KeyValueList
                keyLabel=""
                valueLabel=""
                items={(item.risk_reasons.length
                  ? item.risk_reasons
                  : ['未发现高风险配置']
                ).map((reason, index) => ({
                  key: `${index + 1}`,
                  value: reason,
                }))}
              />
            </>
          )}
        </Space>
      ) : null}
    </Drawer>
  );
};

export default RbacDetailDrawer;
