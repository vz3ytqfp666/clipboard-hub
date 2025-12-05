// web/static/js/ui.js

/**
 * UI helpers
 * 只做 DOM / 动效，不碰后端。
 */

const THEME_KEY = "cb_theme";

/* DOM 缓存 */

const els = {
  input: document.getElementById("input"),
  textareaWrap: document.getElementById("textarea-wrap"),
  hint: document.getElementById("hint"),
  charCount: document.getElementById("char-count"),
  lineCount: document.getElementById("line-count"),
  metricTotal: document.getElementById("metric-total"),
  metricTotal2: document.getElementById("metric-total-2"),
  metricVisible: document.getElementById("metric-visible"),
  metricSync: document.getElementById("metric-sync"),
  list: document.getElementById("list"),
  emptyState: document.getElementById("empty-state"),
  toastRoot: document.getElementById("toast-root"),
  syncText: document.getElementById("sync-text"),
  syncLabel: document.getElementById("sync-label"),
  sortToggle: document.getElementById("sort-toggle"),
  themeToggle: document.getElementById("theme-toggle"),
};

const HINT_DEFAULT = {
  idle: "Idle · 静候你的下一条灵感",
  success: "已同步到云端 ✔",
  error: "出错了，稍后再试一下",
  sync: "同步中…",
};

/* ========== 输入框统计 ========== */

function updateInputStats(value) {
  const text = value || "";
  if (els.charCount) els.charCount.textContent = String(text.length);
  if (els.lineCount) els.lineCount.textContent = String(text.split(/\n/).length);
}

function initInputCounters() {
  const input = els.input;
  const wrap = els.textareaWrap;
  if (!input || !wrap) return;

  updateInputStats(input.value);

  input.addEventListener("input", () => {
    updateInputStats(input.value);
  });

  input.addEventListener("focus", () => {
    wrap.classList.add("focused");
  });
  input.addEventListener("blur", () => {
    wrap.classList.remove("focused");
  });
}

/* ========== 状态 hint ========== */

function setHint(state = "idle", text) {
  const el = els.hint;
  if (!el) return;
  el.dataset.state = state;
  const span = el.querySelector("span:nth-child(2)");
  if (!span) return;
  span.textContent = text || HINT_DEFAULT[state] || HINT_DEFAULT.idle;
}

/* ========== 时间显示 ========== */

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function formatTimeHM(date) {
  if (!(date instanceof Date)) return "--:--";
  if (Number.isNaN(date.getTime())) return "--:--";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/* ========== 顶部 metrics ========== */

function updateMetrics({ total, visible, lastSync }) {
  if (els.metricTotal) els.metricTotal.textContent = String(total ?? 0);
  if (els.metricTotal2) els.metricTotal2.textContent = String(total ?? 0);
  if (els.metricVisible) els.metricVisible.textContent = String(visible ?? 0);
  if (els.metricSync) els.metricSync.textContent = formatTimeHM(lastSync);
}

/* ========== 同步指示 ========== */

function updateSyncIndicator({ active, label }) {
  if (!els.syncText || !els.syncLabel) return;
  els.syncText.dataset.active = active ? "1" : "0";
  if (label) els.syncLabel.textContent = label;
}

/* ========== 排序 chip ========== */

function updateSortOrder(order) {
  if (!els.sortToggle) return;
  els.sortToggle.dataset.order = order === "asc" ? "asc" : "desc";
}

/* ========== Toast ========== */

function showToast(message, type = "neutral") {
  const root = els.toastRoot;
  if (!root) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const badge = document.createElement("div");
  badge.className = "toast-badge";
  if (type === "success") badge.textContent = "成功";
  else if (type === "error") badge.textContent = "错误";
  else badge.textContent = "提示";

  const msg = document.createElement("div");
  msg.className = "toast-message";
  msg.textContent = message;

  const close = document.createElement("button");
  close.className = "toast-close";
  close.innerHTML = "&times;";
  close.addEventListener("click", () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px) scale(0.97)";
    setTimeout(() => toast.remove(), 180);
  });

  toast.appendChild(badge);
  toast.appendChild(msg);
  toast.appendChild(close);
  root.appendChild(toast);

  setTimeout(() => {
    if (!document.body.contains(toast)) return;
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px) scale(0.97)";
    setTimeout(() => toast.remove(), 180);
  }, 2600);
}

/* ========== 列表渲染 ========== */

