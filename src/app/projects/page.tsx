import Link from "next/link";
import { listPublishedProjects } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listPublishedProjects();
  const [featuredProject, ...restProjects] = projects;

  return (
    <main className="editorial-page editorial-project-page">
      <section className="section-block editorial-page-hero">
        <div className="container editorial-page-hero-grid">
          <div className="editorial-page-copy">
            <span className="hero-badge">Projects</span>
            <h1 className="page-title">公开项目与技术实验</h1>
          </div>
          <div className="editorial-page-note">
            <span className="editorial-mini-label">Project Count</span>
            <strong>{projects.length}</strong>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container editorial-stack">
          {featuredProject ? (
            <article className="editorial-lead-card editorial-project-lead">
              <div className="editorial-lead-media">
                {featuredProject.cover_url ? <img src={featuredProject.cover_url} alt={featuredProject.title} /> : null}
              </div>
              <div className="editorial-lead-copy">
                <div className="card-meta">
                  <span>排序 {featuredProject.sort_order}</span>
                  <span>{featuredProject.gallery.length} 张图</span>
                </div>
                <h2>{featuredProject.title}</h2>
                {featuredProject.summary ? <p>{featuredProject.summary}</p> : null}
                <div className="inline-actions">
                  <Link href={`/projects/${featuredProject.slug}`} className="text-link">
                    查看详情
                  </Link>
                  {featuredProject.demo_url ? (
                    <a href={featuredProject.demo_url} target="_blank" rel="noreferrer" className="text-link muted-link">
                      在线演示
                    </a>
                  ) : null}
                  {featuredProject.repo_url ? (
                    <a href={featuredProject.repo_url} target="_blank" rel="noreferrer" className="text-link muted-link">
                      GitHub
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ) : null}

          <div className="editorial-project-grid">
            {restProjects.map((project) => (
              <article key={project.id} className="editorial-project-card">
                {project.cover_url ? <img src={project.cover_url} className="editorial-project-cover" alt={project.title} /> : null}
                <div className="card-meta">
                  <span>排序 {project.sort_order}</span>
                  <span>{project.gallery.length} 张图</span>
                </div>
                <h3>{project.title}</h3>
                <p>{project.summary || "暂无项目摘要"}</p>
                <div className="inline-actions">
                  <Link href={`/projects/${project.slug}`} className="text-link">
                    查看详情
                  </Link>
                  {project.demo_url ? (
                    <a href={project.demo_url} target="_blank" rel="noreferrer" className="text-link muted-link">
                      Demo
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
