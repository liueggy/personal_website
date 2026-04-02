const mysql = require('mysql2/promise');
const { sql } = require('@vercel/postgres');
const { ensureSchema } = require('../lib/db');
const { defaultThemes } = require('../lib/theme-defaults');

async function main() {
  const legacyUrl = process.env.LEGACY_DATABASE_URL;
  if (!legacyUrl) {
    throw new Error('Missing LEGACY_DATABASE_URL');
  }

  const connection = await mysql.createConnection(legacyUrl);
  await ensureSchema();

  await sql`
    INSERT INTO site_settings (key, value)
    VALUES ('hero_themes', ${JSON.stringify(defaultThemes)}::jsonb)
    ON CONFLICT (key) DO NOTHING
  `;

  const [posts] = await connection.query(`
    SELECT id, slug, title, summary, content, cover_image, status, author, view_count, created_at, updated_at
    FROM blog_posts
  `);

  for (const post of posts) {
    await sql`
      INSERT INTO posts (id, slug, title, summary, content, cover_image, status, author, view_count, created_at, updated_at)
      VALUES (
        ${post.id},
        ${post.slug},
        ${post.title},
        ${post.summary || ''},
        ${post.content},
        ${post.cover_image || ''},
        ${post.status || 'draft'},
        ${post.author || 'LiuEggy'},
        ${post.view_count || 0},
        ${post.created_at},
        ${post.updated_at || post.created_at}
      )
      ON CONFLICT (id) DO UPDATE
      SET slug = EXCLUDED.slug,
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          content = EXCLUDED.content,
          cover_image = EXCLUDED.cover_image,
          status = EXCLUDED.status,
          author = EXCLUDED.author,
          view_count = EXCLUDED.view_count,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at
    `;
  }

  const [blogComments] = await connection.query(`
    SELECT id, COALESCE(post_slug, post_id) AS post_slug, parent_id, name, content, likes, status, created_at, updated_at
    FROM blog_comments
  `);

  for (const comment of blogComments) {
    await sql`
      INSERT INTO blog_comments (id, post_slug, parent_id, name, content, likes, status, created_at, updated_at)
      VALUES (
        ${comment.id},
        ${String(comment.post_slug)},
        ${comment.parent_id || null},
        ${comment.name || '匿名用户'},
        ${comment.content},
        ${comment.likes || 0},
        ${comment.status ?? 1},
        ${comment.created_at},
        ${comment.updated_at || comment.created_at}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  const [guestbook] = await connection.query(`
    SELECT id, name, contact, content, avatar, likes, status, parent_id, reply_to, created_at, updated_at
    FROM comments
  `);

  for (const comment of guestbook) {
    const publicId = `legacy_${comment.id}`;
    await sql`
      INSERT INTO guestbook_comments (id, public_id, name, contact, content, avatar, likes, status, parent_id, reply_to, created_at, updated_at)
      VALUES (
        ${comment.id},
        ${publicId},
        ${comment.name},
        ${comment.contact || ''},
        ${comment.content},
        ${comment.avatar || ''},
        ${comment.likes || 0},
        ${comment.status ?? 1},
        ${comment.parent_id || null},
        ${comment.reply_to || ''},
        ${comment.created_at},
        ${comment.updated_at || comment.created_at}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  await connection.end();
  console.log(`Migrated ${posts.length} posts, ${blogComments.length} blog comments, ${guestbook.length} guestbook entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
