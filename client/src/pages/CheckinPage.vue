<script setup>
import { computed, ref } from "vue";
import AppShell from "../components/AppShell.vue";
import DataState from "../components/DataState.vue";
import { useAsyncData } from "../composables/useAsyncData";
import {
  completeTask,
  createPlan as savePlan,
  getCheckin,
  getPlanRecommendation
} from "../services/api";
import { authState, hasToken } from "../services/auth";

const { data, loading, error, reload } = useAsyncData(getCheckin);
const heroImage = new URL("../../image/2.jpg", import.meta.url).href;
const wantsNewPlan = ref(false);
const generating = ref(false);
const saving = ref(false);
const message = ref("");
const recommendation = ref("");
const taskCards = ref([]);

const form = ref({
  purpose: "",
  targetDate: "",
  targetGoal: "",
  heightCm: "",
  weightKg: ""
});

const canBuildPlan = computed(() => hasToken());

async function handleGenerateRecommendation() {
  generating.value = true;
  message.value = "";

  try {
    const result = await getPlanRecommendation(form.value);
    recommendation.value = result.recommendation;
    taskCards.value = result.suggestedTasks.map((task) => ({
      ...task,
      selected: true
    }));
  } catch (err) {
    message.value = err instanceof Error ? err.message : "生成建议失败";
  } finally {
    generating.value = false;
  }
}

function addTaskCard() {
  taskCards.value.push({
    title: "",
    description: "",
    cadence: "",
    points: 1,
    selected: true
  });
}

async function handleSavePlan() {
  saving.value = true;
  message.value = "";

  try {
    await savePlan({
      ...form.value,
      recommendation: recommendation.value,
      tasks: taskCards.value.filter((task) => task.selected)
    });
    wantsNewPlan.value = false;
    recommendation.value = "";
    taskCards.value = [];
    message.value = "计划已保存，今天的打卡任务已经生成。";
    await reload();
  } catch (err) {
    message.value = err instanceof Error ? err.message : "保存计划失败";
  } finally {
    saving.value = false;
  }
}

async function handleCompleteTask(taskId) {
  try {
    const result = await completeTask(taskId);
    if (authState.user && typeof result.userXp === "number") {
      authState.user.xp = result.userXp;
    }

    const completedTask = data.value?.tasks?.find((item) => item.id === taskId);
    if (completedTask) {
      completedTask.completed = true;
    }

    if (data.value?.goals && typeof data.value.goals.completed === "number") {
      data.value.goals.completed += 1;
    }
  } catch (err) {
    message.value = err instanceof Error ? err.message : "打卡失败";
  }
}
</script>

