import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const cwd = process.cwd();
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SITE_URL"
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

function extractMeta(html, name) {
  const match = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"));
  return match?.[1] || "";
}

function extractTitle(html) {
  return html.match(/<title>([^<]+)<\/title>/i)?.[1] || "LiuEggy";
}

async function loadSiteSettings() {
  const file = await fs.readFile(path.join(cwd, "index.html"), "utf8");
  return {
    id: 1,
    site_name: extractTitle(file).split("|")[0].trim(),
    hero_title: "嵌入式开发、机器视觉与工程实践",
    hero_subtitle: extractMeta(file, "description") || "个人网站系统升级到 Next.js + Supabase。",
    contact_email: "1963287731qq@gmail.com",
    social_links: {
      github: "https://github.com/liueggy",
      bilibili: "https://space.bilibili.com/444993481"
    }
  };
}

async function loadPostsFromFile(filePath) {
  const content = await fs.readFile(path.resolve(cwd, filePath), "utf8");
  return JSON.parse(content);
}

async function loadPublishedPostsFromLegacyApi() {
  const base = process.env.LEGACY_BLOG_API_BASE || `${process.env.SITE_URL.replace(/\/$/, "")}/blog/api`;
  const listResponse = await fetch(`${base}?action=list&status=published&page=1&pageSize=100`);
  const listResult = await listResponse.json();
  const posts = listResult?.data?.posts || [];

  const detailedPosts = [];
  for (const post of posts) {
    const response = await fetch(`${base}?action=get&slug=${encodeURIComponent(post.slug)}`);
    const detail = await response.json();
    if (detail?.data) {
      detailedPosts.push(detail.data);
    }
  }

  return detailedPosts;
}

function normalizePost(post) {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || post.summary || "",
    content_md: post.content_md || post.content || "",
    cover_url: post.cover_url || post.cover_image || null,
    status: post.status === "published" ? "published" : "draft",
    published_at: post.status === "published" ? post.published_at || post.created_at || new Date().toISOString() : null,
    tags: Array.isArray(post.tags) ? post.tags : [],
    seo_title: post.seo_title || null,
    seo_description: post.seo_description || null
  };
}

async function loadProjects() {
  if (process.env.LEGACY_PROJECTS_FILE) {
    const content = await fs.readFile(path.resolve(cwd, process.env.LEGACY_PROJECTS_FILE), "utf8");
    return JSON.parse(content);
  }
  return [];
}

function normalizeProject(project) {
  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary || "",
    content_md: project.content_md || project.content || "",
    cover_url: project.cover_url || null,
    gallery: Array.isArray(project.gallery) ? project.gallery : [],
    repo_url: project.repo_url || null,
    demo_url: project.demo_url || null,
    status: project.status === "published" ? "published" : "draft",
    sort_order: Number(project.sort_order || 0)
  };
}

async function main() {
  const siteSettings = await loadSiteSettings();
  await supabase.from("site_settings").upsert(siteSettings).throwOnError();

  const rawPosts = process.env.LEGACY_POSTS_FILE
    ? await loadPostsFromFile(process.env.LEGACY_POSTS_FILE)
    : await loadPublishedPostsFromLegacyApi();

  if (rawPosts.length > 0) {
    await supabase.from("posts").upsert(rawPosts.map(normalizePost), { onConflict: "slug" }).throwOnError();
  }

  const rawProjects = await loadProjects();
  if (rawProjects.length > 0) {
    await supabase.from("projects").upsert(rawProjects.map(normalizeProject), { onConflict: "slug" }).throwOnError();
  }

  console.log(`Migrated site settings, ${rawPosts.length} posts and ${rawProjects.length} projects.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
