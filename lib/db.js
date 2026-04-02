const crypto = require('crypto');
const { sql } = require('@vercel/postgres');
const { defaultThemes } = require('./theme-defaults');

let schemaReadyPromise = null;

function hasDatabase() {
  return Boolean(process.env.POSTGRES_URL);
}

function getMemoryStore() {
  if (!globalThis.__SITE_MEMORY_STORE__) {
    globalThis.__SITE_MEMORY_STORE__ = {
      siteSettings: {
        hero_themes: JSON.parse(JSON.stringify(defaultThemes))
      },
      siteStats: {
        pv: 0,
        uv_total: 0,
        visitors: new Set(),
        dailyVisitors: new Map(),
        dailyPv: new Map()
      },
      posts: [],
      blogComments: [],
      guestbookComments: [],
      ids: {
        posts: 1,
        blogComments: 1,
        guestbookComments: 1
      }
    };
  }
  return globalThis.__SITE_MEMORY_STORE__;
}

function ensureSchema() {
  if (!hasDatabase()) {
    getMemoryStore();
    return Promise.resolve();
  }
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS site_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS site_stats (
          id INTEGER PRIMARY KEY DEFAULT 1,
          pv BIGINT NOT NULL DEFAULT 0,
          uv_total BIGINT NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO site_stats (id, pv, uv_total)
        VALUES (1, 0, 0)
        ON CONFLICT (id) DO NOTHING
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS site_visitors (
          visitor_hash TEXT PRIMARY KEY,
          first_seen DATE NOT NULL DEFAULT CURRENT_DATE,
          last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS site_daily_visitors (
          day DATE NOT NULL,
          visitor_hash TEXT NOT NULL,
          PRIMARY KEY (day, visitor_hash)
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS site_daily_stats (
          day DATE PRIMARY KEY,
          pv BIGINT NOT NULL DEFAULT 0
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS posts (
          id BIGSERIAL PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          summary TEXT DEFAULT '',
          content TEXT NOT NULL,
          cover_image TEXT DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft',
          author TEXT NOT NULL DEFAULT 'LiuEggy',
          category_slug TEXT DEFAULT '',
          category_name TEXT DEFAULT '',
          tags JSONB NOT NULL DEFAULT '[]'::jsonb,
          view_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS blog_comments (
          id BIGSERIAL PRIMARY KEY,
          post_slug TEXT NOT NULL,
          parent_id BIGINT,
          ip_hash TEXT DEFAULT '',
          name TEXT NOT NULL,
          content TEXT NOT NULL,
          likes INTEGER NOT NULL DEFAULT 0,
          status INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS guestbook_comments (
          id BIGSERIAL PRIMARY KEY,
          public_id TEXT NOT NULL UNIQUE,
          ip_hash TEXT DEFAULT '',
          name TEXT NOT NULL,
          contact TEXT DEFAULT '',
          content TEXT NOT NULL,
          avatar TEXT DEFAULT '',
          likes INTEGER NOT NULL DEFAULT 0,
          status INTEGER NOT NULL DEFAULT 1,
          parent_id BIGINT,
          reply_to TEXT DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO site_settings (key, value)
        VALUES ('hero_themes', ${JSON.stringify(defaultThemes)}::jsonb)
        ON CONFLICT (key) DO NOTHING
      `;
    })();
  }
  return schemaReadyPromise;
}

function mapPost(row) {
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    summary: row.summary || '',
    content: row.content,
    cover_image: row.cover_image || '',
    status: row.status,
    author: row.author || 'LiuEggy',
    category_slug: row.category_slug || '',
    category_name: row.category_name || '',
    tags: Array.isArray(row.tags) ? row.tags : row.tags || [],
    view_count: Number(row.view_count || 0),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapComment(row) {
  return {
    id: Number(row.id),
    public_id: row.public_id,
    name: row.name,
    contact: row.contact || '',
    content: row.content,
    avatar: row.avatar || '',
    likes: Number(row.likes || 0),
    status: Number(row.status || 0),
    parent_id: row.parent_id ? Number(row.parent_id) : null,
    reply_to: row.reply_to || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
    ts: row.created_at ? new Date(row.created_at).getTime() : Date.now()
  };
}

function createPublicId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function createIpHash(input) {
  return crypto.createHash('sha1').update(String(input || '')).digest('hex');
}

async function listPosts(options = {}) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const page = Math.max(1, Number(options.page || 1));
    const pageSize = Math.max(1, Math.min(50, Number(options.pageSize || options.limit || 10)));
    let posts = [...store.posts];
    if (options.status && options.status !== 'all') {
      posts = posts.filter((post) => post.status === options.status);
    }
    if (options.category) {
      posts = posts.filter((post) => post.category_slug === options.category);
    }
    posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = posts.length;
    const slice = posts.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    return {
      posts: slice,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }
  const page = Math.max(1, Number(options.page || 1));
  const pageSize = Math.max(1, Math.min(50, Number(options.pageSize || options.limit || 10)));
  const offset = (page - 1) * pageSize;

  const values = [];
  const clauses = [];

  if (options.status && options.status !== 'all') {
    values.push(options.status);
    clauses.push(`status = $${values.length}`);
  }
  if (options.category) {
    values.push(options.category);
    clauses.push(`category_slug = $${values.length}`);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  values.push(pageSize);
  const limitParam = `$${values.length}`;
  values.push(offset);
  const offsetParam = `$${values.length}`;

  const listQuery = `
    SELECT id, slug, title, summary, content, cover_image, status, author, category_slug, category_name, tags, view_count, created_at, updated_at
    FROM posts
    ${where}
    ORDER BY created_at DESC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;
  const countQuery = `SELECT COUNT(*)::int AS total FROM posts ${where}`;

  const [listResult, countResult] = await Promise.all([
    sql.query(listQuery, values),
    sql.query(countQuery, values.slice(0, values.length - 2))
  ]);

  const total = countResult.rows[0]?.total || 0;

  return {
    posts: listResult.rows.map(mapPost),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

async function getPostBySlug(slug, includeDraft = false) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const post = store.posts.find((item) => item.slug === slug);
    if (!post) return null;
    if (!includeDraft && post.status !== 'published') return null;
    return { ...post };
  }
  const query = includeDraft
    ? `SELECT * FROM posts WHERE slug = $1 LIMIT 1`
    : `SELECT * FROM posts WHERE slug = $1 AND status = 'published' LIMIT 1`;
  const result = await sql.query(query, [slug]);
  return result.rows[0] ? mapPost(result.rows[0]) : null;
}

async function getPostById(id) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const post = store.posts.find((item) => Number(item.id) === Number(id));
    return post ? { ...post } : null;
  }
  const result = await sql`SELECT * FROM posts WHERE id = ${id} LIMIT 1`;
  return result.rows[0] ? mapPost(result.rows[0]) : null;
}

async function incrementPostViews(slug) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const post = store.posts.find((item) => item.slug === slug);
    if (post) {
      post.view_count += 1;
      post.updated_at = new Date().toISOString();
    }
    return;
  }
  await sql`UPDATE posts SET view_count = view_count + 1, updated_at = NOW() WHERE slug = ${slug}`;
}

function normalizeStatus(status) {
  if (status === 1 || status === '1' || status === 'published') {
    return 'published';
  }
  return 'draft';
}

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `post-${Date.now()}`;
}

function parseTags(tags) {
  if (Array.isArray(tags)) {
    return tags.filter(Boolean);
  }
  return String(tags || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function upsertPost(payload, existingId) {
  await ensureSchema();
  const title = String(payload.title || '').trim();
  const content = String(payload.content || '').trim();
  if (!title || !content) {
    throw new Error('标题和内容不能为空');
  }

  const slug = slugify(payload.slug || title);
  const summary = String(payload.summary || '').trim() || content.replace(/[#>*`-]/g, '').slice(0, 160);
  const status = normalizeStatus(payload.status);
  const author = String(payload.author || 'LiuEggy').trim() || 'LiuEggy';
  const categorySlug = String(payload.category || payload.category_slug || '').trim();
  const categoryName = String(payload.category_name || categorySlug || '').trim();
  const tags = parseTags(payload.tags);
  const coverImage = String(payload.cover_image || '').trim();

  if (!hasDatabase()) {
    const store = getMemoryStore();
    const duplicate = store.posts.find((item) => item.slug === slug && Number(item.id) !== Number(existingId || 0));
    if (duplicate) {
      throw new Error('文章 slug 已存在');
    }
    if (existingId) {
      const index = store.posts.findIndex((item) => Number(item.id) === Number(existingId));
      if (index < 0) throw new Error('文章不存在');
      store.posts[index] = {
        ...store.posts[index],
        slug,
        title,
        summary,
        content,
        cover_image: coverImage,
        status,
        author,
        category_slug: categorySlug,
        category_name: categoryName,
        tags,
        updated_at: new Date().toISOString()
      };
      return { ...store.posts[index] };
    }
    const post = {
      id: store.ids.posts++,
      slug,
      title,
      summary,
      content,
      cover_image: coverImage,
      status,
      author,
      category_slug: categorySlug,
      category_name: categoryName,
      tags,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.posts.push(post);
    return { ...post };
  }

  const duplicateQuery = existingId
    ? `SELECT id FROM posts WHERE slug = $1 AND id <> $2 LIMIT 1`
    : `SELECT id FROM posts WHERE slug = $1 LIMIT 1`;
  const duplicateParams = existingId ? [slug, existingId] : [slug];
  const duplicate = await sql.query(duplicateQuery, duplicateParams);
  if (duplicate.rows.length > 0) {
    throw new Error('文章 slug 已存在');
  }

  if (existingId) {
    const result = await sql`
      UPDATE posts
      SET slug = ${slug},
          title = ${title},
          summary = ${summary},
          content = ${content},
          cover_image = ${coverImage},
          status = ${status},
          author = ${author},
          category_slug = ${categorySlug},
          category_name = ${categoryName},
          tags = ${JSON.stringify(tags)}::jsonb,
          updated_at = NOW()
      WHERE id = ${existingId}
      RETURNING *
    `;
    return mapPost(result.rows[0]);
  }

  const result = await sql`
    INSERT INTO posts (slug, title, summary, content, cover_image, status, author, category_slug, category_name, tags)
    VALUES (${slug}, ${title}, ${summary}, ${content}, ${coverImage}, ${status}, ${author}, ${categorySlug}, ${categoryName}, ${JSON.stringify(tags)}::jsonb)
    RETURNING *
  `;
  return mapPost(result.rows[0]);
}

async function deletePost(id) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    store.posts = store.posts.filter((post) => Number(post.id) !== Number(id));
    return;
  }
  await sql`DELETE FROM posts WHERE id = ${id}`;
}

async function getPostStats() {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const total_posts = store.posts.length;
    const published_posts = store.posts.filter((post) => post.status === 'published').length;
    const draft_posts = store.posts.filter((post) => post.status === 'draft').length;
    const total_views = store.posts.reduce((sum, post) => sum + Number(post.view_count || 0), 0);
    const total_messages = store.guestbookComments.filter((item) => item.status === 1).length;
    return { total_posts, published_posts, draft_posts, total_views, total_messages };
  }
  const [postStats, messageStats] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int AS total_posts,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published_posts,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_posts,
        COALESCE(SUM(view_count), 0)::int AS total_views
      FROM posts
    `,
    sql`SELECT COUNT(*)::int AS total_messages FROM guestbook_comments WHERE status = 1`
  ]);

  const postRow = postStats.rows[0] || {};
  const messageRow = messageStats.rows[0] || {};
  return {
    total_posts: postRow.total_posts || 0,
    published_posts: postRow.published_posts || 0,
    draft_posts: postRow.draft_posts || 0,
    total_views: postRow.total_views || 0,
    total_messages: messageRow.total_messages || 0
  };
}

async function listCategories() {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const counter = new Map();
    for (const post of store.posts) {
      if (!post.category_slug) continue;
      const current = counter.get(post.category_slug) || { slug: post.category_slug, name: post.category_name || post.category_slug, post_count: 0 };
      current.post_count += 1;
      counter.set(post.category_slug, current);
    }
    return Array.from(counter.values()).sort((a, b) => b.post_count - a.post_count);
  }
  const result = await sql`
    SELECT category_slug AS slug, MAX(category_name) AS name, COUNT(*)::int AS post_count
    FROM posts
    WHERE category_slug <> ''
    GROUP BY category_slug
    ORDER BY post_count DESC, category_slug ASC
  `;
  return result.rows.map((row) => ({
    slug: row.slug,
    name: row.name || row.slug,
    post_count: row.post_count
  }));
}

async function listBlogComments(postSlug) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const rows = store.blogComments
      .filter((row) => row.post_slug === postSlug && row.status === 1)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const map = new Map();
    rows.forEach((row) => map.set(Number(row.id), { ...row, replies: [] }));
    const roots = [];
    map.forEach((comment) => {
      if (comment.parent_id && map.has(comment.parent_id)) {
        map.get(comment.parent_id).replies.push(comment);
      } else {
        roots.push(comment);
      }
    });
    return roots;
  }
  const result = await sql`
    SELECT id, post_slug, parent_id, name, content, likes, status, created_at, updated_at
    FROM blog_comments
    WHERE post_slug = ${postSlug} AND status = 1
    ORDER BY created_at ASC, id ASC
  `;

  const map = new Map();
  result.rows.forEach((row) => {
    map.set(Number(row.id), {
      id: Number(row.id),
      post_slug: row.post_slug,
      parent_id: row.parent_id ? Number(row.parent_id) : null,
      name: row.name,
      content: row.content,
      likes: Number(row.likes || 0),
      status: Number(row.status || 0),
      created_at: row.created_at,
      updated_at: row.updated_at,
      replies: []
    });
  });

  const roots = [];
  map.forEach((comment) => {
    if (comment.parent_id && map.has(comment.parent_id)) {
      map.get(comment.parent_id).replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

async function createBlogComment(payload) {
  await ensureSchema();
  const postSlug = String(payload.post_id || payload.post_slug || '').trim();
  const name = String(payload.name || '匿名用户').trim() || '匿名用户';
  const content = String(payload.content || '').trim();
  const parentId = payload.parent_id ? Number(payload.parent_id) : null;

  if (!postSlug) {
    throw new Error('文章ID不能为空');
  }
  if (!content) {
    throw new Error('评论内容不能为空');
  }
  if (content.length > 500) {
    throw new Error('评论内容不能超过500字');
  }

  const result = await sql`
    INSERT INTO blog_comments (post_slug, parent_id, name, content, status)
    VALUES (${postSlug}, ${parentId}, ${name.slice(0, 20)}, ${content}, 1)
    RETURNING id
  `;
  return Number(result.rows[0].id);
}

async function createBlogCommentWithMeta(payload, metadata = {}) {
  await ensureSchema();
  const postSlug = String(payload.post_id || payload.post_slug || '').trim();
  const name = String(payload.name || '匿名用户').trim() || '匿名用户';
  const content = String(payload.content || '').trim();
  const parentId = payload.parent_id ? Number(payload.parent_id) : null;
  const ipHash = createIpHash(`${metadata.forwardedFor || ''}|${metadata.userAgent || ''}`);

  if (!postSlug) {
    throw new Error('文章ID不能为空');
  }
  if (!content) {
    throw new Error('评论内容不能为空');
  }
  if (content.length > 500) {
    throw new Error('评论内容不能超过500字');
  }

  if (!hasDatabase()) {
    const store = getMemoryStore();
    const recent = store.blogComments.filter((item) => item.ip_hash === ipHash && Date.now() - new Date(item.created_at).getTime() < 10000);
    if (recent.length > 0) {
      throw new Error('评论过于频繁，请稍后再试');
    }
    const created = {
      id: store.ids.blogComments++,
      post_slug: postSlug,
      parent_id: parentId,
      ip_hash: ipHash,
      name: name.slice(0, 20),
      content,
      likes: 0,
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      replies: []
    };
    store.blogComments.push(created);
    return created.id;
  }

  const recent = await sql`
    SELECT COUNT(*)::int AS total
    FROM blog_comments
    WHERE ip_hash = ${ipHash}
      AND created_at > NOW() - INTERVAL '10 seconds'
  `;
  if ((recent.rows[0]?.total || 0) > 0) {
    throw new Error('评论过于频繁，请稍后再试');
  }

  const result = await sql`
    INSERT INTO blog_comments (post_slug, parent_id, ip_hash, name, content, status)
    VALUES (${postSlug}, ${parentId}, ${ipHash}, ${name.slice(0, 20)}, ${content}, 1)
    RETURNING id
  `;
  return Number(result.rows[0].id);
}

async function likeBlogComment(id) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const comment = store.blogComments.find((item) => Number(item.id) === Number(id));
    if (!comment) return 0;
    comment.likes += 1;
    comment.updated_at = new Date().toISOString();
    return comment.likes;
  }
  const result = await sql`
    UPDATE blog_comments
    SET likes = likes + 1, updated_at = NOW()
    WHERE id = ${id}
    RETURNING likes
  `;
  return Number(result.rows[0]?.likes || 0);
}

async function listGuestbookComments(includeHidden = false) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const rows = store.guestbookComments
      .filter((row) => includeHidden || row.status === 1)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const roots = [];
    const replyMap = new Map();
    rows.forEach((row) => {
      const comment = { ...row, replies: [] };
      replyMap.set(comment.id, comment);
    });
    rows.forEach((row) => {
      const current = replyMap.get(row.id);
      if (current.parent_id && replyMap.has(current.parent_id)) {
        replyMap.get(current.parent_id).replies.push(current);
      } else {
        roots.push(current);
      }
    });
    return roots;
  }
  const query = includeHidden
    ? `SELECT * FROM guestbook_comments ORDER BY created_at DESC, id DESC LIMIT 200`
    : `SELECT * FROM guestbook_comments WHERE status = 1 ORDER BY created_at DESC, id DESC LIMIT 200`;
  const result = await sql.query(query, []);
  const rows = result.rows.map(mapComment);
  const roots = [];
  const replyMap = new Map();

  rows.forEach((row) => {
    row.replies = [];
    replyMap.set(row.id, row);
  });
  rows.forEach((row) => {
    if (row.parent_id && replyMap.has(row.parent_id)) {
      replyMap.get(row.parent_id).replies.push(row);
    } else {
      roots.push(row);
    }
  });

  return roots;
}

function generateAvatarPath(name) {
  const index = (String(name || '').charCodeAt(0) || 0) % 12 + 1;
  return `/assets/avatars/avatar-${index}.svg`;
}

async function createGuestbookComment(payload, metadata = {}) {
  await ensureSchema();
  const name = String(payload.name || '').trim();
  const content = String(payload.content || '').trim();
  const contact = String(payload.contact || '').trim();
  const parentId = payload.parent_id ? Number(payload.parent_id) : null;
  const replyTo = String(payload.reply_to || '').trim();
  const ipHash = createIpHash(`${metadata.forwardedFor || ''}|${metadata.userAgent || ''}`);

  if (!name || name.length > 32) {
    throw new Error('称呼长度需 1~32');
  }
  if (!content || content.length > 500) {
    throw new Error('留言长度需 1~500');
  }

  if (!hasDatabase()) {
    const store = getMemoryStore();
    const recent = store.guestbookComments.filter((item) => item.ip_hash === ipHash && Date.now() - new Date(item.created_at).getTime() < 15000);
    if (recent.length > 0) throw new Error('提交太频繁，请稍后再试');
    const hourly = store.guestbookComments.filter((item) => item.ip_hash === ipHash && Date.now() - new Date(item.created_at).getTime() < 3600000);
    if (hourly.length >= 10) throw new Error('留言过于频繁，请 1 小时后再试');
    const created = {
      id: store.ids.guestbookComments++,
      public_id: createPublicId('msg'),
      ip_hash: ipHash,
      name,
      contact,
      content,
      avatar: generateAvatarPath(name),
      likes: 0,
      status: 1,
      parent_id: parentId,
      reply_to: replyTo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ts: Date.now(),
      replies: []
    };
    store.guestbookComments.push(created);
    return { id: created.id, public_id: created.public_id, avatar: created.avatar };
  }

  const recent = await sql`
    SELECT COUNT(*)::int AS total
    FROM guestbook_comments
    WHERE ip_hash = ${ipHash}
      AND created_at > NOW() - INTERVAL '15 seconds'
  `;
  if ((recent.rows[0]?.total || 0) > 0) {
    throw new Error('提交太频繁，请稍后再试');
  }

  const hourly = await sql`
    SELECT COUNT(*)::int AS total
    FROM guestbook_comments
    WHERE ip_hash = ${ipHash}
      AND created_at > NOW() - INTERVAL '1 hour'
  `;
  if ((hourly.rows[0]?.total || 0) >= 10) {
    throw new Error('留言过于频繁，请 1 小时后再试');
  }

  const publicId = createPublicId('msg');
  const avatar = generateAvatarPath(name);
  const result = await sql`
    INSERT INTO guestbook_comments (public_id, ip_hash, name, contact, content, avatar, likes, status, parent_id, reply_to)
    VALUES (${publicId}, ${ipHash}, ${name}, ${contact}, ${content}, ${avatar}, 0, 1, ${parentId}, ${replyTo})
    RETURNING id, public_id, avatar
  `;

  return {
    id: Number(result.rows[0].id),
    public_id: result.rows[0].public_id,
    avatar: result.rows[0].avatar
  };
}

async function likeGuestbookComment(publicId) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const numericId = Number(publicId);
    const comment = store.guestbookComments.find((item) => Number(item.id) === numericId || item.public_id === publicId);
    if (!comment) return 0;
    comment.likes += 1;
    comment.updated_at = new Date().toISOString();
    return comment.likes;
  }
  const numericId = Number(publicId);
  const result = Number.isFinite(numericId) && String(numericId) === String(publicId)
    ? await sql`
        UPDATE guestbook_comments
        SET likes = likes + 1, updated_at = NOW()
        WHERE id = ${numericId}
        RETURNING likes
      `
    : await sql`
        UPDATE guestbook_comments
        SET likes = likes + 1, updated_at = NOW()
        WHERE public_id = ${publicId}
        RETURNING likes
      `;
  return Number(result.rows[0]?.likes || 0);
}

async function getModerationStats(type) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const rows = type === 'blog' ? store.blogComments : store.guestbookComments;
    return {
      total: rows.length,
      pending: rows.filter((row) => Number(row.status) === 0).length,
      today: rows.filter((row) => new Date(row.created_at).toDateString() === new Date().toDateString()).length,
      likes: rows.reduce((sum, row) => sum + Number(row.likes || 0), 0)
    };
  }
  if (type === 'blog') {
    const result = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 0)::int AS pending,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today,
        COALESCE(SUM(likes), 0)::int AS likes
      FROM blog_comments
    `;
    return result.rows[0];
  }

  const result = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 0)::int AS pending,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today,
      COALESCE(SUM(likes), 0)::int AS likes
    FROM guestbook_comments
  `;
  return result.rows[0];
}

async function listModerationItems(type, filter) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const rows = type === 'blog' ? [...store.blogComments] : [...store.guestbookComments];
    let filtered = rows;
    if (filter === 'visible' || filter === 'published') filtered = rows.filter((row) => Number(row.status) === 1);
    if (filter === 'hidden' || filter === 'pending') filtered = rows.filter((row) => Number(row.status) === 0);
    return filtered
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((row) => ({
        id: type === 'blog' ? Number(row.id) : row.public_id,
        name: row.name,
        content: row.content,
        likes: Number(row.likes || 0),
        status: Number(row.status || 0),
        created_at: row.created_at,
        post_title: type === 'blog'
          ? (store.posts.find((post) => post.slug === row.post_slug)?.title || '')
          : ''
      }));
  }
  const isBlog = type === 'blog';
  const table = isBlog ? 'blog_comments' : 'guestbook_comments';
  const extraSelect = isBlog
    ? `, p.title AS post_title`
    : `, '' AS post_title, public_id`;
  const join = isBlog ? `LEFT JOIN posts p ON p.slug = c.post_slug` : '';
  const values = [];
  const clauses = [];

  if (filter === 'visible' || filter === 'published') {
    values.push(1);
    clauses.push(`c.status = $${values.length}`);
  } else if (filter === 'hidden' || filter === 'pending') {
    values.push(0);
    clauses.push(`c.status = $${values.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const query = `
    SELECT c.id, c.name, c.content, c.likes, c.status, c.created_at${extraSelect}
    FROM ${table} c
    ${join}
    ${where}
    ORDER BY c.created_at DESC, c.id DESC
    LIMIT 200
  `;
  const result = await sql.query(query, values);

  return result.rows.map((row) => ({
    id: isBlog ? Number(row.id) : row.public_id,
    name: row.name,
    content: row.content,
    likes: Number(row.likes || 0),
    status: Number(row.status || 0),
    created_at: row.created_at,
    post_title: row.post_title || ''
  }));
}

async function updateModerationStatus(type, id, status) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const list = type === 'blog' ? store.blogComments : store.guestbookComments;
    const target = list.find((item) => (type === 'blog' ? Number(item.id) === Number(id) : item.public_id === id));
    if (target) {
      target.status = Number(status);
      target.updated_at = new Date().toISOString();
    }
    return;
  }
  if (type === 'blog') {
    await sql`UPDATE blog_comments SET status = ${status}, updated_at = NOW() WHERE id = ${Number(id)}`;
    return;
  }
  await sql`UPDATE guestbook_comments SET status = ${status}, updated_at = NOW() WHERE public_id = ${id}`;
}

async function deleteModerationItem(type, id) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    if (type === 'blog') {
      store.blogComments = store.blogComments.filter((item) => Number(item.id) !== Number(id));
    } else {
      store.guestbookComments = store.guestbookComments.filter((item) => item.public_id !== id);
    }
    return;
  }
  if (type === 'blog') {
    await sql`DELETE FROM blog_comments WHERE id = ${Number(id)}`;
    return;
  }
  await sql`DELETE FROM guestbook_comments WHERE public_id = ${id}`;
}

