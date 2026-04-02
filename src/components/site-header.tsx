"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "首页" },
  { href: "/blog", label: "博客" },
  { href: "/projects", label: "项目" },
  { href: "/contact", label: "联系" },
  { href: "/admin", label: "后台" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container header-container">
        <Link href="/" className="brand">
          <span className="brand-text">
            <strong>LiuEggy</strong>
            <small className="tagline">Personal archive for engineering work</small>
          </span>
        </Link>
        <nav className="nav-links">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link key={link.href} href={link.href} className={`nav-link${isActive ? " active" : ""}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
