import { ProDescriptions } from '@ant-design/pro-components';
import { Drawer, Space, Tag, Typography } from 'antd';
import { KeyValueList, SectionTitle } from '@/components';
import { ensureStringList } from '../utils';
import { AgentTypeTags, EnabledTag } from './AgentTags';

type AgentDetailDrawerProps = {
  agent?: API.AgentDefinition;
  open: boolean;
  onClose: () => void;
};

const AgentDetailDrawer = ({
  agent,
  open,
  onClose,
}: AgentDetailDrawerProps) => {
  const capabilities = ensureStringList(agent?.capabilities);
  const defaultTools = ensureStringList(agent?.default_tools);

  return (
    <Drawer
      destroyOnHidden
      open={open}
      title={agent ? `${agent.name} / ${agent.type}` : 'Agent 详情'}
      width="58vw"
      onClose={onClose}
    >
      {agent ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <ProDescriptions
            column={2}
            dataSource={agent}
            columns={[
              { title: '名称', dataIndex: 'name' },
              { title: '类型', dataIndex: 'type' },
              { title: '版本', dataIndex: 'version' },
              {
                title: '状态',
                dataIndex: 'available',
                render: (_, record) => (
                  <EnabledTag enabled={record.available} />
                ),
              },
              { title: '描述', dataIndex: 'description', span: 2 },
            ]}
          />
          <div>
            <SectionTitle>能力</SectionTitle>
            <Space size={[0, 6]} wrap>
              {capabilities.length ? (
                capabilities.map((item) => <Tag key={item}>{item}</Tag>)
              ) : (
                <Typography.Text type="secondary">暂无能力声明</Typography.Text>
              )}
            </Space>
          </div>
          <div>
            <SectionTitle>默认工具</SectionTitle>
            <KeyValueList
              keyLabel=""
              valueLabel=""
              items={defaultTools.map((toolID, index) => ({
                key: `${index + 1}`,
                value: toolID,
              }))}
            />
          </div>
          <div>
            <SectionTitle>适用类型</SectionTitle>
            <AgentTypeTags values={[agent.type]} />
          </div>
        </Space>
      ) : null}
    </Drawer>
  );
};

export default AgentDetailDrawer;
