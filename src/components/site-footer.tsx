import { getSiteSettings } from "@/lib/content";

export async function SiteFooter() {
  const settings = await getSiteSettings();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-minimal">
          <span className="footer-minimal-label">Contact</span>
          <div className="footer-minimal-links">
            {settings.contact_email ? (
              <a className="footer-minimal-link" href={`mailto:${settings.contact_email}`} aria-label="邮箱">
                Email
              </a>
            ) : null}
            {settings.social_links.github ? (
              <a className="footer-minimal-link" href={settings.social_links.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                GitHub
              </a>
            ) : null}
            {settings.social_links.bilibili ? (
              <a className="footer-minimal-link" href={settings.social_links.bilibili} target="_blank" rel="noreferrer" aria-label="Bilibili">
                Bilibili
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
