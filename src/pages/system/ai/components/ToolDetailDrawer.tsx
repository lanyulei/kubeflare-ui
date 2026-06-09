import { ProDescriptions } from '@ant-design/pro-components';
import { Drawer, Space } from 'antd';
import { SectionTitle } from '@/components';
import { prettyJson } from '../utils';
import {
  AgentTypeTags,
  EnabledTag,
  ReadOnlyTag,
  ToolOriginTag,
  ToolSourceTag,
} from './AgentTags';
import JsonCodeBlock from './JsonCodeBlock';

type ToolDetailDrawerProps = {
  open: boolean;
  tool?: API.AgentToolDefinition;
  onClose: () => void;
};

const ToolDetailDrawer = ({ open, tool, onClose }: ToolDetailDrawerProps) => {
  return (
    <Drawer
      destroyOnHidden
      open={open}
      title={tool ? `${tool.name} / ${tool.id}` : '工具详情'}
      width="62vw"
      onClose={onClose}
    >
      {tool ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <ProDescriptions
            column={2}
            dataSource={tool}
            columns={[
              { title: '工具 ID', dataIndex: 'id', copyable: true, span: 2 },
              { title: '名称', dataIndex: 'name' },
              { title: '分类', dataIndex: 'category' },
              {
                title: '启用状态',
                dataIndex: 'enabled',
                render: (_, record) => <EnabledTag enabled={record.enabled} />,
              },
              {
                title: '读写属性',
                dataIndex: 'read_only',
                render: (_, record) => (
                  <ReadOnlyTag readOnly={record.read_only} />
                ),
              },
              {
                title: '数据源',
                dataIndex: 'source',
                render: (_, record) => <ToolSourceTag value={record.source} />,
              },
              {
                title: '来源',
                dataIndex: 'origin',
                render: (_, record) => <ToolOriginTag value={record.origin} />,
              },
              {
                title: '超时',
                dataIndex: 'timeout_ms',
                renderText: (_, record) => `${record.timeout_ms} ms`,
              },
              { title: '最大字节', dataIndex: 'max_bytes' },
              {
                title: 'Agent 类型',
                dataIndex: 'agent_types',
                span: 2,
                render: (_, record) => (
                  <AgentTypeTags values={record.agent_types} />
                ),
              },
              { title: '描述', dataIndex: 'description', span: 2 },
            ]}
          />
          <div>
            <SectionTitle>参数 Schema</SectionTitle>
            <JsonCodeBlock value={prettyJson(tool.parameters)} />
          </div>
        </Space>
      ) : null}
    </Drawer>
  );
};

export default ToolDetailDrawer;
