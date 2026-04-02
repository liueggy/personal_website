import { notFound } from "next/navigation";
import { getPublishedProjectBySlug } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

type ProjectDetailProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const project = await getPublishedProjectBySlug(decodedSlug);
  if (!project) {
    notFound();
  }

  return (
    <main>
      <section className="section-block page-hero">
        <div className="container reading-hero">
          <span className="hero-badge">Project Detail</span>
          <h1 className="page-title">{project.title}</h1>
          <p className="page-intro">{project.summary || "项目结构、实现细节与链接信息如下。"}</p>
        </div>
      </section>
      <section className="section-block">
        <div className="container reading-layout">
          <article className="detail-card article-card">
            {project.cover_url ? <img src={project.cover_url} className="hero-cover" alt={project.title} /> : null}
            <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(project.content_md) }} />
          </article>
          <aside className="detail-card aside-card">
            <h2>项目元信息</h2>
            <ul className="detail-list">
              <li>排序值：{project.sort_order}</li>
              <li>图集数量：{project.gallery.length}</li>
              <li>Slug：{project.slug}</li>
            </ul>
            <div className="inline-actions">
              {project.repo_url ? (
                <a href={project.repo_url} target="_blank" rel="noreferrer" className="btn btn-primary">
                  仓库链接
                </a>
              ) : null}
              {project.demo_url ? (
                <a href={project.demo_url} target="_blank" rel="noreferrer" className="btn btn-secondary">
                  演示链接
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
