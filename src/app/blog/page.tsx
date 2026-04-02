import Link from "next/link";
import { listPublishedPosts } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await listPublishedPosts(100);
  const [featuredPost, ...restPosts] = posts;

  return (
    <main className="editorial-page editorial-blog-page">
      <section className="section-block editorial-page-hero">
        <div className="container editorial-page-hero-grid">
          <div className="editorial-page-copy">
            <span className="hero-badge">Blog</span>
            <h1 className="page-title">技术、项目与实践记录</h1>
          </div>
          <div className="editorial-page-note">
            <span className="editorial-mini-label">Archive Size</span>
            <strong>{posts.length}</strong>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container editorial-stack">
          {featuredPost ? (
            <article className="editorial-lead-card">
              <div className="editorial-lead-media">
                {featuredPost.cover_url ? <img src={featuredPost.cover_url} alt={featuredPost.title} /> : null}
              </div>
              <div className="editorial-lead-copy">
                <div className="card-meta">
                  <span>{formatDate(featuredPost.published_at || featuredPost.created_at)}</span>
                  <span>{featuredPost.tags.length} 个标签</span>
                </div>
                <h2>{featuredPost.title}</h2>
                {featuredPost.excerpt ? <p>{featuredPost.excerpt}</p> : null}
                <div className="tag-list">
                  {featuredPost.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href={`/blog/${featuredPost.slug}`} className="text-link">
                  打开文章
                </Link>
              </div>
            </article>
          ) : null}

          <div className="editorial-list-grid">
            {restPosts.map((post) => (
              <article key={post.id} className="editorial-list-card">
                <div className="card-meta">
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                  <span>{post.tags.length} 个标签</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt || "暂无摘要"}</p>
                <div className="tag-list">
                  {post.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href={`/blog/${post.slug}`} className="text-link">
                  阅读文章
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