async function getThemeConfig() {
  await ensureSchema();
  if (!hasDatabase()) {
    return JSON.parse(JSON.stringify(getMemoryStore().siteSettings.hero_themes));
  }
  const result = await sql`SELECT value FROM site_settings WHERE key = 'hero_themes' LIMIT 1`;
  return result.rows[0]?.value || defaultThemes;
}

async function saveThemeConfig(value) {
  await ensureSchema();
  if (!hasDatabase()) {
    getMemoryStore().siteSettings.hero_themes = JSON.parse(JSON.stringify(value));
    return;
  }
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('hero_themes', ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

function hashVisitor(input) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

async function trackSiteVisit(source) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    const visitorHash = hashVisitor(source);
    const today = new Date().toISOString().slice(0, 10);
    store.siteStats.pv += 1;
    if (!store.siteStats.visitors.has(visitorHash)) {
      store.siteStats.visitors.add(visitorHash);
      store.siteStats.uv_total += 1;
    }
    store.siteStats.dailyVisitors.set(today, store.siteStats.dailyVisitors.get(today) || new Set());
    store.siteStats.dailyVisitors.get(today).add(visitorHash);
    store.siteStats.dailyPv.set(today, (store.siteStats.dailyPv.get(today) || 0) + 1);
    return getSiteStats(today);
  }
  const visitorHash = hashVisitor(source);
  const today = new Date().toISOString().slice(0, 10);

  await sql`UPDATE site_stats SET pv = pv + 1, updated_at = NOW() WHERE id = 1`;
  await sql`
    INSERT INTO site_daily_stats (day, pv)
    VALUES (${today}, 1)
    ON CONFLICT (day)
    DO UPDATE SET pv = site_daily_stats.pv + 1
  `;

  const visitorInsert = await sql`
    INSERT INTO site_visitors (visitor_hash, first_seen, last_seen)
    VALUES (${visitorHash}, CURRENT_DATE, NOW())
    ON CONFLICT (visitor_hash)
    DO UPDATE SET last_seen = NOW()
    RETURNING (xmax = 0) AS inserted
  `;

  if (visitorInsert.rows[0]?.inserted) {
    await sql`UPDATE site_stats SET uv_total = uv_total + 1, updated_at = NOW() WHERE id = 1`;
  }

  await sql`
    INSERT INTO site_daily_visitors (day, visitor_hash)
    VALUES (${today}, ${visitorHash})
    ON CONFLICT (day, visitor_hash) DO NOTHING
  `;

  return getSiteStats(today);
}

