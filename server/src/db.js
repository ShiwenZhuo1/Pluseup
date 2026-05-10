import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const dataDir = path.resolve(process.cwd(), "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "dongci.sqlite");
export const db = new DatabaseSync(dbPath);
const SCRYPT_KEYLEN = 64;

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    fitness_goal TEXT NOT NULL DEFAULT '建立长期习惯',
    level INTEGER NOT NULL DEFAULT 5,
    title TEXT NOT NULL DEFAULT '校园运动家',
    xp INTEGER NOT NULL DEFAULT 820,
    xp_target INTEGER NOT NULL DEFAULT 1000,
    streak INTEGER NOT NULL DEFAULT 6,
    total_steps INTEGER NOT NULL DEFAULT 186240,
    total_minutes INTEGER NOT NULL DEFAULT 2550,
    longest_streak INTEGER NOT NULL DEFAULT 12,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    target_date TEXT NOT NULL,
    target_goal TEXT NOT NULL,
    height_cm REAL,
    weight_kg REAL,
    ai_recommendation TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cadence TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 1,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS social_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    likes_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS social_post_likes (
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS social_post_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

ensureColumn("plans", "height_cm", "REAL");
ensureColumn("plans", "weight_kg", "REAL");
ensureColumn("social_posts", "likes_count", "INTEGER NOT NULL DEFAULT 0");

function hashPassword(password, salt = "dongci-seed-salt") {
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

function seedSocialData() {
  const seededUsers = [
    {
      name: "Alex",
      email: "alex@dongci.app",
      fitnessGoal: "增肌",
      title: "力量节奏官",
      level: 12,
      xp: 1820,
      xpTarget: 2200,
      streak: 14,
      totalSteps: 241300,
      totalMinutes: 5220,
      longestStreak: 21
    },
    {
      name: "Emma",
      email: "emma@dongci.app",
      fitnessGoal: "提升耐力",
      title: "夜跑领航员",
      level: 11,
      xp: 1680,
      xpTarget: 2000,
      streak: 12,
      totalSteps: 226420,
      totalMinutes: 4870,
      longestStreak: 16
    },
    {
      name: "Mia",
      email: "mia@dongci.app",
      fitnessGoal: "减脂",
      title: "校园自律达人",
      level: 10,
      xp: 1510,
      xpTarget: 1900,
      streak: 10,
      totalSteps: 213560,
      totalMinutes: 4310,
      longestStreak: 14
    },
    {
      name: "Jason",
      email: "jason@dongci.app",
      fitnessGoal: "建立习惯",
      title: "晨练行动派",
      level: 9,
      xp: 1370,
      xpTarget: 1700,
      streak: 8,
      totalSteps: 198740,
      totalMinutes: 3880,
      longestStreak: 11
    },
    {
      name: "小林",
      email: "xiaolin@dongci.app",
      fitnessGoal: "缓解压力",
      title: "慢跑探索者",
      level: 8,
      xp: 1280,
      xpTarget: 1600,
      streak: 7,
      totalSteps: 184220,
      totalMinutes: 3410,
      longestStreak: 9
    }
  ];

  const insertSeedUser = db.prepare(`
    INSERT INTO users (
      name,
      email,
      password_hash,
      fitness_goal,
      level,
      title,
      xp,
      xp_target,
      streak,
      total_steps,
      total_minutes,
      longest_streak
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const user of seededUsers) {
    const existingUser = getUserByEmail(user.email);

    if (!existingUser) {
      insertSeedUser.run(
        user.name,
        user.email,
        hashPassword("dongci123"),
        user.fitnessGoal,
        user.level,
        user.title,
        user.xp,
        user.xpTarget,
        user.streak,
        user.totalSteps,
        user.totalMinutes,
        user.longestStreak
      );
    }
  }

  const seededPosts = [
    { email: "alex@dongci.app", content: "腿部日终于练完，深蹲和硬拉都比上周稳了，晚上再去操场走 20 分钟放松一下。" },
    { email: "emma@dongci.app", content: "今天在东区操场跑了 6 公里，后半段配速稳住之后真的会越来越轻松。" },
    { email: "mia@dongci.app", content: "中午抽空去游泳馆游了 30 分钟，比刷手机舒服多了，下午精神也更好。" },
    { email: "jason@dongci.app", content: "打卡第 8 天，早起去体育馆热身 15 分钟，发现只要开始了就没那么难。" },
    { email: "xiaolin@dongci.app", content: "今天不追求强度，就沿着图书馆外圈慢跑 + 拉伸，整个人压力小了很多。" }
  ];

  const insertSeedPost = db.prepare(`
    INSERT INTO social_posts (user_id, content)
    VALUES (?, ?)
  `);

  for (const post of seededPosts) {
    const author = getUserByEmail(post.email);
    const existingPost = db
      .prepare("SELECT id FROM social_posts WHERE user_id = ? AND content = ?")
      .get(author.id, post.content);

    if (!existingPost) {
      insertSeedPost.run(author.id, post.content);
    }
  }

  const seededLikes = [
    { liker: "emma@dongci.app", author: "alex@dongci.app" },
    { liker: "mia@dongci.app", author: "alex@dongci.app" },
    { liker: "jason@dongci.app", author: "emma@dongci.app" },
    { liker: "xiaolin@dongci.app", author: "emma@dongci.app" },
    { liker: "alex@dongci.app", author: "mia@dongci.app" }
  ];

  for (const like of seededLikes) {
    const liker = getUserByEmail(like.liker);
    const author = getUserByEmail(like.author);
    const post = db
      .prepare("SELECT id FROM social_posts WHERE user_id = ? ORDER BY id DESC LIMIT 1")
      .get(author.id);
    const existingLike = db
      .prepare("SELECT 1 FROM social_post_likes WHERE post_id = ? AND user_id = ?")
      .get(post.id, liker.id);

    if (!existingLike) {
      db.prepare("INSERT INTO social_post_likes (post_id, user_id) VALUES (?, ?)").run(post.id, liker.id);
    }
  }

  const seededReplies = [
    { author: "emma@dongci.app", target: "alex@dongci.app", content: "这个节奏好稳，腿部日后再走 20 分钟真的很舒服。" },
    { author: "xiaolin@dongci.app", target: "emma@dongci.app", content: "6 公里太强了，我最近也在尝试把夜跑拉长一点。" },
    { author: "alex@dongci.app", target: "mia@dongci.app", content: "游泳放在恢复日太合理了，第二天状态会轻松很多。" }
  ];

  for (const reply of seededReplies) {
    const author = getUserByEmail(reply.author);
    const target = getUserByEmail(reply.target);
    const post = db
      .prepare("SELECT id FROM social_posts WHERE user_id = ? ORDER BY id DESC LIMIT 1")
      .get(target.id);
    const existingReply = db
      .prepare("SELECT id FROM social_post_replies WHERE post_id = ? AND user_id = ? AND content = ?")
      .get(post.id, author.id, reply.content);

    if (!existingReply) {
      db.prepare("INSERT INTO social_post_replies (post_id, user_id, content) VALUES (?, ?, ?)").run(post.id, author.id, reply.content);
    }
  }

  db.exec(`
    UPDATE social_posts
    SET likes_count = (
      SELECT COUNT(*)
      FROM social_post_likes
      WHERE social_post_likes.post_id = social_posts.id
    )
  `);
}

export function createUser(user) {
  const statement = db.prepare(`
    INSERT INTO users (
      name,
      email,
      password_hash,
      fitness_goal,
      level,
      title,
      xp,
      xp_target,
      streak,
      total_steps,
      total_minutes,
      longest_streak
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    user.name,
    user.email,
    user.passwordHash,
    user.fitnessGoal,
    1,
    "新手动次玩家",
    120,
    500,
    1,
    2400,
    45,
    1
  );

  return getUserById(result.lastInsertRowid);
}

export function getUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

export function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

seedSocialData();

export function createSession(token, userId) {
  db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, userId);
}

export function getSessionUser(token) {
  return db
    .prepare(`
      SELECT users.*
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token = ?
    `)
    .get(token);
}

export function deleteSession(token) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function getActivePlanByUserId(userId) {
  return db
    .prepare(`
      SELECT *
      FROM plans
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `)
    .get(userId);
}

export function getTasksByPlanId(planId) {
  return db
    .prepare(`
      SELECT *
      FROM tasks
      WHERE plan_id = ?
      ORDER BY id ASC
    `)
    .all(planId);
}

export function deactivatePlansByUserId(userId) {
  db.prepare("UPDATE plans SET is_active = 0 WHERE user_id = ?").run(userId);
}

export function createPlan({
  userId,
  purpose,
  targetDate,
  targetGoal,
  heightCm,
  weightKg,
  aiRecommendation
}) {
  const result = db
    .prepare(`
      INSERT INTO plans (
        user_id,
        purpose,
        target_date,
        target_goal,
        height_cm,
        weight_kg,
        ai_recommendation
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(userId, purpose, targetDate, targetGoal, heightCm, weightKg, aiRecommendation);

  return db.prepare("SELECT * FROM plans WHERE id = ?").get(result.lastInsertRowid);
}

export function getPlansByUserId(userId) {
  return db
    .prepare(`
      SELECT *
      FROM plans
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)
    .all(userId);
}

export function createTasks(planId, tasks) {
  const statement = db.prepare(`
    INSERT INTO tasks (plan_id, title, description, cadence, points)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const task of tasks) {
    statement.run(planId, task.title, task.description, task.cadence, task.points || 1);
  }

  return getTasksByPlanId(planId);
}

export function getTaskById(taskId) {
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
}

export function getPlanById(planId) {
  return db.prepare("SELECT * FROM plans WHERE id = ?").get(planId);
}

export function completeTask(taskId) {
  db.prepare(`
    UPDATE tasks
    SET completed = 1, completed_at = CURRENT_TIMESTAMP
    WHERE id = ? AND completed = 0
  `).run(taskId);

  return getTaskById(taskId);
}

export function incrementUserXp(userId, amount) {
  db.prepare(`
    UPDATE users
    SET xp = xp + ?, total_minutes = total_minutes + 10
    WHERE id = ?
  `).run(amount, userId);

  return getUserById(userId);
}

export function createSocialPost({ userId, content }) {
  const result = db
    .prepare(`
      INSERT INTO social_posts (user_id, content)
      VALUES (?, ?)
    `)
    .run(userId, content);

  return db
    .prepare(`
      SELECT social_posts.*, users.name
      FROM social_posts
      JOIN users ON users.id = social_posts.user_id
      WHERE social_posts.id = ?
    `)
    .get(result.lastInsertRowid);
}

export function getSocialPosts(limit = 30) {
  return db
    .prepare(`
      SELECT social_posts.*, users.name
      FROM social_posts
      JOIN users ON users.id = social_posts.user_id
      ORDER BY social_posts.created_at DESC, social_posts.id DESC
      LIMIT ?
    `)
    .all(limit);
}

export function getSocialPostById(postId) {
  return db
    .prepare(`
      SELECT social_posts.*, users.name
      FROM social_posts
      JOIN users ON users.id = social_posts.user_id
      WHERE social_posts.id = ?
    `)
    .get(postId);
}

export function getRepliesByPostIds(postIds) {
  if (!postIds.length) {
    return [];
  }

  const placeholders = postIds.map(() => "?").join(", ");
  return db
    .prepare(`
      SELECT social_post_replies.*, users.name
      FROM social_post_replies
      JOIN users ON users.id = social_post_replies.user_id
      WHERE social_post_replies.post_id IN (${placeholders})
      ORDER BY social_post_replies.created_at ASC, social_post_replies.id ASC
    `)
    .all(...postIds);
}

export function getLikedPostIdsByUserId(userId) {
  return db
    .prepare(`
      SELECT post_id
      FROM social_post_likes
      WHERE user_id = ?
    `)
    .all(userId)
    .map((row) => row.post_id);
}

export function toggleSocialPostLike(postId, userId) {
  const existing = db
    .prepare("SELECT 1 FROM social_post_likes WHERE post_id = ? AND user_id = ?")
    .get(postId, userId);

  if (existing) {
    db.prepare("DELETE FROM social_post_likes WHERE post_id = ? AND user_id = ?").run(postId, userId);
  } else {
    db.prepare("INSERT INTO social_post_likes (post_id, user_id) VALUES (?, ?)").run(postId, userId);
  }

  db.prepare(`
    UPDATE social_posts
    SET likes_count = (
      SELECT COUNT(*)
      FROM social_post_likes
      WHERE social_post_likes.post_id = social_posts.id
    )
    WHERE id = ?
  `).run(postId);

  return {
    liked: !existing,
    likesCount: db.prepare("SELECT likes_count FROM social_posts WHERE id = ?").get(postId).likes_count
  };
}

export function createSocialReply({ postId, userId, content }) {
  const result = db
    .prepare(`
      INSERT INTO social_post_replies (post_id, user_id, content)
      VALUES (?, ?, ?)
    `)
    .run(postId, userId, content);

  return db
    .prepare(`
      SELECT social_post_replies.*, users.name
      FROM social_post_replies
      JOIN users ON users.id = social_post_replies.user_id
      WHERE social_post_replies.id = ?
    `)
    .get(result.lastInsertRowid);
}

export function getRankedUsers() {
  return db
    .prepare(`
      SELECT id, name, xp, streak, level, title
      FROM users
      ORDER BY xp DESC, streak DESC, total_minutes DESC, created_at ASC
    `)
    .all();
}
