import { Avatar, Skeleton } from 'antd';
import { useIntl } from '@umijs/max';
import useStyles from '../style.style';

type PageHeaderContentProps = {
  currentUser: Partial<API.CurrentUser>;
};

const PageHeaderContent = ({ currentUser }: PageHeaderContentProps) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const loaded = Object.keys(currentUser).length > 0;

  if (!loaded) {
    return (
      <Skeleton
        active
        avatar
        paragraph={{
          rows: 1,
        }}
      />
    );
  }

  return (
    <div className={styles.pageHeaderContent}>
      <div className={styles.avatar}>
        <Avatar size="large" src={currentUser.avatar} />
      </div>
      <div className={styles.content}>
        <div className={styles.contentTitle}>
          {intl.formatMessage(
            {
              id: 'pages.home.greeting',
              defaultMessage: '早安，{name}，祝你开心每一天！',
            },
            {
              name: currentUser.nickname || currentUser.username || '',
            },
          )}
        </div>
        <div>
          {currentUser.is_admin ? 'Admin' : 'Member'}
          {' | '}
          {currentUser.email || '-'}
        </div>
      </div>
    </div>
  );
};

export default PageHeaderContent;
