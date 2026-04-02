import type { Metadata } from "next";
import Script from "next/script";
import "@/app/globals.css";
import { AuthRedirectBridge } from "@/components/auth-redirect-bridge";
import { PageTransitionShell } from "@/components/page-transition-shell";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "LiuEggy | 个人空间",
  description: "分享嵌入式开发、机器视觉、工程实践与项目记录的个人网站。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem("theme");
                  if (theme === "light") {
                    document.documentElement.classList.add("light");
                  } else {
                    document.documentElement.classList.remove("light");
                  }
                } catch (error) {
                  document.documentElement.classList.remove("light");
                }
              })();
            `
          }}
        />
        <div className="site-shell">
          <AuthRedirectBridge />
          <SiteHeader />
          <PageTransitionShell>{children}</PageTransitionShell>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
