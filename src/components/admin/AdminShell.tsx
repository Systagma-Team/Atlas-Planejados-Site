"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ToastProvider } from "./Toast";

type Props = {
  children: ReactNode;
  adminName: string;
  unreadMessages: number;
  logout: () => Promise<void>;
};

const NAV: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/admin", label: "Painel", icon: "home", exact: true },
  { href: "/admin/projetos", label: "Projetos", icon: "image" },
  { href: "/admin/categorias", label: "Categorias", icon: "folder" },
  { href: "/admin/mensagens", label: "Mensagens", icon: "inbox" },
  { href: "/admin/configuracoes", label: "Informações do site", icon: "settings" },
];

export function AdminShell({ children, adminName, unreadMessages, logout }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const nav = (
    <>
      <nav className="adm-nav" aria-label="Menu do painel">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
              <Icon name={item.icon} size={20} />
              {item.label}
              {item.href === "/admin/mensagens" && unreadMessages > 0 ? (
                <span className="adm-count" aria-label={`${unreadMessages} não lidas`}>
                  {unreadMessages}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="adm-side-foot">
        <Link href="/admin/conta" aria-current={pathname.startsWith("/admin/conta") ? "page" : undefined}>
          <Icon name="settings" size={20} />
          Minha conta ({adminName.split(" ")[0]})
        </Link>
        <a href="/" target="_blank" rel="noopener noreferrer">
          <Icon name="external" size={20} />
          Ver o site
        </a>
        <form action={logout}>
          <button type="submit">
            <Icon name="logout" size={20} />
            Sair
          </button>
        </form>
      </div>
    </>
  );

  return (
    <ToastProvider>
      <div className="adm-shell">
        <aside className="adm-sidebar">
          <div className="adm-brand">
            Atlas <small>Painel</small>
          </div>
          {nav}
        </aside>

        <div className="adm-main">
          <header className="adm-topbar">
            <div className="adm-brand">
              Atlas <small>Painel</small>
            </div>
            <button type="button" aria-expanded={open} aria-controls="adm-drawer" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen((v) => !v)}>
              <Icon name={open ? "close" : "menu"} size={26} />
            </button>
          </header>
          <div id="adm-drawer" className="adm-drawer" hidden={!open}>
            {nav}
          </div>
          <main id="conteudo" className="adm-page">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
