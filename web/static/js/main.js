// web/static/js/main.js

import { fetchClips, createClip, updateClip, deleteClip } from "./api.js";
import { ui } from "./ui.js";

let allClips = [];
let sortOrder = "desc";
let filterQuery = "";
let autoSyncTimer = null;
let lastSyncAt = null;

// DOM
const inputEl = document.getElementById("input");
const btnAdd = document.getElementById("btn-add");
const btnClearInput = document.getElementById("btn-clear-input");
const btnRefresh = document.getElementById("btn-refresh");
const btnAutoSync = document.getElementById("btn-auto-sync");
const searchInput = document.getElementById("search");
const sortToggle = document.getElementById("sort-toggle");

/* ========== 工具：过滤 + 排序 ========== */

function getFilteredClips() {
  let list = allClips.slice();

  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    list = list.filter((clip) =>
      (clip.content || "").toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => {
    const aT = a.created_at || "";
    const bT = b.created_at || "";
    if (aT === bT) return 0;
    const cmp = aT < bT ? -1 : 1;
    return sortOrder === "desc" ? -cmp : cmp;
  });

  return list;
}

function refreshRenderedList() {
  const visible = getFilteredClips();
  ui.renderClips(visible, {
    onCopy: handleCopy,
    onEditRequest: handleEditRequest,
    onDelete: handleDelete,
  });

  ui.updateMetrics({
    total: allClips.length,
    visible: visible.length,
    lastSync: lastSyncAt,
  });

  // 新渲染出来的按钮要重新挂 ripple
  ui.attachButtonRipples();
}

/* 高亮单条 */

function highlightClipById(id) {
  const el = document.querySelector(`.clip-item[data-id="${id}"]`);
  if (!el) return;
  el.classList.add("clip-item-highlight");
  setTimeout(() => {
    el.classList.remove("clip-item-highlight");
  }, 800);
}

/* ========== 拉取列表 ========== */

async function loadClips(showStatus = true) {
  if (showStatus) ui.setHint("sync", "同步中…");
  try {
    const clips = await fetchClips();
    allClips = Array.isArray(clips) ? clips : [];
    lastSyncAt = new Date();
    refreshRenderedList();
    if (showStatus) ui.setHint("success", "已从云端刷新列表。");
  } catch (err) {
    console.error(err);
    if (showStatus) {
      ui.setHint("error", `加载失败：${err.message}`);
      ui.showToast(`加载失败：${err.message}`, "error");
    }
  }
}

/* ========== 新增 ========== */

async function handleAddClip() {
  if (!inputEl) return;
  const raw = inputEl.value;
  const text = raw.trim();

  if (!text) {
    ui.setHint("error", "内容为空，没得存。");
    ui.showToast("内容为空，没有保存任何东西。", "error");
    return;
  }

  ui.setHint("sync", "保存中…");
  if (btnAdd) btnAdd.disabled = true;

  try {
    const newClip = await createClip(text);
    allClips.unshift(newClip);
    lastSyncAt = new Date();

    inputEl.value = "";
    ui.updateInputStats("");

    refreshRenderedList();
    highlightClipById(newClip.id);

    ui.setHint("success", "已保存到云端。");
    ui.showToast("已保存到云端列表。", "success");
  } catch (err) {
    console.error(err);
    ui.setHint("error", `保存失败：${err.message}`);
    ui.showToast(`保存失败：${err.message}`, "error");
  } finally {
    if (btnAdd) btnAdd.disabled = false;
  }
}

/* ========== 复制 ========== */

async function handleCopy(clip, button) {
  try {
    await navigator.clipboard.writeText(clip.content || "");
    const old = button ? button.textContent : null;
    if (button) button.textContent = "已复制";
    ui.showToast("内容已复制到剪贴板。", "success");
    setTimeout(() => {
      if (button && old !== null) button.textContent = old;
    }, 700);
  } catch (err) {
    console.error(err);
    ui.setHint("error", "复制失败");
    ui.showToast("复制失败，可能是浏览器权限问题。", "error");
  }
}

