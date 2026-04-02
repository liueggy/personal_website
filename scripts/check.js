const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'api/admin.js',
  'api/blog.js',
  'api/blog-comments.js',
  'api/guestbook.js',
  'api/stats.js',
  'api/theme.js',
  'lib/db.js',
  'vercel.json',
  'package.json'
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));

if (missing.length > 0) {
  console.error('Missing required files:\n' + missing.join('\n'));
  process.exit(1);
}

console.log('Basic file check passed.');
