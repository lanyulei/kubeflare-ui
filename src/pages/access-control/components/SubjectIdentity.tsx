import { Space, Tag, Tooltip, Typography } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  identity: {
    minWidth: 0,
  },
  main: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginXS,
  },
  kind: {
    flex: '0 0 auto',
    marginInlineEnd: 0,
  },
  nameText: {
    display: 'block',
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    marginTop: token.marginXXS,
  },
  namespace: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
}));

type SubjectIdentityProps = {
  link?: boolean;
  showNamespace?: boolean;
  subject: Pick<API.RbacSubjectItem, 'kind' | 'name' | 'namespace'>;
  onClick?: () => void;
};

const SUBJECT_KIND_COLOR: Record<API.RbacSubjectKind, string> = {
  ServiceAccount: 'blue',
  User: 'green',
  Group: 'purple',
};

const SubjectIdentity = ({
  link,
  showNamespace = true,
  subject,
  onClick,
}: SubjectIdentityProps) => {
  const { styles } = useStyles();
  const nameNode = link ? (
    <Typography.Link className={styles.nameText} onClick={onClick}>
      {subject.name}
    </Typography.Link>
  ) : (
    <Typography.Text className={styles.nameText}>
      {subject.name}
    </Typography.Text>
  );

  return (
    <div className={styles.identity}>
      <div className={styles.main}>
        <Tag className={styles.kind} color={SUBJECT_KIND_COLOR[subject.kind]}>
          {subject.kind}
        </Tag>
        <Tooltip title={subject.name} placement="topLeft">
          {nameNode}
        </Tooltip>
      </div>
      {showNamespace ? (
        <Space className={styles.meta} size={6} wrap>
          <span className={styles.namespace}>
            {subject.namespace
              ? `命名空间：${subject.namespace}`
              : '全集群主体'}
          </span>
        </Space>
      ) : null}
    </div>
  );
};

export type { SubjectIdentityProps };
export default SubjectIdentity;
