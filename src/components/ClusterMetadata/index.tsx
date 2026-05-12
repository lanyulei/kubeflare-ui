import { Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import KeyValueList from '../KeyValueList';
import SectionTitle from '../SectionTitle';

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

type ClusterMetadataProps = {
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  labelTitle?: string;
  annotationTitle?: string;
};

const getEntries = (data?: Record<string, string>) =>
  Object.entries(data || {}).filter(([key]) => Boolean(key));

const ClusterMetadata = ({
  labels,
  annotations,
  labelTitle = '标签',
  annotationTitle = '注解',
}: ClusterMetadataProps) => {
  const { styles } = useStyles();
  const labelEntries = getEntries(labels);
  const annotationEntries = getEntries(annotations);

  return (
    <div className={styles.metadata}>
      <div>
        <SectionTitle color={'#36435C'} fontSize={12}>
          {labelTitle}
        </SectionTitle>
        {labelEntries.length > 0 ? (
          <div className={styles.labelList}>
            {labelEntries.map(([key, value]) => (
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
          {annotationTitle}
        </SectionTitle>
        <KeyValueList
          items={annotationEntries.map(([key, value]) => ({ key, value }))}
        />
      </div>
    </div>
  );
};

export type { ClusterMetadataProps };
export default ClusterMetadata;
