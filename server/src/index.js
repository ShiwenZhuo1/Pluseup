import express from "express";
import cors from "cors";
import {
  buildCheckin,
  buildExplore,
  buildHome,
  buildHomeFromLiveData,
  buildProfile,
  buildSocial
} from "./mockData.js";
import "./db.js";
import {
  completeTask,
  createSocialReply,
  createSocialPost,
  createPlan,
  createTasks,
  deactivatePlansByUserId,
  getActivePlanByUserId,
  getPlanById,
  getPlansByUserId,
  getRankedUsers,
  getRepliesByPostIds,
  getSocialPostById,
  getSocialPosts,
  getLikedPostIdsByUserId,
  getTaskById,
  getTasksByPlanId,
  incrementUserXp,
  toggleSocialPostLike
} from "./db.js";
import {
  loginUser,
  logoutUser,
  registerUser,
  resolveUserByToken
} from "./auth.js";
import { generatePlanRecommendation } from "./ai.js";

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

function getBearerToken(req) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) {
    return "";
  }
  return authorization.slice(7);
}

function getOptionalUser(req) {
  const token = getBearerToken(req);
  return resolveUserByToken(token);
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  const user = resolveUserByToken(token);

  if (!user) {
    res.status(401).json({ message: "请先登录" });
    return;
  }

  req.user = user;
  req.token = token;
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "dongci-server" });
});

app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, password, fitnessGoal = "建立长期习惯" } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: "姓名、邮箱和密码不能为空" });
      return;
    }

    const payload = registerUser({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: String(password),
      fitnessGoal: String(fitnessGoal)
    });

    res.status(201).json(payload);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "注册失败" });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "邮箱和密码不能为空" });
      return;
    }

    const payload = loginUser({
      email: String(email).trim().toLowerCase(),
      password: String(password)
    });

    res.json(payload);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "登录失败" });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  logoutUser(req.token);
  res.json({ ok: true });
});

app.get("/api/home", (req, res) => {
  const user = getOptionalUser(req);

  if (!user || !user.id) {
    res.json(buildHome(user));
    return;
  }

  const plan = getActivePlanByUserId(user.id);
  const tasks = plan ? getTasksByPlanId(plan.id) : [];
  const rankedUsers = getRankedUsers();
  const rankingItems = rankedUsers.slice(0, 5).map((entry, index) => ({
    rank: index + 1,
    name: entry.name,
    score: `${entry.xp} XP`
  }));
  const rankIndex = rankedUsers.findIndex((entry) => entry.id === user.id);
  const currentUserRank = rankIndex === -1
    ? null
    : {
        rank: rankIndex + 1,
        xp: rankedUsers[rankIndex].xp,
        streak: rankedUsers[rankIndex].streak
      };

  if (currentUserRank && currentUserRank.rank > 5) {
    rankingItems.push({
      rank: currentUserRank.rank,
      name: `${user.name}（你）`,
      score: `${currentUserRank.xp} XP`
    });
  }

  res.json(buildHomeFromLiveData(user, { tasks, rankingItems, currentUserRank }));
});

app.get("/api/explore", (req, res) => {
  res.json(buildExplore(getOptionalUser(req)));
});

app.get("/api/checkin", (req, res) => {
  const user = getOptionalUser(req);

  if (!user || !user.id) {
    res.json({
      ...buildCheckin(user),
      hasPlan: false,
      requiresLogin: true,
    planner: {
      purpose: "",
      targetDate: "",
      targetGoal: "",
      heightCm: "",
      weightKg: ""
    },
    plan: null,
    tasks: [],
    plans: []
  });
  return;
}

  const plan = getActivePlanByUserId(user.id);
  const tasks = plan ? getTasksByPlanId(plan.id) : [];
  const plans = getPlansByUserId(user.id);

  res.json({
    hasPlan: Boolean(plan),
    requiresLogin: false,
    intro: {
      title: plan ? "开始执行今日计划" : "先决定要不要制定新的计划",
      description: plan
        ? "你已经有当前生效的训练计划，可以直接进入今天的打卡任务。"
        : "如果当前没有计划，就先开始制定你的第一个计划。"
    },
    planner: {
      purpose: "",
      targetDate: "",
      targetGoal: "",
      heightCm: "",
      weightKg: ""
    },
    plan: plan
      ? {
          id: plan.id,
          purpose: plan.purpose,
          targetDate: plan.target_date,
          targetGoal: plan.target_goal,
          heightCm: plan.height_cm,
          weightKg: plan.weight_kg,
          recommendation: plan.ai_recommendation
        }
      : null,
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      cadence: task.cadence,
      points: task.points,
      completed: Boolean(task.completed)
    })),
    plans: plans.map((item) => ({
      id: item.id,
      purpose: item.purpose,
      targetDate: item.target_date,
      targetGoal: item.target_goal,
      heightCm: item.height_cm,
      weightKg: item.weight_kg,
      active: Boolean(item.is_active)
    }))
  });
});

app.post("/api/plans/recommendation", requireAuth, async (req, res) => {
  try {
    const { purpose, targetDate, targetGoal, heightCm, weightKg } = req.body;

    if (!purpose || !targetDate || !targetGoal || !heightCm || !weightKg) {
      res.status(400).json({ message: "请完整填写运动目的、日期、目标、身高和体重" });
      return;
    }

    const recommendation = await generatePlanRecommendation({
      purpose: String(purpose),
      targetDate: String(targetDate),
      targetGoal: String(targetGoal),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg)
    });

    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ message: error.message || "生成建议失败" });
  }
});

