import Link from "next/link";
import { AnimatedHeroTitle } from "@/components/animated-hero-title";
import { HeroTerminal } from "@/components/hero-terminal";
import { HomeSkillGrid } from "@/components/home-skill-grid";
import { getSiteSettings, listPublishedPosts, listPublishedProjects } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, posts, projects] = await Promise.all([
    getSiteSettings(),
    listPublishedPosts(4),
    listPublishedProjects()
  ]);

  const featuredPost = posts[0];

  return (
    <main className="editorial-page editorial-home">
      <section className="section-block editorial-hero-section">
        <div className="container editorial-hero-grid">
          <div className="editorial-hero-copy">
            <span className="hero-badge">About / Archive</span>
            <p className="editorial-kicker">个人网站、工程归档与可持续更新的技术记录。</p>
            <AnimatedHeroTitle phrases={["嵌入式开发", "机器视觉", "三维建模与仿真"]} />
            <p className="editorial-intro">{settings.hero_subtitle || "持续构建可扩展的个人网站系统。"}</p>
            <div className="hero-actions">
              <Link href="/blog" className="btn btn-primary">
                浏览博客
              </Link>
              <Link href="/projects" className="btn btn-secondary">
                查看项目
              </Link>
            </div>
            <div className="editorial-stat-grid">
              <div className="editorial-stat-card">
                <span className="editorial-stat-label">文章</span>
                <strong>{posts.length}</strong>
              </div>
              <div className="editorial-stat-card">
                <span className="editorial-stat-label">项目</span>
                <strong>{projects.length}</strong>
              </div>
              <div className="editorial-stat-card">
                <span className="editorial-stat-label">站点</span>
                <strong>{settings.site_name}</strong>
              </div>
            </div>
          </div>

          <div className="editorial-hero-side">
            <HeroTerminal siteName={settings.site_name} />
            <div className="editorial-side-note">
              <span className="eyebrow">Currently</span>
              <p>聚焦底层系统、视觉识别与网站工程化，把学习、实验和产出沉淀为长期有效的个人档案。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block section-alt editorial-profile-section">
        <div className="container">
          <div className="editorial-panel editorial-skills-panel">
            <div className="section-header compact-section-header">
              <span className="eyebrow">Skill Set</span>
              <h2 className="section-title">能力地图</h2>
            </div>
            <HomeSkillGrid />
          </div>
        </div>
      </section>

      <section className="section-block editorial-dual-section">
        <div className="container editorial-home-blog">
          <div className="section-header compact-section-header">
            <span className="eyebrow">Writing</span>
            <h2 className="section-title">最新博客</h2>
          </div>
          {featuredPost ? (
            <article className="editorial-feature-card">
              {featuredPost.cover_url ? <img src={featuredPost.cover_url} className="editorial-feature-cover" alt={featuredPost.title} /> : null}
              <div className="editorial-feature-body">
                <div className="card-meta">
                  <span>{formatDate(featuredPost.published_at || featuredPost.created_at)}</span>
                  <span>{featuredPost.tags.length} 个标签</span>
                </div>
                <h3>{featuredPost.title}</h3>
                {featuredPost.excerpt ? <p>{featuredPost.excerpt}</p> : null}
                <Link href={`/blog/${featuredPost.slug}`} className="text-link">
                  阅读文章
                </Link>
              </div>
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}
