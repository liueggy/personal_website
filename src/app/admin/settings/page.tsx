import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdminUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/content";

export default async function AdminSettingsPage() {
  await requireAdminUser();
  const settings = await getSiteSettings();

  return (
    <main>
      <section className="section">
        <div className="shell">
          <h1 className="page-title">站点配置</h1>
          <SettingsForm settings={settings} />
        </div>
      </section>
    </main>
  );
}
