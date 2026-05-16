import fs from 'fs';
import path from 'path';

const files = [
  'src/tests/routes/classRoutes.test.js',
  'src/tests/routes/conversationRoutes.test.js',
  'src/tests/routes/dailyLogRoutes.test.js',
  'src/tests/routes/dailyLogTemplateRoutes.test.js',
  'src/tests/routes/eventRoutes.test.js',
  'src/tests/routes/groupRoutes.test.js',
  'src/tests/routes/likeRoutes.test.js',
  'src/tests/routes/messageRoutes.test.js',
  'src/tests/routes/pickupAuthorizationRoutes.test.js',
  'src/tests/routes/pickupLogRoutes.test.js',
  'src/tests/routes/postRoutes.test.js',
  'src/tests/routes/schoolRoutes.test.js',
  'src/tests/routes/userRoutes.test.js'
];

files.forEach(file => {
  const filePath = path.resolve(file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace import
  content = content.replace(
    /import \{ (.+) \} from '@jest\/globals';/g,
    "import { $1 } from 'vitest';"
  );

  // Add app import if not present
  if (!content.includes("import app from '../../app.js';")) {
    content = content.replace(
      /import dotenv from 'dotenv';/g,
      "import dotenv from 'dotenv';\nimport app from '../../app.js';"
    );
  }

  // Remove PORT and BASE_URL
  content = content.replace(/const PORT = .+\n/g, '');
  content = content.replace(/const BASE_URL = .+\n/g, '');

  // Replace request(BASE_URL)
  content = content.replace(/request\(BASE_URL\)/g, 'request(app)');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Refactored ${file}`);
});
