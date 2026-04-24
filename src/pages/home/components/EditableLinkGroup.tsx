import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useIntl } from '@umijs/max';
import { createElement, type ElementType, type ReactNode } from 'react';
import type { QuickLink } from '../types';
import useStyles from '../style.style';

type LinkElementProps = {
  children?: ReactNode;
  href?: string;
  to?: string;
};

type EditableLinkGroupProps = {
  links: QuickLink[];
  onAdd: () => void;
  linkElement?: ElementType<LinkElementProps>;
};

const EditableLinkGroup = ({
  onAdd,
  links,
  linkElement = 'a',
}: EditableLinkGroupProps) => {
  const intl = useIntl();
  const { styles } = useStyles();

  return (
    <div className={styles.linkGroup}>
      {links.map((link) =>
        createElement(
          linkElement,
          {
            key: `linkGroup-item-${link.id ?? link.title}`,
            to: link.href,
            href: link.href,
          },
          link.title,
        ),
      )}
      <Button ghost size="small" type="primary" onClick={onAdd}>
        <PlusOutlined />
        {intl.formatMessage({
          id: 'pages.home.quickLinks.add',
          defaultMessage: '添加',
        })}
      </Button>
    </div>
  );
};

export default EditableLinkGroup;
