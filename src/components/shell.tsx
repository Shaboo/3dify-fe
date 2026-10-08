"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Box,
  Images,
  KeyRound,
  Webhook,
  CreditCard,
  Settings,
  ArrowUpRight,
  Loader2,
  Layers3,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
export function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Link href="/" className="brand" aria-label="3dify home">
        <Layers3
          className="brand-mark"
          size={28}
          strokeWidth={1.7}
          aria-hidden="true"
        />
        3dify
      </Link>
      <nav className="header-nav" aria-label="Main navigation">
        <Link href="/docs">API docs</Link>
        <Link href="/subscribe">Plans</Link>
        {user ? (
          <>
            <Link href="/dashboard">Workspace</Link>
            <button className="btn secondary small" onClick={logout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/login">Sign in</Link>
            <Link className="btn small" href="/auth/register">
              Get started <ArrowUpRight size={15} />
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <span>3dify · Photos into 3D</span>
      <Link href="/docs">
        API documentation{" "}
        <ArrowUpRight size={13} style={{ display: "inline" }} />
      </Link>
    </footer>
  );
}
export function Loading({
  message = "Loading your workspace…",
}: {
  message?: string;
}) {
  return (
    <div className="loading" role="status">
      <Loader2 size={20} className="spin" />
      {message}
    </div>
  );
}
export function Workspace({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const navigationRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.matchMedia("(max-width: 700px)").matches) {
      navigationRef.current
        ?.querySelector<HTMLElement>('[aria-current="page"]')
        ?.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }, [path, user, isLoading]);
  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth/login");
  }, [isLoading, user, router]);
  const items = [
    { href: "/dashboard", label: "Generate", icon: Box },
    { href: "/dashboard/jobs", label: "Job history", icon: Images },
    { href: "/dashboard/keys", label: "API keys", icon: KeyRound },
    { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
    {
      href: "/dashboard/subscription",
      label: "Subscription",
      icon: CreditCard,
    },
    ...(user?.isAdmin
      ? [{ href: "/admin", label: "Admin", icon: Settings }]
      : []),
  ];
  return (
    <>
      <Header />
      {isLoading || !user ? (
        <Loading />
      ) : admin && !user.isAdmin ? (
        <main id="main-content" className="public-page">
          <h1>Admin access required</h1>
          <p className="muted" style={{ marginTop: 20 }}>
            Your account has the user role.
          </p>
          <Link className="btn" href="/dashboard" style={{ marginTop: 24 }}>
            Back to workspace
          </Link>
        </main>
      ) : (
        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-title">
              <Box size={20} />
              <span>Your studio</span>
            </div>
            <nav ref={navigationRef} aria-label="Workspace navigation">
              {items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={path === href ? "active" : ""}
                  aria-current={path === href ? "page" : undefined}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              ))}
            </nav>
            <p className="nav-scroll-hint">Scroll for more tools</p>
            <div className="sidebar-bottom">
              <p>{user.email}</p>
              <p className="muted">{user.isAdmin ? "Administrator" : "User"}</p>
            </div>
          </aside>
          <main id="main-content" className="workspace">
            {children}
          </main>
        </div>
      )}
    </>
  );
}
export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
