import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MessageRecord, PostRecord, ProjectRecord, SiteSettings } from "@/lib/types";

const admin = createSupabaseAdminClient();

function mapPostTags(post: Partial<PostRecord>) {
  return {
    ...post,
    tags: Array.isArray(post.tags) ? post.tags : []
  } as PostRecord;
}

function mapProjectGallery(project: Partial<ProjectRecord>) {
  return {
    ...project,
    gallery: Array.isArray(project.gallery) ? project.gallery : []
  } as ProjectRecord;
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const { data, error } = await admin.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) {
    throw error;
  }

  return (
    data ?? {
      id: 1,
      site_name: "LiuEggy",
      hero_title: "嵌入式开发、机器视觉与工程实践",
      hero_subtitle: "持续构建可扩展的个人网站系统。",
      hero_image_url: null,
      social_links: {
        github: "https://github.com/liueggy",
        bilibili: "https://space.bilibili.com/444993481"
      },
      contact_email: "1963287731qq@gmail.com",
      updated_at: new Date().toISOString()
    }
  );
});

export const listPublishedPosts = cache(async (limit = 20) => {
  const { data, error } = await admin
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPostTags);
});

export const listAdminPosts = cache(async () => {
  const { data, error } = await admin.from("posts").select("*").order("updated_at", { ascending: false });
  if (error) {
    throw error;
  }
  return (data ?? []).map(mapPostTags);
});

export const getPublishedPostBySlug = cache(async (slug: string) => {
  const { data, error } = await admin
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPostTags(data) : null;
});

export const listPublishedProjects = cache(async () => {
  const { data, error } = await admin
    .from("projects")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapProjectGallery);
});

export const listAdminProjects = cache(async () => {
  const { data, error } = await admin
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapProjectGallery);
});

export const getPublishedProjectBySlug = cache(async (slug: string) => {
  const { data, error } = await admin
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProjectGallery(data) : null;
});

export const listMessages = cache(async (): Promise<MessageRecord[]> => {
  const { data, error } = await admin
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as MessageRecord[];
});

export async function getDashboardStats() {
  const [posts, projects, messages] = await Promise.all([
    admin.from("posts").select("id, status", { count: "exact", head: false }),
    admin.from("projects").select("id, status", { count: "exact", head: false }),
    admin.from("messages").select("id, status", { count: "exact", head: false })
  ]);

  return {
    posts: posts.count ?? 0,
    projects: projects.count ?? 0,
    messages: messages.count ?? 0,
    publishedPosts: (posts.data ?? []).filter((item) => item.status === "published").length,
    publishedProjects: (projects.data ?? []).filter((item) => item.status === "published").length
  };
}
