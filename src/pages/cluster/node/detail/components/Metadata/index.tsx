import { Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { KeyValueList, SectionTitle } from '@/components';

const useStyles = createStyles(({ token }) => ({
  metadata: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  labelList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: token.marginSM,
  },
  labelItem: {
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: '100%',
    overflow: 'hidden',
    borderRadius: token.borderRadiusSM,
    color: token.colorText,
    fontSize: 13,
    lineHeight: '22px',
  },
  labelKey: {
    flex: '0 1 auto',
    minWidth: 0,
    maxWidth: 260,
    padding: `0 ${token.paddingXS}px`,
    overflow: 'hidden',
    borderRadius: `${token.borderRadiusSM}px 0 0 ${token.borderRadiusSM}px`,
    backgroundColor: '#36435C',
    color: token.colorWhite,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  labelValue: {
    flex: '0 1 auto',
    minWidth: 0,
    maxWidth: 180,
    padding: `0 ${token.paddingXS}px`,
    overflow: 'hidden',
    borderRadius: `0 ${token.borderRadiusSM}px ${token.borderRadiusSM}px 0`,
    backgroundColor: token.colorFillTertiary,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

type MetadataProps = {
  node?: API.ClusterNodeItem;
};

const getEntries = (data?: Record<string, string>) =>
  Object.entries(data || {}).filter(([key]) => Boolean(key));

const NodeMetadata = ({ node }: MetadataProps) => {
  const { styles } = useStyles();
  const labels = getEntries(node?.labels);
  const annotations = getEntries(node?.annotations);

  if (!node) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className={styles.metadata}>
      <div>
        <SectionTitle color={'#36435C'} fontSize={12}>
          标签
        </SectionTitle>
        {labels.length > 0 ? (
          <div className={styles.labelList}>
            {labels.map(([key, value]) => (
              <Tooltip title={`${key} ${value}`} key={key}>
                <span className={styles.labelItem}>
                  <span className={styles.labelKey}>{key}</span>
                  <span className={styles.labelValue}>{value || '-'}</span>
                </span>
              </Tooltip>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
      <div>
        <SectionTitle color={'#36435C'} fontSize={12}>
          注解
        </SectionTitle>
        <KeyValueList
          items={annotations.map(([key, value]) => ({ key, value }))}
        />
      </div>
    </div>
  );
};

export default NodeMetadata;
