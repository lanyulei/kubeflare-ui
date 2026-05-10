import {
  ClusterOutlined,
  DownOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Empty, Input, Pagination, Spin, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { getClusterNodePodList } from '@/services/kubeflare/cluster/node';

const useStyles = createStyles(({ token }) => ({
  pods: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,

    '@media (max-width: 576px)': {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
  search: {
    width: 260,

    '@media (max-width: 576px)': {
      width: '100%',
    },
  },
  refreshButton: {
    flex: '0 0 auto',
    color: token.colorTextSecondary,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  item: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(160px, 360px) 40px',
    alignItems: 'center',
    minHeight: 62,
    padding: `0 ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    color: token.colorText,
    lineHeight: 1.5,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
      rowGap: token.marginXS,
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
    },
  },
  main: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginMD,
  },
  icon: {
    position: 'relative',
    flex: '0 0 auto',
    width: 42,
    height: 42,
    color: token.colorTextSecondary,
    fontSize: 34,
    lineHeight: '42px',
    textAlign: 'center',
  },
  iconBadge: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 13,
    height: 13,
    border: `2px solid ${token.colorBgContainer}`,
    borderRadius: '50%',
    backgroundColor: token.colorSuccess,
  },
  content: {
    minWidth: 0,
  },
  name: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    marginTop: 3,
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  ip: {
    minWidth: 0,

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
      paddingLeft: 50,
    },
  },
  ipValue: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  ipLabel: {
    marginTop: 3,
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  action: {
    justifySelf: 'end',
    color: token.colorTextSecondary,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: token.paddingXXS,
    color: token.colorTextTertiary,
    fontSize: 13,

    '.ant-pagination-simple-pager input': {
      border: 0,
      boxShadow: 'none',
    },

    '.ant-pagination-prev .ant-pagination-item-link, .ant-pagination-next .ant-pagination-item-link':
      {
        border: 0,
        boxShadow: 'none',
      },

    '@media (max-width: 768px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      gap: token.marginSM,
    },
  },
}));

type PodsProps = {
  nodeName?: string;
};

const PAGE_SIZE = 10;

const formatCreateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : value;
};

const Pods = ({ nodeName }: PodsProps) => {
  const { styles } = useStyles();
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [current, setCurrent] = useState(1);
  const [pods, setPods] = useState<API.ClusterNodePodItem[]>([]);

  const fetchPods = async () => {
    if (!nodeName) {
      setPods([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getClusterNodePodList({ nodeName });
      setPods(res.data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPods();
  }, [nodeName]);

  const filteredPods = useMemo(() => {
    const nextKeyword = keyword.trim().toLowerCase();

    if (!nextKeyword) {
      return pods;
    }

    return pods.filter((pod) =>
      [pod.name, pod.namespace, pod.pod_ip]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(nextKeyword)),
    );
  }, [keyword, pods]);

  const pagedPods = useMemo(() => {
    const start = (current - 1) * PAGE_SIZE;
    return filteredPods.slice(start, start + PAGE_SIZE);
  }, [current, filteredPods]);

  useEffect(() => {
    setCurrent(1);
  }, [keyword]);

  return (
    <div className={styles.pods}>
      <div className={styles.toolbar}>
        <Input
          allowClear
          className={styles.search}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索容器组名称 / 命名空间 / IP 地址"
          suffix={<SearchOutlined />}
          value={keyword}
        />
        <Tooltip title="刷新">
          <Button
            aria-label="刷新容器组"
            className={styles.refreshButton}
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchPods}
            type="text"
          />
        </Tooltip>
      </div>
      <Spin spinning={loading}>
        {filteredPods.length > 0 ? (
          <div className={styles.list}>
            {pagedPods.map((pod) => (
              <div className={styles.item} key={pod.id || pod.name}>
                <div className={styles.main}>
                  <div className={styles.icon}>
                    <ClusterOutlined />
                    <span className={styles.iconBadge} />
                  </div>
                  <div className={styles.content}>
                    <Tooltip title={pod.name} placement="topLeft">
                      <div className={styles.name}>{pod.name}</div>
                    </Tooltip>
                    <div className={styles.meta}>
                      创建于 {formatCreateTime(pod.create_time)}
                    </div>
                  </div>
                </div>
                <div className={styles.ip}>
                  <Tooltip title={pod.pod_ip || '-'} placement="topLeft">
                    <div className={styles.ipValue}>{pod.pod_ip || '-'}</div>
                  </Tooltip>
                  <div className={styles.ipLabel}>容器组 IP 地址</div>
                </div>
                <Button
                  aria-label="展开容器组详情"
                  className={styles.action}
                  icon={<DownOutlined />}
                  type="text"
                />
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
      <div className={styles.footer}>
        <span>总数：{filteredPods.length}</span>
        <Pagination
          current={current}
          pageSize={PAGE_SIZE}
          showSizeChanger={false}
          total={filteredPods.length}
          onChange={setCurrent}
          size='small'
        />
      </div>
    </div>
  );
};

export default Pods;