app.post("/api/plans", requireAuth, (req, res) => {
  try {
    const { purpose, targetDate, targetGoal, heightCm, weightKg, recommendation, tasks } = req.body;

    if (!purpose || !targetDate || !targetGoal || !heightCm || !weightKg) {
      res.status(400).json({ message: "计划信息不完整" });
      return;
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      res.status(400).json({ message: "请至少创建一张打卡任务卡" });
      return;
    }

    deactivatePlansByUserId(req.user.id);
    const plan = createPlan({
      userId: req.user.id,
      purpose: String(purpose),
      targetDate: String(targetDate),
      targetGoal: String(targetGoal),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      aiRecommendation: String(recommendation || "")
    });

    const createdTasks = createTasks(
      plan.id,
      tasks.map((task) => ({
        title: String(task.title || ""),
        description: String(task.description || ""),
        cadence: String(task.cadence || ""),
        points: 1
      }))
    );

    res.status(201).json({
      plan,
      tasks: createdTasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "创建计划失败" });
  }
});

app.post("/api/tasks/:taskId/complete", requireAuth, (req, res) => {
  const taskId = Number(req.params.taskId);
  const task = getTaskById(taskId);

  if (!task) {
    res.status(404).json({ message: "任务不存在" });
    return;
  }

  const plan = getPlanById(task.plan_id);
  if (!plan || plan.user_id !== req.user.id) {
    res.status(403).json({ message: "无权操作这个任务" });
    return;
  }

  if (!task.completed) {
    completeTask(taskId);
    const updatedUser = incrementUserXp(req.user.id, task.points || 1);
    res.json({
      ok: true,
      pointsEarned: task.points || 1,
      userXp: updatedUser.xp
    });
    return;
  }

  res.json({
    ok: true,
    pointsEarned: 0,
    userXp: req.user.xp
  });
});

app.get("/api/social", (req, res) => {
  const user = getOptionalUser(req);
  const rawPosts = getSocialPosts();
  const likedPostIds = user ? new Set(getLikedPostIdsByUserId(user.id)) : new Set();
  const replies = getRepliesByPostIds(rawPosts.map((post) => post.id));
  const repliesByPostId = new Map();

  for (const reply of replies) {
    const list = repliesByPostId.get(reply.post_id) || [];
    list.push({
      id: reply.id,
      author: reply.name,
      content: reply.content,
      meta: new Date(reply.created_at).toLocaleString("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    });
    repliesByPostId.set(reply.post_id, list);
  }

  const posts = rawPosts.map((post) => ({
    id: post.id,
    author: post.name,
    content: post.content,
    meta: new Date(post.created_at).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    likesCount: post.likes_count || 0,
    liked: likedPostIds.has(post.id),
    replies: repliesByPostId.get(post.id) || []
  }));

  const rankedUsers = getRankedUsers();
  const rankingItems = rankedUsers.slice(0, 5).map((entry, index) => ({
    rank: index + 1,
    name: entry.name,
    value: `${entry.xp} XP · ${entry.streak} 天 streak`
  }));

  const currentUserRank = user
    ? (() => {
        const rankIndex = rankedUsers.findIndex((entry) => entry.id === user.id);
        if (rankIndex === -1) {
          return null;
        }

        const matched = rankedUsers[rankIndex];
        return {
          rank: rankIndex + 1,
          xp: matched.xp,
          streak: matched.streak
        };
      })()
    : null;

  if (currentUserRank && currentUserRank.rank > 5 && user) {
    rankingItems.push({
      rank: currentUserRank.rank,
      name: `${user.name}（你）`,
      value: `${currentUserRank.xp} XP · ${currentUserRank.streak} 天 streak`
    });
  }

  res.json(buildSocial(user, posts, rankingItems, currentUserRank));
});

app.post("/api/social/posts", requireAuth, (req, res) => {
  try {
    const content = String(req.body.content || "").trim();

    if (!content) {
      res.status(400).json({ message: "帖子内容不能为空" });
      return;
    }

    if (content.length > 280) {
      res.status(400).json({ message: "帖子内容请控制在 280 字以内" });
      return;
    }

    const post = createSocialPost({
      userId: req.user.id,
      content
    });

    res.status(201).json({
      id: post.id,
      author: post.name,
      content: post.content,
      meta: "刚刚发布"
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "发帖失败" });
  }
});

app.post("/api/social/posts/:postId/like", requireAuth, (req, res) => {
  const postId = Number(req.params.postId);
  const post = getSocialPostById(postId);

  if (!post) {
    res.status(404).json({ message: "帖子不存在" });
    return;
  }

  const result = toggleSocialPostLike(postId, req.user.id);
  res.json(result);
});

app.post("/api/social/posts/:postId/replies", requireAuth, (req, res) => {
  const postId = Number(req.params.postId);
  const post = getSocialPostById(postId);

  if (!post) {
    res.status(404).json({ message: "帖子不存在" });
    return;
  }

  const content = String(req.body.content || "").trim();

  if (!content) {
    res.status(400).json({ message: "回复内容不能为空" });
    return;
  }

  if (content.length > 180) {
    res.status(400).json({ message: "回复请控制在 180 字以内" });
    return;
  }

  const reply = createSocialReply({
    postId,
    userId: req.user.id,
    content
  });

  res.status(201).json({
    id: reply.id,
    author: reply.name,
    content: reply.content,
    meta: "刚刚回复"
  });
});

app.get("/api/profile", (req, res) => {
  res.json(buildProfile(getOptionalUser(req)));
});

app.listen(port, () => {
  console.log(`动次 API running on http://localhost:${port}`);
});
