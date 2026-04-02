"use client";

import { useMemo, useState } from "react";
import type { PostRecord, ProjectRecord } from "@/lib/types";
import { UploadField } from "@/components/admin/upload-field";

type ContentKind = "posts" | "projects";

type ContentManagerProps = {
  kind: ContentKind;
  items: Array<PostRecord | ProjectRecord>;
};

type ContentFormState = Record<string, string | number>;

function isProject(item: PostRecord | ProjectRecord): item is ProjectRecord {
  return "sort_order" in item;
}

export function ContentManager({ kind, items }: ContentManagerProps) {
  const blank = useMemo<ContentFormState>(
    () =>
      kind === "posts"
        ? {
            id: "",
            title: "",
            slug: "",
            excerpt: "",
            content_md: "",
            cover_url: "",
            status: "draft",
            tags: "",
            seo_title: "",
            seo_description: ""
          }
        : {
            id: "",
            title: "",
            slug: "",
            summary: "",
            content_md: "",
            cover_url: "",
            gallery: "",
            repo_url: "",
            demo_url: "",
            status: "draft",
            sort_order: 0
          } as ContentFormState,
    [kind]
  );
  const [form, setForm] = useState<ContentFormState>(blank);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function editItem(item: PostRecord | ProjectRecord) {
    if (kind === "posts") {
      const post = item as PostRecord;
      setForm({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        content_md: post.content_md,
        cover_url: post.cover_url ?? "",
        status: post.status,
        tags: post.tags.join(", "),
        seo_title: post.seo_title ?? "",
        seo_description: post.seo_description ?? ""
      });
      return;
    }

    const project = item as ProjectRecord;
    setForm({
      id: project.id,
      title: project.title,
      slug: project.slug,
      summary: project.summary ?? "",
      content_md: project.content_md,
      cover_url: project.cover_url ?? "",
      gallery: project.gallery.join(", "),
      repo_url: project.repo_url ?? "",
      demo_url: project.demo_url ?? "",
      status: project.status,
      sort_order: project.sort_order
    });
  }

  async function save() {
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const isEditing = Boolean(form.id);
      const endpoint = isEditing ? `/api/${kind}/${form.id}` : `/api/${kind}`;
      const method = isEditing ? "PUT" : "POST";
      const payload = Object.fromEntries(
        Object.entries(form).filter(([key, value]) => {
          if (key === "id" && (!value || String(value).trim() === "")) {
            return false;
          }
          return true;
        })
      );

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const raw = await response.text();
      const result = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        setError(result.error || "保存失败");
        return;
      }

      setMessage("保存成功，页面即将刷新。");
      window.location.reload();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-grid">
      <section className="panel">
        <div className="panel-header">
          <h2>{kind === "posts" ? "文章列表" : "项目列表"}</h2>
          <button type="button" className="button-secondary" onClick={() => setForm(blank)}>
            新建
          </button>
        </div>
        <div className="admin-list">
          {items.map((item) => (
            <button key={item.id} type="button" className="admin-list-item" onClick={() => editItem(item)}>
              <strong>{item.title}</strong>
              <span>{item.status === "published" ? "已发布" : "草稿"}</span>
              {isProject(item) ? <small>排序 {item.sort_order}</small> : null}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{kind === "posts" ? "文章编辑器" : "项目编辑器"}</h2>
          <button type="button" className="button-primary" onClick={save} disabled={pending}>
            {pending ? "保存中..." : "保存"}
          </button>
        </div>
        <div className="stack-form">
          <label>
            <span>标题</span>
            <input value={String(form.title ?? "")} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          </label>
          <label>
            <span>Slug</span>
            <input value={String(form.slug ?? "")} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
          </label>
          <label>
            <span>封面图</span>
            <UploadField
              bucket={kind === "posts" ? "post-covers" : "project-assets"}
              value={String(form.cover_url ?? "")}
              onChange={(value) => setForm((prev) => ({ ...prev, cover_url: value }))}
            />
          </label>
          {kind === "posts" ? (
            <>
              <label>
                <span>摘要</span>
                <textarea value={String(form.excerpt ?? "")} rows={4} onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))} />
              </label>
              <label>
                <span>标签</span>
                <input value={String(form.tags ?? "")} onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))} placeholder="嵌入式, 机器视觉" />
              </label>
              <label>
                <span>SEO 标题</span>
                <input value={String(form.seo_title ?? "")} onChange={(event) => setForm((prev) => ({ ...prev, seo_title: event.target.value }))} />
              </label>
              <label>
                <span>SEO 描述</span>
                <textarea value={String(form.seo_description ?? "")} rows={3} onChange={(event) => setForm((prev) => ({ ...prev, seo_description: event.target.value }))} />
              </label>
            </>
          ) : (
            <>
              <label>
                <span>摘要</span>
                <textarea value={String(form.summary ?? "")} rows={4} onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))} />
              </label>
              <label>
                <span>画廊链接</span>
                <input value={String(form.gallery ?? "")} onChange={(event) => setForm((prev) => ({ ...prev, gallery: event.target.value }))} placeholder="多个链接用逗号分隔" />
              </label>
              <label>
                <span>仓库链接</span>
                <input value={String(form.repo_url ?? "")} onChange={(event) => setForm((prev) => ({ ...prev, repo_url: event.target.value }))} />
              </label>
              <label>
                <span>演示链接</span>
                <input value={String(form.demo_url ?? "")} onChange={(event) => setForm((prev) => ({ ...prev, demo_url: event.target.value }))} />
              </label>
              <label>
                <span>排序</span>
                <input
                  type="number"
                  value={Number(form.sort_order ?? 0)}
                  onChange={(event) => setForm((prev) => ({ ...prev, sort_order: Number(event.target.value) }))}
                />
              </label>
            </>
          )}
          <label>
            <span>状态</span>
            <select value={String(form.status ?? "draft")} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="draft">草稿</option>
              <option value="published">发布</option>
            </select>
          </label>
          <label>
            <span>Markdown 内容</span>
            <textarea value={String(form.content_md ?? "")} rows={14} onChange={(event) => setForm((prev) => ({ ...prev, content_md: event.target.value }))} />
          </label>
        </div>
        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </section>
    </div>
  );
}
