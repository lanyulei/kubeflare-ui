import { CloseOutlined } from '@ant-design/icons';
import { ProDescriptions } from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import { Drawer, Empty, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { stringify } from 'yaml';
import YamlEditor from '../YamlEditor';
import { EventTypeTag } from './EventTypeBadge';
import {
  formatRelativeTime,
  getEventMessage,
  getEventObjectDetailPath,
  getEventObjectText,
} from './eventHelpers';

const useStyles = createStyles(({ token }) => ({
  drawer: {
    '.ant-drawer-header': {
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
    },
    '.ant-drawer-body': {
      padding: token.paddingLG,
      background: token.colorBgContainer,
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  message: {
    padding: token.padding,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorFillQuaternary,
  },
}));

type EventDetailDrawerProps = {
  event?: API.ClusterEventItem;
  open: boolean;
  onClose: () => void;
};

const renderObjectRef = (ref?: API.ClusterEventObjectRef) => {
  const text = getEventObjectText(ref);
  const path = getEventObjectDetailPath(ref);

  if (!path) {
    return text;
  }

  return <Link to={path}>{text}</Link>;
};

const EventDetailDrawer = ({
  event,
  open,
  onClose,
}: EventDetailDrawerProps) => {
  const { styles } = useStyles();

  return (
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      open={open}
      title="事件详情"
      width="64vw"
      onClose={onClose}
    >
      {!event ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className={styles.content}>
          <div className={styles.message}>
            <Typography.Paragraph copyable style={{ marginBottom: 0 }}>
              {getEventMessage(event)}
            </Typography.Paragraph>
          </div>
          <ProDescriptions<API.ClusterEventItem>
            bordered
            column={2}
            dataSource={event}
            size="small"
            title={false}
            columns={[
              {
                title: '类型',
                dataIndex: 'type',
                render: (_, record) => <EventTypeTag type={record.type} />,
              },
              {
                title: '时间',
                dataIndex: 'event_time',
                renderText: (_, record) =>
                  `${formatRelativeTime(record.event_time)}${
                    record.event_time ? `（${record.event_time}）` : ''
                  }`,
              },
              {
                title: '命名空间',
                dataIndex: 'namespace',
                renderText: (_, record) => record.namespace || '-',
              },
              {
                title: '相关对象',
                dataIndex: 'regarding',
                render: (_, record) => renderObjectRef(record.regarding),
              },
              {
                title: '原因',
                dataIndex: 'reason',
                renderText: (_, record) => record.reason || '-',
              },
              {
                title: '动作',
                dataIndex: 'action',
                renderText: (_, record) => record.action || '-',
              },
              {
                title: '来源',
                dataIndex: 'source',
                renderText: (_, record) => record.source || '-',
              },
              {
                title: 'Reporter',
                dataIndex: 'reporting_controller',
                renderText: (_, record) =>
                  record.reporting_controller ||
                  record.reporting_instance ||
                  '-',
              },
              {
                title: '关联对象',
                dataIndex: 'related',
                render: (_, record) => renderObjectRef(record.related),
              },
              {
                title: '次数',
                dataIndex: 'series_count',
                renderText: (_, record) => record.series_count || '-',
              },
              {
                title: 'ResourceVersion',
                dataIndex: 'resource_version',
                renderText: (_, record) => record.resource_version || '-',
              },
            ]}
          />
          <YamlEditor
            height="320px"
            readOnly
            value={stringify(event.raw || {}, { indent: 2 })}
          />
        </div>
      )}
    </Drawer>
  );
};

export default EventDetailDrawer;
