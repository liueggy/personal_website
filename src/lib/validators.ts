import { z } from "zod";
import { excerptFromMarkdown, slugify, toStringArray } from "@/lib/utils";

const statusSchema = z.enum(["draft", "published"]);

export const postPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "标题不能为空"),
  slug: z.string().trim().optional(),
  excerpt: z.string().trim().optional(),
  content_md: z.string().trim().min(1, "内容不能为空"),
  cover_url: z.string().trim().url().optional().or(z.literal("")).optional(),
  status: statusSchema.default("draft"),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  seo_title: z.string().trim().optional(),
  seo_description: z.string().trim().optional()
});

export const projectPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "项目标题不能为空"),
  slug: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  content_md: z.string().trim().min(1, "项目内容不能为空"),
  cover_url: z.string().trim().url().optional().or(z.literal("")).optional(),
  gallery: z.union([z.array(z.string()), z.string()]).optional(),
  repo_url: z.string().trim().url().optional().or(z.literal("")).optional(),
  demo_url: z.string().trim().url().optional().or(z.literal("")).optional(),
  status: statusSchema.default("draft"),
  sort_order: z.coerce.number().int().default(0)
});

export const contactPayloadSchema = z.object({
  name: z.string().trim().min(2, "请填写姓名").max(60),
  email: z.string().trim().email("请输入有效邮箱"),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "留言至少 10 个字符").max(2000)
});

export const settingsPayloadSchema = z.object({
  site_name: z.string().trim().min(1),
  hero_title: z.string().trim().min(1),
  hero_subtitle: z.string().trim().optional(),
  hero_image_url: z.string().trim().url().optional().or(z.literal("")).optional(),
  contact_email: z.string().trim().email().optional().or(z.literal("")).optional(),
  social_links: z.record(z.string(), z.string()).default({})
});

export function normalizePostPayload(input: unknown) {
  const parsed = postPayloadSchema.parse(input);
  return {
    ...parsed,
    slug: slugify(parsed.slug || parsed.title),
    excerpt: parsed.excerpt?.trim() || excerptFromMarkdown(parsed.content_md),
    cover_url: parsed.cover_url || null,
    tags: toStringArray(parsed.tags),
    seo_title: parsed.seo_title?.trim() || null,
    seo_description: parsed.seo_description?.trim() || null,
    published_at: parsed.status === "published" ? new Date().toISOString() : null
  };
}

export function normalizeProjectPayload(input: unknown) {
  const parsed = projectPayloadSchema.parse(input);
  return {
    ...parsed,
    slug: slugify(parsed.slug || parsed.title),
    summary: parsed.summary?.trim() || excerptFromMarkdown(parsed.content_md),
    cover_url: parsed.cover_url || null,
    gallery: toStringArray(parsed.gallery),
    repo_url: parsed.repo_url || null,
    demo_url: parsed.demo_url || null
  };
}