<template>
  <AppShell title="打卡" subtitle="先判断有没有计划，再进入制定或执行的流程。" :hide-page-hero="true" :full-bleed="true">
    <DataState :loading="loading" :error="error">
      <div class="checkin-page-flow">
        <section class="checkin-hero" :style="{ backgroundImage: `linear-gradient(90deg, rgba(92, 63, 46, 0.58) 0%, rgba(92, 63, 46, 0.34) 34%, rgba(92, 63, 46, 0.08) 70%), url(${heroImage})` }">
          <div class="home-hero-overlay"></div>
          <div class="checkin-hero-copy">
            <p class="home-kicker">计划与打卡中心</p>
            <h1 class="home-display">
              制定你的训练计划
              <br />
              让 AI 帮你拆成
              <br />
              每天可执行的任务
            </h1>
            <p class="home-support">
              这个页面负责三件事：确定目标、生成训练建议、把建议变成可打卡的每日任务卡。
            </p>
          </div>
        </section>

        <section class="checkin-content">
          <div class="checkin-layout" :class="{ 'checkin-layout-active': data.hasPlan, 'checkin-layout-new-plan': data.hasPlan && wantsNewPlan }">
            <section v-if="recommendation || data.hasPlan" class="card checkin-ai-card">
              <div class="section-heading checkin-topbar">
                <div>
                  <p class="eyebrow">AI 建议</p>
                  <h2>{{ data.hasPlan ? "当前训练建议" : "先生成 AI 建议" }}</h2>
                </div>
                <button
                  v-if="data.hasPlan"
                  class="primary-button prominent-plan-button"
                  @click="wantsNewPlan = !wantsNewPlan"
                >
                  {{ wantsNewPlan ? "收起新计划" : "制定新的计划" }}
                </button>
              </div>
              <p class="home-summary-text">
                {{ recommendation || data.plan?.recommendation || "填写计划后点击 AI 建议，这里会显示更具体的训练安排。" }}
              </p>
            </section>

            <section v-if="(!data.hasPlan || wantsNewPlan) && canBuildPlan" class="card checkin-plan-card">
              <p class="eyebrow">制定计划</p>
              <h2>{{ data.hasPlan ? "要不要制定新的计划？" : "开始第一个计划" }}</h2>
              <p>先填写计划信息，再点击 AI 建议生成更具体的训练安排，然后选择想加入打卡计划的任务。</p>

              <div class="button-row">
                <span class="tag highlight">{{ data.hasPlan ? "当前已有计划" : "尚未制定计划" }}</span>
                <button v-if="data.hasPlan" class="ghost-button" @click="wantsNewPlan = false">继续当前计划</button>
              </div>

              <div class="planner-table">
                <label class="planner-row">
                  <span>运动目的</span>
                  <input v-model="form.purpose" type="text" placeholder="例如：减脂、建立习惯、提升耐力" />
                </label>
                <label class="planner-row">
                  <span>预计完成时间</span>
                  <input v-model="form.targetDate" type="date" />
                </label>
                <label class="planner-row">
                  <span>目前身高（cm）</span>
                  <input v-model="form.heightCm" type="number" min="50" placeholder="例如：168" />
                </label>
                <label class="planner-row">
                  <span>目前体重（kg）</span>
                  <input v-model="form.weightKg" type="number" min="20" step="0.1" placeholder="例如：58.5" />
                </label>
                <label class="planner-row">
                  <span>想达到的目标</span>
                  <textarea v-model="form.targetGoal" rows="3" placeholder="例如：减重 4kg，每周稳定运动 4 次"></textarea>
                </label>
              </div>

              <div class="button-row">
                <button class="primary-button" :disabled="generating" @click="handleGenerateRecommendation">
                  {{ generating ? "AI 生成中..." : "AI 建议" }}
                </button>
              </div>

              <div v-if="recommendation" class="planner-recommendation">
                <p class="eyebrow">AI 推荐</p>
                <p>{{ recommendation }}</p>
              </div>

              <div v-if="taskCards.length" class="planner-task-editor">
                <div class="section-heading">
                  <h2>选择加入打卡计划的建议</h2>
                  <button class="ghost-button" @click="addTaskCard">新增任务卡</button>
                </div>

                <div v-for="(task, index) in taskCards" :key="`${task.title}-${index}`" class="task-editor-card">
                  <label class="task-select-row">
                    <input v-model="task.selected" type="checkbox" />
                    <span>加入打卡计划</span>
                  </label>
                  <label class="planner-row">
                    <span>任务名称</span>
                    <input v-model="task.title" type="text" placeholder="例如：跑步 30 分钟" />
                  </label>
                  <label class="planner-row">
                    <span>任务说明</span>
                    <input v-model="task.description" type="text" placeholder="例如：操场慢跑，配速轻松" />
                  </label>
                  <label class="planner-row">
                    <span>打卡频率</span>
                    <input v-model="task.cadence" type="text" placeholder="例如：每两天一次" />
                  </label>
                  <p class="task-points">每完成一张任务卡，积分 +1</p>
                </div>

                <button class="primary-button" :disabled="saving" @click="handleSavePlan">
                  {{ saving ? "保存中..." : "保存计划和任务卡" }}
                </button>
              </div>
            </section>

            <section v-if="data.hasPlan" id="current-plan" class="card checkin-task-card">
              <div class="section-heading">
                <div>
                  <p class="eyebrow">当前打卡计划</p>
                  <h2>{{ data.plan.targetGoal }}</h2>
                </div>
                <div class="checkin-stats-corner">
                  <span class="tag highlight">{{ data.plan.targetDate }}</span>
                  <span class="tag task-tag">当前积分 {{ authState.user?.xp ?? 0 }} XP</span>
                </div>
              </div>

              <p class="home-summary-text">{{ data.plan.recommendation }}</p>
              <p class="home-summary-text">当前身体信息：{{ data.plan.heightCm }} cm · {{ data.plan.weightKg }} kg</p>

              <div class="task-grid">
                <article v-for="item in data.tasks" :key="item.id" class="task-grid-card">
                  <span class="tag task-tag">{{ item.completed ? "已打卡" : `+${item.points} XP` }}</span>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.description }}</p>
                  <p class="task-cadence">{{ item.cadence }}</p>
                  <button
                    class="ghost-button"
                    :disabled="item.completed || !canBuildPlan"
                    @click="handleCompleteTask(item.id)"
                  >
                    {{ item.completed ? "已完成" : "打卡完成" }}
                  </button>
                </article>
              </div>
            </section>

            <section v-if="data.plans?.length" class="card checkin-existing-plans">
              <p class="eyebrow">已有计划</p>
              <div v-for="plan in data.plans" :key="plan.id" class="existing-plan-card">
                <div class="section-heading">
                  <strong>{{ plan.targetGoal }}</strong>
                  <span class="tag" :class="{ highlight: plan.active }">{{ plan.active ? "当前生效" : "历史计划" }}</span>
                </div>
                <p>{{ plan.purpose }} · 截止 {{ plan.targetDate }}</p>
                <p>{{ plan.heightCm }} cm · {{ plan.weightKg }} kg</p>
              </div>
            </section>
          </div>
        </section>
      </div>

      <p v-if="message" class="form-error standalone-message">{{ message }}</p>
    </DataState>
  </AppShell>
</template>
