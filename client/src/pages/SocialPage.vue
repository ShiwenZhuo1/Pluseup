<script setup>
import { computed, ref } from "vue";
import AppShell from "../components/AppShell.vue";
import DataState from "../components/DataState.vue";
import { useAsyncData } from "../composables/useAsyncData";
import { authState } from "../services/auth";
import { createSocialPost, createSocialReply, getSocial, toggleSocialPostLike } from "../services/api";

const { data, loading, error, reload } = useAsyncData(getSocial);
const heroImage = new URL("../../image/6.jpg", import.meta.url).href;
const postContent = ref("");
const postError = ref("");
const postLoading = ref(false);
const replyDrafts = ref({});
const replyErrors = ref({});
const actionLoadingByPost = ref({});

const canPost = computed(() => Boolean(authState.token));

async function submitPost() {
  const content = postContent.value.trim();

  if (!content) {
    postError.value = "先写一点内容再发布。";
    return;
  }

  postLoading.value = true;
  postError.value = "";

  try {
    await createSocialPost({ content });
    postContent.value = "";
    await reload();
  } catch (err) {
    postError.value = err instanceof Error ? err.message : "发布失败";
  } finally {
    postLoading.value = false;
  }
}

async function handleLike(postId) {
  if (!canPost.value) {
    postError.value = "请先登录后再点赞。";
    return;
  }

  actionLoadingByPost.value[postId] = true;

  try {
    const result = await toggleSocialPostLike(postId);
    const post = data.value?.posts?.find((item) => item.id === postId);

    if (post) {
      post.liked = result.liked;
      post.likesCount = result.likesCount;
    }
  } catch (err) {
    postError.value = err instanceof Error ? err.message : "点赞失败";
  } finally {
    actionLoadingByPost.value[postId] = false;
  }
}

async function submitReply(postId) {
  const content = (replyDrafts.value[postId] || "").trim();

  if (!canPost.value) {
    replyErrors.value[postId] = "请先登录后再回复。";
    return;
  }

  if (!content) {
    replyErrors.value[postId] = "先写一点回复内容。";
    return;
  }

  actionLoadingByPost.value[postId] = true;
  replyErrors.value[postId] = "";

  try {
    const reply = await createSocialReply(postId, { content });
    const post = data.value?.posts?.find((item) => item.id === postId);

    if (post) {
      if (!Array.isArray(post.replies)) {
        post.replies = [];
      }
      post.replies.push(reply);
    }

    replyDrafts.value[postId] = "";
  } catch (err) {
    replyErrors.value[postId] = err instanceof Error ? err.message : "回复失败";
  } finally {
    actionLoadingByPost.value[postId] = false;
  }
}
</script>

<template>
  <AppShell title="社区" subtitle="排行榜、搭子、经验分享和动态互动集中在这里。" :hide-page-hero="true" :full-bleed="true">
    <DataState :loading="loading" :error="error">
      <div class="social-page-flow">
        <section
          class="checkin-hero"
          :style="{ backgroundImage: `linear-gradient(90deg, rgba(67, 54, 44, 0.54) 0%, rgba(67, 54, 44, 0.3) 34%, rgba(67, 54, 44, 0.1) 72%), url(${heroImage})` }"
        >
          <div class="home-hero-overlay"></div>
          <div class="checkin-hero-copy">
            <p class="home-kicker">校园社区</p>
            <h1 class="home-display">
              看见别人在坚持，
              <br />
              运动就没那么难开始。
            </h1>
            <p class="home-support">{{ data.hero.description }}</p>
          </div>
        </section>

        <section class="explore-content social-content">
          <div class="social-layout">
            <section class="card social-composer-card">
              <div class="section-heading compact">
                <div>
                  <p class="eyebrow">发布帖子</p>
                  <h2>{{ data.composer.title }}</h2>
                </div>
                <span class="tag">{{ canPost ? "已登录" : "登录后可发布" }}</span>
              </div>

              <textarea
                v-model="postContent"
                class="social-composer-input"
                :placeholder="data.composer.placeholder"
                :disabled="!canPost || postLoading"
                maxlength="280"
              ></textarea>

              <div class="section-heading compact">
                <p class="user-meta">{{ canPost ? "分享运动、路线、打卡心得都可以。" : "游客可以看帖，登录后就能发帖。" }}</p>
                <button class="primary-button" :disabled="!canPost || postLoading" @click="submitPost">
                  {{ postLoading ? "发布中..." : "发布帖子" }}
                </button>
              </div>

              <p v-if="postError" class="form-error">{{ postError }}</p>
            </section>

            <section id="ranking-section" class="card">
              <p class="eyebrow">排行榜</p>
              <h2>{{ data.ranking.title }}</h2>
              <p>{{ data.ranking.summary }}</p>
              <div v-for="entry in data.ranking.items" :key="entry.name" class="list-row compact">
                <span>#{{ entry.rank }} {{ entry.name }}</span>
                <strong>{{ entry.value }}</strong>
              </div>
            </section>

            <section class="card social-feed-card">
              <p class="eyebrow">帖子广场</p>
              <h2>看看别人今天都发了什么</h2>
              <div v-for="post in data.posts" :key="post.id || `${post.author}-${post.meta}`" class="feed-item social-post">
                <div class="section-heading compact">
                  <strong>{{ post.author }}</strong>
                  <span class="user-meta">{{ post.meta }}</span>
                </div>
                <p>{{ post.content }}</p>
                <div class="social-post-actions">
                  <button class="ghost-button social-action-chip" :disabled="actionLoadingByPost[post.id]" @click="handleLike(post.id)">
                    {{ post.liked ? "已点赞" : "点赞" }} · {{ post.likesCount || 0 }}
                  </button>
                  <span class="user-meta">回复 {{ post.replies?.length || 0 }}</span>
                </div>

                <div v-if="post.replies?.length" class="social-replies">
                  <div v-for="reply in post.replies" :key="reply.id" class="social-reply">
                    <div class="section-heading compact">
                      <strong>{{ reply.author }}</strong>
                      <span class="user-meta">{{ reply.meta }}</span>
                    </div>
                    <p>{{ reply.content }}</p>
                  </div>
                </div>

                <div class="social-reply-box">
                  <input
                    v-model="replyDrafts[post.id]"
                    type="text"
                    placeholder="回复这条帖子..."
                    :disabled="!canPost || actionLoadingByPost[post.id]"
                  />
                  <button class="ghost-button social-action-chip" :disabled="!canPost || actionLoadingByPost[post.id]" @click="submitReply(post.id)">
                    回复
                  </button>
                </div>
                <p v-if="replyErrors[post.id]" class="form-error">{{ replyErrors[post.id] }}</p>
              </div>
            </section>

            <section class="card">
              <p class="eyebrow">最新动态</p>
              <div v-for="item in data.feed" :key="item.text" class="feed-item">
                <strong>{{ item.user }}</strong>
                <p>{{ item.text }}</p>
                <span>{{ item.reaction }}</span>
              </div>
            </section>
          </div>
        </section>
      </div>
    </DataState>
  </AppShell>
</template>
