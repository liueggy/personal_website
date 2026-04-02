import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPostBySlug } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type BlogDetailProps = {
  params: Promise<{
    slug: string;
  }>;
};

function estimateReadingMinutes(content: string) {
  const plainText = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[#>*_[\]\(\)!-]/g, " ")
    .replace(/\s+/g, "");

  return Math.max(1, Math.round(plainText.length / 320));
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getFirstParagraph(content: string) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => normalizeText(block.replace(/[#>*`_\-\[\]\(\)!]/g, " ")))
    .filter(Boolean);

  return blocks[0] ?? "";
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const post = await getPublishedPostBySlug(decodedSlug);

  if (!post) {
    notFound();
  }

  const publishedLabel = formatDate(post.published_at || post.created_at);
  const updatedLabel = formatDate(post.updated_at);
  const readingMinutes = estimateReadingMinutes(post.content_md);
  const showUpdated = updatedLabel !== publishedLabel;
  const excerpt = normalizeText(post.excerpt || "");
  const firstParagraph = getFirstParagraph(post.content_md);
  const shouldShowIntro = excerpt.length > 0 && excerpt !== firstParagraph;

  return (
    <main className="blog-story-page">
      <section className="blog-story-cover-section">
        <div className="container blog-story-cover-shell">
          <Link href="/blog" className="back-link blog-story-back-link">
            返回博客列表
          </Link>
          <figure className={`blog-story-cover${post.cover_url ? " has-image" : " is-fallback"}`}>
            {post.cover_url ? (
              <img src={post.cover_url} className="blog-story-cover-image" alt={post.title} />
            ) : (
              <div className="blog-story-cover-fallback">
                <span className="blog-story-cover-label">Article</span>
                <strong>{post.title}</strong>
              </div>
            )}
          </figure>
        </div>
      </section>

      <section className="section-block blog-story-section">
        <article className="container blog-story-shell">
          <header className="blog-story-header">
            <div className="card-meta blog-story-meta">
              <span>{publishedLabel}</span>
              <span>{readingMinutes} 分钟阅读</span>
              {showUpdated ? <span>更新于 {updatedLabel}</span> : null}
            </div>
            <h1 className="page-title blog-story-title">{post.title}</h1>
            {shouldShowIntro ? <p className="page-intro blog-story-intro">{post.excerpt}</p> : null}
            {post.tags.length ? (
              <div className="tag-list blog-story-tags">
                {post.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          <div className="blog-story-body">
            <div className="markdown blog-story-markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content_md) }} />
          </div>

          <footer className="blog-story-footer">
            <p className="blog-story-footnote">
              {post.slug}
              {showUpdated ? ` · 最后更新 ${updatedLabel}` : ""}
            </p>
            <Link href="/blog" className="text-link blog-story-return">
              返回博客列表
            </Link>
          </footer>
        </article>
      </section>
    </main>
  );
}
