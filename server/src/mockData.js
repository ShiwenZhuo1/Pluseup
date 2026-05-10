const guestUser = {
  id: 0,
  name: "游客",
  email: "guest@dongci.app",
  fitnessGoal: "建立长期习惯",
  level: 1,
  title: "新手动次玩家",
  xp: 120,
  xpTarget: 500,
  streak: 1,
  totalSteps: 2400,
  totalMinutes: 45,
  longestStreak: 1
};

function withGuest(user) {
  return user || guestUser;
}

export function buildHome(user) {
  const safeUser = withGuest(user);
  return {
    growth: {
      streak: `${safeUser.streak} Day Streak`,
      level: `Lv.${safeUser.level}`,
      title: safeUser.title,
      xp: `${safeUser.xp} / ${safeUser.xpTarget} XP`
    },
    goals: {
      completed: 1,
      total: 3,
      reward: "+80 XP",
      items: [
        { name: "步行 4000 步", progress: "3100 / 4000", category: "打卡目标" },
        { name: "完成 20 分钟运动", progress: "已完成", category: "成长任务" },
        { name: "晚上 12 点前睡觉", progress: "待完成", category: "作息习惯" }
      ]
    },
    quickStart: {
      button: "开始今日运动",
      route: "宿舍 -> 操场 -> 图书馆",
      target: "30 分钟｜4000 步"
    },
    ai: {
      title: "AI 今日建议",
      message: `今天很适合继续保持节奏，${safeUser.name} 再坚持一天，就更接近新的等级奖励。`
    },
    ranking: [
      { rank: 1, name: "Alex", score: "1420 XP" },
      { rank: 2, name: safeUser.name, score: `${safeUser.xp} XP` },
      { rank: 3, name: "小林", score: "1340 XP" }
    ]
  };
}

export function buildHomeFromLiveData(user, { tasks = [], rankingItems = [], currentUserRank = null } = {}) {
  const safeUser = withGuest(user);
  const completed = tasks.filter((task) => task.completed).length;
  const mappedTasks = tasks.length
    ? tasks.slice(0, 3).map((task) => ({
        name: task.title,
        progress: task.completed ? "已完成" : task.cadence || "待完成",
        category: "今日打卡"
      }))
    : [
        { name: "步行 4000 步", progress: "3100 / 4000", category: "打卡目标" },
        { name: "完成 20 分钟运动", progress: "已完成", category: "成长任务" },
        { name: "晚上 12 点前睡觉", progress: "待完成", category: "作息习惯" }
      ];

  return {
    growth: {
      streak: `${safeUser.streak} Day Streak`,
      level: `Lv.${safeUser.level}`,
      title: safeUser.title,
      xp: `${safeUser.xp} / ${safeUser.xpTarget} XP`
    },
    goals: {
      completed,
      total: mappedTasks.length,
      reward: `+${Math.max(mappedTasks.length - completed, 1)} XP`,
      items: mappedTasks
    },
    quickStart: {
      button: "进入今日打卡",
      route: tasks.length ? "按当前计划开始执行今天的任务" : "先制定你的第一份训练计划",
      target: tasks.length ? `${mappedTasks.length} 项待处理` : "先创建计划"
    },
    ai: {
      title: "AI 今日建议",
      message: currentUserRank
        ? `${safeUser.name} 目前排第 ${currentUserRank.rank}，再完成一点今天的任务，就有机会继续往前追。`
        : `今天很适合继续保持节奏，${safeUser.name} 再坚持一天，就更接近新的等级奖励。`
    },
    ranking: rankingItems,
    rankingMeta: currentUserRank
      ? {
          topName: rankingItems[0]?.name || "Alex",
          yourRank: currentUserRank.rank,
          yourScore: `${currentUserRank.xp} XP`
        }
      : {
          topName: rankingItems[0]?.name || "Alex",
          yourRank: null,
          yourScore: `${safeUser.xp} XP`
        }
  };
}

