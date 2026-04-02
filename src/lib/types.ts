export type ProfileRole = "admin";
export type PublishStatus = "draft" | "published";
export type MessageStatus = "new" | "read" | "archived";
export type GuestbookStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string | null;
  role: ProfileRole;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostRecord {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  cover_url: string | null;
  status: PublishStatus;
  published_at: string | null;
  author_id: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectRecord {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content_md: string;
  cover_url: string | null;
  gallery: string[];
  repo_url: string | null;
  demo_url: string | null;
  status: PublishStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: MessageStatus;
  created_at: string;
}

export interface SiteSettings {
  id: number;
  site_name: string;
  hero_title: string;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  social_links: Record<string, string>;
  contact_email: string | null;
  updated_at: string;
}

export interface GuestbookRecord {
  id: string;
  name: string;
  content: string;
  status: GuestbookStatus;
  created_at: string;
}