function renderClips(clips, handlers = {}) {
  const list = els.list;
  const empty = els.emptyState;
  if (!list) return;

  list.innerHTML = "";

  if (!clips || clips.length === 0) {
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  clips.forEach((clip) => {
    const item = document.createElement("div");
    item.className = "clip-item";
    item.dataset.id = String(clip.id);

    const content = document.createElement("div");
    content.className = "clip-content";
    content.textContent = clip.content || "";

    const footer = document.createElement("div");
    footer.className = "clip-footer";

    const meta = document.createElement("div");
    meta.className = "clip-meta";

    const ts = document.createElement("span");
    ts.textContent = formatDateTime(clip.created_at || clip.updated_at);

    const len = document.createElement("span");
    len.className = "clip-meta-tag";
    len.textContent = `${(clip.content || "").length} 字`;

    meta.appendChild(ts);
    meta.appendChild(len);

    const actions = document.createElement("div");
    actions.className = "clip-actions";

    const btnCopy = document.createElement("button");
    btnCopy.className = "btn btn-mini";
    btnCopy.textContent = "复制";

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn btn-mini";
    btnEdit.textContent = "编辑";

    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-mini btn-danger";
    btnDel.textContent = "删除";

    btnCopy.addEventListener("click", () => {
      handlers.onCopy && handlers.onCopy(clip, btnCopy);
    });
    btnEdit.addEventListener("click", () => {
      handlers.onEditRequest && handlers.onEditRequest(clip, item);
    });
    btnDel.addEventListener("click", () => {
      handlers.onDelete && handlers.onDelete(clip);
    });

    actions.appendChild(btnCopy);
    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);

    footer.appendChild(meta);
    footer.appendChild(actions);

    item.appendChild(content);
    item.appendChild(footer);

    list.appendChild(item);
  });
}

/* 编辑模式 */

function renderEditForm(itemEl, clip, handlers = {}) {
  if (!itemEl) return;

  itemEl.innerHTML = "";

  const textarea = document.createElement("textarea");
  textarea.className = "edit-area";
  textarea.value = clip.content || "";

  const footer = document.createElement("div");
  footer.className = "clip-footer";

  const meta = document.createElement("div");
  meta.className = "clip-meta";
  const ts = document.createElement("span");
  ts.textContent = formatDateTime(clip.created_at);
  meta.appendChild(ts);

  const actions = document.createElement("div");
  actions.className = "clip-actions";

  const btnSave = document.createElement("button");
  btnSave.className = "btn btn-mini";
  btnSave.textContent = "保存";

  const btnCancel = document.createElement("button");
  btnCancel.className = "btn btn-mini btn-danger";
  btnCancel.textContent = "取消";

  btnSave.addEventListener("click", () => {
    const text = textarea.value.trim();
    handlers.onSave && handlers.onSave(text);
  });

  btnCancel.addEventListener("click", () => {
    handlers.onCancel && handlers.onCancel();
  });

  actions.appendChild(btnSave);
  actions.appendChild(btnCancel);

  footer.appendChild(meta);
  footer.appendChild(actions);

  itemEl.appendChild(textarea);
  itemEl.appendChild(footer);
  textarea.focus();
}

/* ========== 主题 ========== */

function applyTheme(theme) {
  const t = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", t);
  if (els.themeToggle) {
    els.themeToggle.setAttribute("data-theme", t);
  }
}

function initTheme() {
  let theme = localStorage.getItem(THEME_KEY);
  if (theme !== "light" && theme !== "dark") {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    theme = prefersDark ? "dark" : "light";
  }
  applyTheme(theme);

  if (els.themeToggle) {
    els.themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }
}

/* ========== 按钮 ripple 绑定 ========== */

function attachButtonRipples() {
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach((btn) => {
    if (btn.dataset.rippleAttached === "1") return;
    btn.dataset.rippleAttached = "1";

    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");
      ripple.className = "btn-ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });
}

/* ========== 3D 视差（轻微） ========== */

function initParallax() {
  const shell = document.querySelector(".app-shell");
  if (!shell) return;

  let rect = shell.getBoundingClientRect();

  window.addEventListener("resize", () => {
    rect = shell.getBoundingClientRect();
  });

  shell.addEventListener("mousemove", (e) => {
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotateX = y * -4;
    const rotateY = x * 4;
    shell.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  shell.addEventListener("mouseleave", () => {
    shell.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg)";
  });
}

/* ========== 导出 ========== */

export const ui = {
  initInputCounters,
  updateInputStats,
  setHint,
  updateMetrics,
  updateSyncIndicator,
  updateSortOrder,
  showToast,
  renderClips,
  renderEditForm,
  initTheme,
  attachButtonRipples,
  initParallax,
};
