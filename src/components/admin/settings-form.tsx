"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { UploadField } from "@/components/admin/upload-field";

type SettingsFormProps = {
  settings: SiteSettings;
};

export function SettingsForm({ settings }: SettingsFormProps) {
  const [form, setForm] = useState({
    site_name: settings.site_name,
    hero_title: settings.hero_title,
    hero_subtitle: settings.hero_subtitle ?? "",
    hero_image_url: settings.hero_image_url ?? "",
    contact_email: settings.contact_email ?? "",
    social_links: JSON.stringify(settings.social_links, null, 2)
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        ...form,
        social_links: JSON.parse(form.social_links || "{}")
      };
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      setPending(false);

      if (!response.ok) {
        setError(result.error || "保存失败");
        return;
      }

      setMessage("站点配置已更新。");
      window.location.reload();
    } catch (saveError) {
      setPending(false);
      setError(saveError instanceof Error ? saveError.message : "JSON 格式错误");
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>站点配置</h2>
        <button type="button" className="button-primary" onClick={save} disabled={pending}>
          {pending ? "保存中..." : "保存配置"}
        </button>
      </div>
      <div className="stack-form">
        <label>
          <span>站点名称</span>
          <input value={form.site_name} onChange={(event) => setForm((prev) => ({ ...prev, site_name: event.target.value }))} />
        </label>
        <label>
          <span>Hero 标题</span>
          <input value={form.hero_title} onChange={(event) => setForm((prev) => ({ ...prev, hero_title: event.target.value }))} />
        </label>
        <label>
          <span>Hero 副标题</span>
          <textarea value={form.hero_subtitle} rows={4} onChange={(event) => setForm((prev) => ({ ...prev, hero_subtitle: event.target.value }))} />
        </label>
        <label>
          <span>联系邮箱</span>
          <input value={form.contact_email} onChange={(event) => setForm((prev) => ({ ...prev, contact_email: event.target.value }))} />
        </label>
        <label>
          <span>Hero 图片</span>
          <UploadField
            bucket="site-assets"
            value={form.hero_image_url}
            onChange={(value) => setForm((prev) => ({ ...prev, hero_image_url: value }))}
          />
        </label>
        <label>
          <span>社交链接 JSON</span>
          <textarea value={form.social_links} rows={8} onChange={(event) => setForm((prev) => ({ ...prev, social_links: event.target.value }))} />
        </label>
      </div>
      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