async function getSiteStats(day = new Date().toISOString().slice(0, 10)) {
  await ensureSchema();
  if (!hasDatabase()) {
    const store = getMemoryStore();
    return {
      pv: store.siteStats.pv,
      uv_total: store.siteStats.uv_total,
      today_pv: store.siteStats.dailyPv.get(day) || 0,
      today_uv: store.siteStats.dailyVisitors.get(day)?.size || 0
    };
  }
  const [statsResult, dayResult, pvResult] = await Promise.all([
    sql`SELECT pv, uv_total FROM site_stats WHERE id = 1`,
    sql`
      SELECT
        COUNT(*)::int AS today_uv
      FROM site_daily_visitors
      WHERE day = ${day}
    `,
    sql`
      SELECT pv::int AS today_pv
      FROM site_daily_stats
      WHERE day = ${day}
    `
  ]);
  const statRow = statsResult.rows[0] || { pv: 0, uv_total: 0 };

  return {
    pv: Number(statRow.pv || 0),
    uv_total: Number(statRow.uv_total || 0),
    today_pv: Number(pvResult.rows[0]?.today_pv || 0),
    today_uv: Number(dayResult.rows[0]?.today_uv || 0)
  };
}

module.exports = {
  createGuestbookComment,
  createBlogComment,
  createBlogCommentWithMeta,
  deleteModerationItem,
  deletePost,
  ensureSchema,
  getModerationStats,
  getPostById,
  getPostBySlug,
  getPostStats,
  getSiteStats,
  getThemeConfig,
  incrementPostViews,
  likeBlogComment,
  likeGuestbookComment,
  listBlogComments,
  listCategories,
  listGuestbookComments,
  listModerationItems,
  listPosts,
  normalizeStatus,
  saveThemeConfig,
  slugify,
  trackSiteVisit,
  updateModerationStatus,
  upsertPost
};
