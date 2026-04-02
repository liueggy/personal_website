import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <section className="section">
        <div className="shell">
          <article className="detail-card">
            <span className="eyebrow">404</span>
            <h1 className="page-title">页面不存在</h1>
            <p className="page-lead">请求的内容没有找到，可能尚未发布或 slug 已变更。</p>
            <Link href="/" className="button-primary">
              返回首页
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
