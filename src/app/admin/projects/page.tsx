import { ContentManager } from "@/components/admin/content-manager";
import { requireAdminUser } from "@/lib/auth";
import { listAdminProjects } from "@/lib/content";

export default async function AdminProjectsPage() {
  await requireAdminUser();
  const projects = await listAdminProjects();

  return (
    <main>
      <section className="section">
        <div className="shell">
          <h1 className="page-title">项目管理</h1>
          <ContentManager kind="projects" items={projects} />
        </div>
      </section>
    </main>
  );
}