/* ========== 编辑 ========== */

function handleEditRequest(clip, itemEl) {
  ui.renderEditForm(itemEl, clip, {
    onSave: (newText) => handleSaveEdit(clip, newText),
    onCancel: () => refreshRenderedList(),
  });
}

async function handleSaveEdit(clip, newText) {
  if (!newText) {
    ui.setHint("error", "内容为空，不能保存。");
    ui.showToast("内容为空，不能保存。", "error");
    return;
  }

  ui.setHint("sync", "更新中…");
  try {
    const updated = await updateClip(clip.id, newText);
    const idx = allClips.findIndex((c) => c.id === clip.id);
    if (idx !== -1) {
      allClips[idx] = updated;
    }
    lastSyncAt = new Date();

    refreshRenderedList();
    highlightClipById(clip.id);

    ui.setHint("success", "内容已更新。");
    ui.showToast("内容已更新。", "success");
  } catch (err) {
    console.error(err);
    ui.setHint("error", `更新失败：${err.message}`);
    ui.showToast(`更新失败：${err.message}`, "error");
  }
}

/* ========== 删除 ========== */

async function handleDelete(clip) {
  ui.setHint("sync", "删除中…");
  try {
    await deleteClip(clip.id);
    allClips = allClips.filter((c) => c.id !== clip.id);
    lastSyncAt = new Date();

    refreshRenderedList();
    ui.setHint("success", "已删除。");
    ui.showToast("已删除该条目。", "neutral");
  } catch (err) {
    console.error(err);
    ui.setHint("error", `删除失败：${err.message}`);
    ui.showToast(`删除失败：${err.message}`, "error");
  }
}

/* ========== 自动同步 ========== */

function enableAutoSync() {
  if (autoSyncTimer) return;
  autoSyncTimer = setInterval(() => loadClips(false), 8000);
  ui.updateSyncIndicator({
    active: true,
    label: "自动同步 · 每 8 秒轮询",
  });
  if (btnAutoSync) {
    const textSpan = btnAutoSync.querySelector("span:nth-child(2)");
    if (textSpan) textSpan.textContent = "关闭 8s 自动同步";
  }
  ui.showToast("已开启自动同步。", "success");
}

function disableAutoSync() {
  if (!autoSyncTimer) return;
  clearInterval(autoSyncTimer);
  autoSyncTimer = null;
  ui.updateSyncIndicator({
    active: false,
    label: "被动刷新模式",
  });
  if (btnAutoSync) {
    const textSpan = btnAutoSync.querySelector("span:nth-child(2)");
    if (textSpan) textSpan.textContent = "开启 8s 自动同步";
  }
  ui.showToast("已关闭自动同步。", "neutral");
}

/* ========== 事件绑定 ========== */

function bindEvents() {
  ui.initInputCounters();

  if (inputEl) {
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleAddClip();
      }
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      handleAddClip();
    });
  }

  if (btnClearInput && inputEl) {
    btnClearInput.addEventListener("click", () => {
      inputEl.value = "";
      ui.updateInputStats("");
      ui.setHint("idle", "已清空输入框。");
    });
  }

  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      loadClips(true);
    });
  }

  if (btnAutoSync) {
    btnAutoSync.addEventListener("click", () => {
      if (autoSyncTimer) {
        disableAutoSync();
      } else {
        enableAutoSync();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      filterQuery = searchInput.value || "";
      refreshRenderedList();
    });
  }

  if (sortToggle) {
    sortToggle.addEventListener("click", () => {
      sortOrder = sortOrder === "desc" ? "asc" : "desc";
      ui.updateSortOrder(sortOrder);
      refreshRenderedList();
    });
  }
}

/* ========== 初始化 ========== */

function init() {
  ui.initTheme();
  bindEvents();
  ui.attachButtonRipples();
  ui.initParallax();
  loadClips(true);
}

init();
