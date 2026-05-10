function buildFallbackRecommendation({ purpose, targetDate, targetGoal, heightCm, weightKg }) {
  const lines = [
    `你的目标是 ${purpose}，计划在 ${targetDate} 前达到 ${targetGoal}。`,
    `当前身体信息参考：身高 ${heightCm} cm，体重 ${weightKg} kg。`,
    "建议从低压力、易坚持的节奏开始，先把固定打卡习惯建立起来。",
    "可以优先选择校园慢跑、操场间歇走跑、游泳或健身房基础器械训练，并把有氧和力量交替安排。"
  ];

  const suggestedTasks = [
    {
      title: "慢跑训练",
      description: "每两天进行一次 25 分钟慢跑，保持可对话强度，适合建立基础心肺能力。",
      cadence: "每两天一次",
      points: 1
    },
    {
      title: "力量补充",
      description: "每周两次去健身房完成 20 分钟基础力量训练，重点放在深蹲、推举和核心稳定。",
      cadence: "每周两次",
      points: 1
    },
    {
      title: "游泳恢复",
      description: "每周安排一次 30 分钟轻松游泳，作为关节压力更低的恢复性训练。",
      cadence: "每周一次",
      points: 1
    },
    {
      title: "快走补量",
      description: "非训练日完成 35 分钟快走，把日常活动量稳定拉起来。",
      cadence: "非训练日",
      points: 1
    },
    {
      title: "恢复与作息",
      description: "训练日结束后做 10 分钟拉伸，并尽量在 12 点前休息，帮助体重管理和恢复。",
      cadence: "每日打卡",
      points: 1
    }
  ];

  return {
    recommendation: lines.join(" "),
    suggestedTasks
  };
}

export async function generatePlanRecommendation(input) {
  const apiKey = process.env.DEEPSEEK_API_KEY || "";

  if (!apiKey) {
    return buildFallbackRecommendation(input);
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "你是大学生健身习惯产品的 AI 教练。请输出 JSON，包含 recommendation 字符串和 suggestedTasks 数组。recommendation 需要具体、较长，至少给出有氧、力量、恢复三个方向建议。suggestedTasks 至少返回 5 条。每个 suggestedTasks 元素必须有 title、description、cadence、points。points 固定为 1。"
          },
          {
            role: "user",
            content: `用户运动目的：${input.purpose}；预计完成时间：${input.targetDate}；想要达到的目标：${input.targetGoal}；当前身高：${input.heightCm} cm；当前体重：${input.weightKg} kg。请给出更具体的训练建议，例如每天跑步多久、游泳还是健身房、每周怎么分配，并给出至少 5 条可执行打卡任务。`
          }
        ],
        response_format: {
          type: "json_object"
        }
      })
    });

    if (!response.ok) {
      return buildFallbackRecommendation(input);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    if (!parsed.recommendation || !Array.isArray(parsed.suggestedTasks)) {
      return buildFallbackRecommendation(input);
    }

    return {
      recommendation: parsed.recommendation,
      suggestedTasks: parsed.suggestedTasks.map((task) => ({
        title: task.title || "训练任务",
        description: task.description || "按照 AI 建议完成今日训练。",
        cadence: task.cadence || "每日打卡",
        points: 1
      }))
    };
  } catch {
    return buildFallbackRecommendation(input);
  }
}
