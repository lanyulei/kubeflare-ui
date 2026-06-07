import type { DrawerProps } from 'antd';
import { Drawer } from 'antd';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import type { MouseEventHandler, ReactNode } from 'react';
import { useState } from 'react';

const useStyles = createStyles(({ token }) => ({
  action: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
    padding: 4,
    border: 0,
    color: 'inherit',
    cursor: 'pointer',
    background: 'transparent',
    borderRadius: token.borderRadius,
    transition: `background-color ${token.motionDurationMid}`,
    fontSize: 18,
    lineHeight: 1,
    textDecoration: 'none',

    '&:hover': {
      color: 'inherit',
      backgroundColor: token.colorBgTextHover,
    },

    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimary}`,
      outlineOffset: 2,
    },
  },
  actionDisabled: {
    color: token.colorTextDisabled,
    cursor: 'not-allowed',

    '&:hover': {
      color: token.colorTextDisabled,
      backgroundColor: 'transparent',
    },
  },
}));

type BaseHeaderActionButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
  onClick?: MouseEventHandler<HTMLElement>;
};

type HeaderActionButtonAsButtonProps = BaseHeaderActionButtonProps & {
  href?: undefined;
  type?: 'button' | 'reset' | 'submit';
};

type HeaderActionButtonAsLinkProps = BaseHeaderActionButtonProps & {
  href: string;
  rel?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
};

export type HeaderActionButtonProps =
  | HeaderActionButtonAsButtonProps
  | HeaderActionButtonAsLinkProps;

const isLinkAction = (
  props: HeaderActionButtonProps,
): props is HeaderActionButtonAsLinkProps =>
  'href' in props && typeof props.href === 'string';

export const HeaderActionButton = (props: HeaderActionButtonProps) => {
  const { children, className, disabled, label, onClick } = props;
  const { styles } = useStyles();
  const handleClick: MouseEventHandler<HTMLElement> = (event) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onClick?.(event);
  };
  const actionClassName = classNames(
    styles.action,
    disabled && styles.actionDisabled,
    className,
  );

  if (isLinkAction(props)) {
    const { href, rel, target } = props;
    const safeRel = target === '_blank' ? rel || 'noreferrer' : rel;

    return (
      <a
        aria-disabled={disabled}
        aria-label={label}
        className={actionClassName}
        href={disabled ? undefined : href}
        rel={safeRel}
        tabIndex={disabled ? -1 : undefined}
        target={target}
        title={label}
        onClick={handleClick as MouseEventHandler<HTMLAnchorElement>}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      aria-label={label}
      className={actionClassName}
      disabled={disabled}
      title={label}
      type={props.type || 'button'}
      onClick={handleClick as MouseEventHandler<HTMLButtonElement>}
    >
      {children}
    </button>
  );
};

export type HeaderActionDrawerProps = {
  children?: ReactNode;
  drawerProps?: Omit<DrawerProps, 'onClose' | 'open' | 'title'>;
  icon: ReactNode;
  label?: string;
  title: ReactNode;
};

export const HeaderActionDrawer = ({
  children,
  drawerProps,
  icon,
  label,
  title,
}: HeaderActionDrawerProps) => {
  const [open, setOpen] = useState(false);
  const actionLabel = label || (typeof title === 'string' ? title : '');

  return (
    <>
      <HeaderActionButton label={actionLabel} onClick={() => setOpen(true)}>
        {icon}
      </HeaderActionButton>
      <Drawer
        destroyOnHidden
        placement="right"
        {...drawerProps}
        open={open}
        title={title}
        onClose={() => setOpen(false)}
      >
        {children}
      </Drawer>
    </>
  );
};