export function buildExplore() {
  return {
    hero: {
      title: "找到附近能立刻开始运动的地方",
      description: "这个页面负责搜索附近场馆、按距离筛选、查看设施位置，并一键开始导航。"
    },
    map: {
      center: [113.398498, 23.055276],
      zoom: 15
    },
    filters: {
      minDistance: 0.5,
      maxDistance: 5,
      defaultDistance: 2
    },
    places: [
      {
        id: 1,
        name: "Campus Fit 健身房",
        type: "gym",
        typeLabel: "健身房",
        distanceKm: 0.6,
        address: "校园北区 1 号楼旁",
        features: "器械训练 · 自由重量区",
        position: [113.399244, 23.054872]
      },
      {
        id: 2,
        name: "东区体育馆",
        type: "stadium",
        typeLabel: "体育馆",
        distanceKm: 1.1,
        address: "东区操场西侧",
        features: "羽毛球 · 篮球 · 跑道",
        position: [113.401154, 23.05602]
      },
      {
        id: 3,
        name: "校园游泳馆",
        type: "swim",
        typeLabel: "游泳馆",
        distanceKm: 1.6,
        address: "生活区南门旁",
        features: "25m 标准泳道 · 恢复训练",
        position: [113.396926, 23.053941]
      },
      {
        id: 4,
        name: "力量工场健身馆",
        type: "gym",
        typeLabel: "健身房",
        distanceKm: 2.2,
        address: "大学城商业街 B 座",
        features: "团课 · 力量区 · 跑步机",
        position: [113.404126, 23.058451]
      },
      {
        id: 5,
        name: "南区综合体育馆",
        type: "stadium",
        typeLabel: "体育馆",
        distanceKm: 2.8,
        address: "南区宿舍步行 8 分钟",
        features: "篮球场 · 室内跑道",
        position: [113.394833, 23.051772]
      },
      {
        id: 6,
        name: "城市泳动中心",
        type: "swim",
        typeLabel: "游泳馆",
        distanceKm: 3.6,
        address: "校外地铁口东侧",
        features: "恒温泳池 · 初学课程",
        position: [113.407562, 23.059388]
      }
    ],
    quickTips: [
      "健身房更适合力量训练和器械增肌。",
      "体育馆适合球类和综合热身。",
      "游泳馆适合低冲击有氧和恢复日。"
    ]
  };
}

export function buildCheckin(user) {
  const safeUser = withGuest(user);
  const hasPlan = false;

  return {
    hasPlan,
    requiresLogin: !user || !user.id,
    intro: {
      title: hasPlan ? "开始执行今日计划" : "先制定你的运动计划",
      description: hasPlan
        ? `今天的打卡会围绕 ${safeUser.fitnessGoal} 展开，完成后会继续累积你的 streak 和 XP。`
        : "第一次进入先确定目标、频率和偏好，系统才知道每天该给你什么任务。"
    },
    planner: null,
    todayPlan: {
      streak: `${safeUser.streak} Day Streak`,
      reward: "+80 XP",
      items: [
        { name: "步行 4000 步", status: "进行中", progress: "3100 / 4000" },
        { name: "完成 20 分钟运动", status: "已完成", progress: "20 / 20 分钟" },
        { name: "晚上 12 点前睡觉", status: "待完成", progress: "今日作息任务" }
      ]
    }
  };
}

export function buildSocial(user, socialPosts = [], rankingItems = [], currentUserRank = null) {
  const safeUser = withGuest(user);
  return {
    hero: {
      title: "和同校的人一起记录、分享、互相带动",
      description: "这个页面负责发帖、看帖和轻互动，让运动习惯不再只有自己一个人坚持。"
    },
    composer: {
      title: "发布今天的动态",
      placeholder: "分享今天的运动、路线、心得，或者约一个搭子一起出发。"
    },
    ranking: {
      title: "校园排行榜",
      summary: currentUserRank
        ? `${safeUser.name} 当前排名第 ${currentUserRank.rank}，累计 ${currentUserRank.xp} XP，连续 ${currentUserRank.streak} 天。`
        : "比较 XP、streak 和活跃度，制造持续打开的动力。",
      items: rankingItems
    },
    posts: socialPosts,
    feed: [
      { user: "Alex", text: "完成了今天的运动打卡", reaction: "👏 Nice Work!" },
      { user: "Emma", text: "升级到了 Lv.10", reaction: "🔥 Keep Going!" },
      { user: safeUser.name, text: "刚刚来到动次成长社区", reaction: "欢迎加入" }
    ]
  };
}

export function buildProfile(user) {
  const safeUser = withGuest(user);
  return {
    identity: {
      level: `Lv.${safeUser.level}`,
      title: safeUser.title,
      name: safeUser.name,
      email: safeUser.email
    },
    stats: [
      { label: "累计步数", value: `${safeUser.totalSteps.toLocaleString()} 步` },
      { label: "累计运动时间", value: `${(safeUser.totalMinutes / 60).toFixed(1)} 小时` },
      { label: "最长 streak", value: `${safeUser.longestStreak} 天` }
    ],
    badges: [
      { name: "连续打卡 7 天", description: "已经连续完成一周成长目标。", status: safeUser.longestStreak >= 7 ? "已解锁" : "进行中" },
      { name: "夜跑达人", description: "累计完成 5 次校园夜跑。", status: "已解锁" },
      { name: "操场之王", description: "本月操场路线完成度排名前 10%。", status: "进行中" }
    ],
    settings: [
      { label: "运动目标", value: safeUser.fitnessGoal },
      { label: "提醒时间", value: "19:30" },
      { label: "AI 风格", value: "鼓励型" }
    ],
    titles: ["校园运动家", "夜行者", "慢跑探索者"],
    sync: ["Apple Health", "高德地图", "Smart Watch"]
  };
}
