import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/content";
import { SignOutButton } from "@/components/admin/sign-out-button";

export default async function AdminDashboardPage() {
  const [{ user }, stats] = await Promise.all([requireAdminUser(), getDashboardStats()]);

  return (
    <main>
      <section className="section">
        <div className="shell">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Admin Dashboard</span>
              <h1 className="page-title">欢迎回来，{user.email}</h1>
            </div>
            <SignOutButton />
          </div>
          <div className="stat-grid">
            <article className="card">
              <h3>文章</h3>
              <p>总数 {stats.posts} / 已发布 {stats.publishedPosts}</p>
              <Link href="/admin/posts" className="button-secondary">
                管理文章
              </Link>
            </article>
            <article className="card">
              <h3>项目</h3>
              <p>总数 {stats.projects} / 已发布 {stats.publishedProjects}</p>
              <Link href="/admin/projects" className="button-secondary">
                管理项目
              </Link>
            </article>
            <article className="card">
              <h3>留言</h3>
              <p>消息总数 {stats.messages}</p>
              <Link href="/admin/messages" className="button-secondary">
                查看留言
              </Link>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
