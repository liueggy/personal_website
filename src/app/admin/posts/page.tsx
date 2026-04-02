import { ContentManager } from "@/components/admin/content-manager";
import { requireAdminUser } from "@/lib/auth";
import { listAdminPosts } from "@/lib/content";

export default async function AdminPostsPage() {
  await requireAdminUser();
  const posts = await listAdminPosts();

  return (
    <main>
      <section className="section">
        <div className="shell">
          <h1 className="page-title">文章管理</h1>
          <ContentManager kind="posts" items={posts} />
        </div>
      </section>
    </main>
  );
}
