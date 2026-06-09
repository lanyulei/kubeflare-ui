import { ProDescriptions } from '@ant-design/pro-components';
import { Drawer, Space, Tag, Typography } from 'antd';
import { KeyValueList, SectionTitle } from '@/components';
import { ensureStringList } from '../utils';
import { AgentTypeTags, EnabledTag } from './AgentTags';

type SkillDetailDrawerProps = {
  open: boolean;
  skill?: API.AgentSkillDefinition;
  onClose: () => void;
};

const renderTags = (items?: string[] | null, emptyText = '未设置') => {
  const normalizedItems = ensureStringList(items);

  return normalizedItems.length ? (
    <Space size={[0, 6]} wrap>
      {normalizedItems.map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
    </Space>
  ) : (
    <Typography.Text type="secondary">{emptyText}</Typography.Text>
  );
};

const SkillDetailDrawer = ({
  open,
  skill,
  onClose,
}: SkillDetailDrawerProps) => (
  <Drawer
    destroyOnHidden
    open={open}
    title={skill ? `${skill.name} / ${skill.id}` : '技能详情'}
    width="58vw"
    onClose={onClose}
  >
    {skill ? (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <ProDescriptions
          column={2}
          dataSource={skill}
          columns={[
            { title: '技能 ID', dataIndex: 'id', copyable: true, span: 2 },
            { title: '名称', dataIndex: 'name' },
            {
              title: '状态',
              dataIndex: 'enabled',
              render: (_, record) => <EnabledTag enabled={record.enabled} />,
            },
            { title: '描述', dataIndex: 'description', span: 2 },
            {
              title: '适用 Agent',
              dataIndex: 'agent_types',
              span: 2,
              render: (_, record) => (
                <AgentTypeTags values={record.agent_types} />
              ),
            },
          ]}
        />
        <div>
          <SectionTitle>触发词</SectionTitle>
          {renderTags(skill.triggers, '未设置触发词')}
        </div>
        <div>
          <SectionTitle>允许工具</SectionTitle>
          {renderTags(skill.allowed_tools, '不收窄工具集')}
        </div>
        <div>
          <SectionTitle>系统提示词</SectionTitle>
          <Typography.Paragraph>
            {skill.system_prompt || '未设置系统提示词'}
          </Typography.Paragraph>
        </div>
        <div>
          <SectionTitle>排查步骤</SectionTitle>
          <KeyValueList
            keyLabel=""
            valueLabel=""
            items={ensureStringList(skill.hints).map((hint, index) => ({
              key: `${index + 1}`,
              value: hint,
            }))}
          />
        </div>
      </Space>
    ) : null}
  </Drawer>
);

export default SkillDetailDrawer;
