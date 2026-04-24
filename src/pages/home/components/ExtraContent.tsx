import { Statistic } from 'antd';
import { useIntl } from '@umijs/max';
import useStyles from '../style.style';

const ExtraContent = () => {
  const intl = useIntl();
  const { styles } = useStyles();

  return (
    <div className={styles.extraContent}>
      <div className={styles.statItem}>
        <Statistic
          title={intl.formatMessage({
            id: 'pages.home.stats.projects',
            defaultMessage: '项目数',
          })}
          value={56}
        />
      </div>
      <div className={styles.statItem}>
        <Statistic
          title={intl.formatMessage({
            id: 'pages.home.stats.rank',
            defaultMessage: '团队内排名',
          })}
          value={8}
          suffix="/ 24"
        />
      </div>
      <div className={styles.statItem}>
        <Statistic
          title={intl.formatMessage({
            id: 'pages.home.stats.visits',
            defaultMessage: '项目访问',
          })}
          value={2223}
        />
      </div>
    </div>
  );
};

export default ExtraContent;
