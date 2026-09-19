import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "light" | "ghost-light";

type Common = {
  variant?: Variant;
  icon?: IconName;
  children: ReactNode;
  className?: string;
};

type AsLink = Common & { href: string; external?: boolean } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

/** Botão em pílula do design system Atlas. Renderiza <a>/<Link> quando recebe `href`. */
export function Button(props: AsLink | AsButton) {
  const { variant = "primary", icon, children, className } = props;
  const cls = [styles.button, styles[variant], className].filter(Boolean).join(" ");
  const content = (
    <>
      <span>{children}</span>
      {icon ? <Icon name={icon} size={18} className={styles.icon} /> : null}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const { href, external, variant: _v, icon: _i, children: _c, className: _cn, ...rest } = props;
    if (external || /^(https?:|mailto:|tel:)/.test(href)) {
      return (
        <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...rest}>
        {content}
      </Link>
    );
  }

  const { variant: _v, icon: _i, children: _c, className: _cn, ...rest } = props as AsButton;
  return (
    <button type="button" className={cls} {...rest}>
      {content}
    </button>
  );
}
