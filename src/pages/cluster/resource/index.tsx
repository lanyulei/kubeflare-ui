import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Empty } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  placeholder: {
    display: 'flex',
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: token.borderRadiusLG,
    background: token.colorBgContainer,
  },
}));

type ClusterResourcePageProps = {
  titleId: string;
  defaultTitle: string;
};

const ClusterResourcePage = ({
  titleId,
  defaultTitle,
}: ClusterResourcePageProps) => {
  const { styles } = useStyles();
  const intl = useIntl();
  const title = intl.formatMessage({
    id: titleId,
    defaultMessage: defaultTitle,
  });

  return (
    <PageContainer title={title}>
      <div className={styles.placeholder}>
        <Empty description={title} />
      </div>
    </PageContainer>
  );
};

export default ClusterResourcePage;
