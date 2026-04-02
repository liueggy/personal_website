import { ContactForm } from "@/components/forms/contact-form";
import { getSiteSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <main>
      <section className="section-block page-hero">
        <div className="container">
          <span className="hero-badge">Contact</span>
          <h1 className="page-title">联系与合作</h1>
        </div>
      </section>
      <section className="section-block">
        <div className="container contact-layout">
          <div className="detail-card">
            <h2>联系方式</h2>
            <ul className="detail-list">
              <li>邮箱：{settings.contact_email || "未配置"}</li>
              <li>GitHub：{settings.social_links.github || "未配置"}</li>
              <li>Bilibili：{settings.social_links.bilibili || "未配置"}</li>
            </ul>
          </div>
          <div className="detail-card">
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
