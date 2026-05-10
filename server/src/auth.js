import crypto from "node:crypto";
import {
  createSession,
  createUser,
  deleteSession,
  getSessionUser,
  getUserByEmail
} from "./db.js";

const SCRYPT_KEYLEN = 64;

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = storedHash.split(":");
  const candidateHash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(candidateHash, "hex"));
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    fitnessGoal: user.fitness_goal,
    level: user.level,
    title: user.title,
    xp: user.xp,
    xpTarget: user.xp_target,
    streak: user.streak,
    totalSteps: user.total_steps,
    totalMinutes: user.total_minutes,
    longestStreak: user.longest_streak
  };
}

export function registerUser({ name, email, password, fitnessGoal }) {
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    const error = new Error("该邮箱已注册");
    error.status = 409;
    throw error;
  }

  const user = createUser({
    name,
    email,
    passwordHash: hashPassword(password),
    fitnessGoal
  });

  const token = createToken();
  createSession(token, user.id);

  return { token, user: sanitizeUser(user) };
}

export function loginUser({ email, password }) {
  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    const error = new Error("邮箱或密码错误");
    error.status = 401;
    throw error;
  }

  const token = createToken();
  createSession(token, user.id);

  return { token, user: sanitizeUser(user) };
}

export function resolveUserByToken(token) {
  const user = getSessionUser(token);
  if (!user) {
    return null;
  }
  return sanitizeUser(user);
}

export function logoutUser(token) {
  deleteSession(token);
}
