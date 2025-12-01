const tauri = window.__TAURI__?.core;
const dialog = window.__TAURI__?.dialog;

const notification = document.getElementById("notification");
const messageEl = document.getElementById("message");
const iconEl = document.getElementById("icon");
const customImageEl = document.getElementById("custom-image");
const menuButton = document.getElementById("menu-button");
const menu = document.getElementById("menu");
const openSettingsBtn = document.getElementById("open-settings");
const quitBtn = document.getElementById("quit-app");
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsBtn = document.getElementById("close-settings");
const themeChoices = document.getElementById("theme-choices");
const rangeInput = document.getElementById("display-seconds");
const rangeValue = document.getElementById("seconds-preview");
const cornerSelect = document.getElementById("corner-select");
const previewNode = document.getElementById("preview");
const previewImage = previewNode.querySelector(".custom-image");
const copyPicker = document.getElementById("pick-copy");
const clearPicker = document.getElementById("pick-clear");
const copyPathLabel = document.getElementById("copy-path");
const clearPathLabel = document.getElementById("clear-path");

const ICON_KINDS = new Set(["copy", "clear", "settings", "power"]);

const state = {
  activeConfig: null,
  pendingConfig: null,
  messages: {},
  hideTimer: null,
  pollTimer: null,
  hoverLock: false,
};

function normalizeConfig(config) {
  const normalized = { ...config };
  if (!normalized.custom_images) {
    normalized.custom_images = { copy: "", clear: "" };
  } else {
    normalized.custom_images.copy = normalized.custom_images.copy || "";
    normalized.custom_images.clear = normalized.custom_images.clear || "";
  }
  normalized.display_time = Math.max(
    1,
    Math.min(60, Number(normalized.display_time || 3))
  );
  normalized.corner = normalized.corner || "bottom_right";
  normalized.theme = normalized.theme || "dark";
  return normalized;
}

function t(key, fallback) {
  return state.messages[key] || fallback;
}

function applyLocaleToDom() {
  document.querySelectorAll("[data-locale-key]").forEach((el) => {
    const key = el.getAttribute("data-locale-key");
    if (key && state.messages[key]) {
      el.textContent = state.messages[key];
    }
  });
}

function updateCorner(element, corner) {
  element.classList.remove(
    "corner-bottom-right",
    "corner-bottom-left",
    "corner-top-right",
    "corner-top-left"
  );
  element.classList.add(`corner-${corner.replace("_", "-")}`);
}

function convertFileSrc(filePath) {
  return tauri?.convertFileSrc ? tauri.convertFileSrc(filePath) : filePath;
}

function setIconKind(iconNode, kind) {
  if (!iconNode) return;
  iconNode.setAttribute("data-icon", ICON_KINDS.has(kind) ? kind : "copy");
}

function configureVisual(element, config, kind, customImageNode) {
  element.classList.remove("dark", "light", "custom");
  element.classList.add(config.theme);
  updateCorner(element, config.corner);

  const usingCustom = config.theme === "custom";
  const paths = config.custom_images || {};
  const path = paths[kind];
  const iconNode = element.querySelector(".icon") || iconEl;
  const messageNode = element.querySelector(".message") || messageEl;
  const imgNode = customImageNode || element.querySelector(".custom-image");

  if (usingCustom) {
    if (!path) {
      if (imgNode) {
        imgNode.classList.add("hidden");
      }
      iconNode?.classList.add("hidden");
      messageNode?.classList.add("hidden");
      return false;
    }
    if (imgNode) {
      imgNode.src = convertFileSrc(path);
      imgNode.classList.remove("hidden");
    }
    iconNode?.classList.add("hidden");
    messageNode?.classList.add("hidden");
    return true;
  }

  if (imgNode) {
    imgNode.classList.add("hidden");
  }
  iconNode?.classList.remove("hidden");
  messageNode?.classList.remove("hidden");
  setIconKind(iconNode, kind);
  messageNode.textContent =
    kind === "copy" ? t("copied", "Copied!") : t("cleared", "Cleared");
  return true;
}

function scheduleHide() {
  if (state.hideTimer) {
    clearTimeout(state.hideTimer);
  }
  if (state.hoverLock || !state.activeConfig) {
    return;
  }
  state.hideTimer = setTimeout(() => {
    notification.classList.remove("visible");
    setTimeout(() => notification.classList.add("hidden"), 420);
  }, (state.activeConfig.display_time || 3) * 1000);
}

function showNotification(kind) {
  if (!state.activeConfig) return;
  const rendered = configureVisual(notification, state.activeConfig, kind, customImageEl);
  if (!rendered) return;
  notification.classList.remove("hidden");
  notification.classList.add("visible");
  scheduleHide();
}

function toggleMenu(force) {
  const willShow =
    typeof force === "boolean" ? force : menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !willShow);
  menuButton.setAttribute("aria-expanded", willShow ? "true" : "false");
}

async function pollClipboard() {
  if (!tauri) return;
  try {
    const payload = await tauri.invoke("poll_clipboard");
    if (!payload || !payload.kind) return;
    if (payload.kind === "copy") {
      showNotification("copy");
    } else if (payload.kind === "clear") {
      showNotification("clear");
    }
  } catch (error) {
    console.error("poll failed", error);
  }
}

function startPolling() {
  if (state.pollTimer) {
    clearInterval(state.pollTimer);
  }
  pollClipboard();
  state.pollTimer = setInterval(pollClipboard, 900);
}

function closeSettings() {
  settingsPanel.classList.add("hidden");
}

function openSettings() {
  settingsPanel.classList.remove("hidden");
}

function updatePreviewText() {
  if (!state.pendingConfig) return;
  rangeValue.textContent = state.pendingConfig.display_time;
  updateCorner(previewNode, state.pendingConfig.corner);
  configureVisual(previewNode, state.pendingConfig, "copy", previewImage);
}

function setFormFromConfig(config) {
  const normalized = normalizeConfig(config);
  [...themeChoices.querySelectorAll("input[name='theme']")].forEach((input) => {
    input.checked = input.value === normalized.theme;
  });
  rangeInput.value = normalized.display_time;
  cornerSelect.value = normalized.corner;
  copyPathLabel.textContent = normalized.custom_images.copy || "";
  clearPathLabel.textContent = normalized.custom_images.clear || "";
  rangeValue.textContent = normalized.display_time;
  updatePreviewText();
}

function persistConfig() {
  if (!tauri || !state.pendingConfig) return;
  const normalized = normalizeConfig(state.pendingConfig);
  state.pendingConfig = normalized;
  tauri.invoke("save_config", { config: normalized }).catch((error) => {
    console.error("Failed to save config", error);
  });
  updatePreviewText();
}

function cloneConfig(config) {
  return JSON.parse(JSON.stringify(config));
}

function wireSettings() {
  themeChoices.addEventListener("change", (event) => {
    if (!state.pendingConfig) return;
    const value = event.target?.value;
    if (value) {
      state.pendingConfig.theme = value;
      persistConfig();
    }
  });

  rangeInput.addEventListener("input", (event) => {
    if (!state.pendingConfig) return;
    const value = Number(event.target.value);
    state.pendingConfig.display_time = value;
    rangeValue.textContent = value;
    persistConfig();
  });

  cornerSelect.addEventListener("change", (event) => {
    if (!state.pendingConfig) return;
    const value = event.target.value;
    state.pendingConfig.corner = value;
    persistConfig();
  });

  async function pickImage(kind) {
    if (!state.pendingConfig || !dialog?.open) return;
    const selected = await dialog.open({
      multiple: false,
      filters: [
        {
          name: "Images",
          extensions: ["png", "webp", "gif"],
        },
      ],
    });
    if (!selected) return;
    state.pendingConfig.custom_images[kind] = Array.isArray(selected)
      ? selected[0]
      : selected;
    copyPathLabel.textContent = state.pendingConfig.custom_images.copy || "";
    clearPathLabel.textContent = state.pendingConfig.custom_images.clear || "";
    persistConfig();
  }

  copyPicker.addEventListener("click", () => pickImage("copy"));
  clearPicker.addEventListener("click", () => pickImage("clear"));

  openSettingsBtn.addEventListener("click", () => {
    state.pendingConfig = normalizeConfig(cloneConfig(state.activeConfig));
    setFormFromConfig(state.pendingConfig);
    openSettings();
    toggleMenu(false);
  });

  closeSettingsBtn.addEventListener("click", () => {
    closeSettings();
  });
}

function initMenu() {
  menuButton.addEventListener("click", () => {
    toggleMenu();
  });

  document.addEventListener("click", (event) => {
    if (menu.contains(event.target) || menuButton.contains(event.target)) {
      return;
    }
    toggleMenu(false);
  });

  quitBtn.addEventListener("click", () => {
    toggleMenu(false);
    tauri?.invoke("exit_app");
  });
}

function initHoverBehaviour() {
  notification.addEventListener("mouseenter", () => {
    state.hoverLock = true;
    if (state.hideTimer) {
      clearTimeout(state.hideTimer);
    }
  });
  notification.addEventListener("mouseleave", () => {
    state.hoverLock = false;
    scheduleHide();
  });
}

async function hydrate() {
  if (!tauri) return;
  try {
    const localeCode = navigator.language || "en";
    state.messages = await tauri.invoke("load_locale", { locale: localeCode });
  } catch (error) {
    console.warn("locale fallback", error);
    state.messages = {};
  }
  applyLocaleToDom();

  try {
    const config = await tauri.invoke("load_config");
    state.activeConfig = normalizeConfig(config);
  } catch (error) {
    console.error("Failed to load config", error);
    state.activeConfig = normalizeConfig({
      theme: "dark",
      display_time: 3,
      corner: "bottom_right",
      custom_images: { copy: "", clear: "" },
    });
  }
  state.pendingConfig = normalizeConfig(cloneConfig(state.activeConfig));
  setFormFromConfig(state.pendingConfig);
  configureVisual(previewNode, state.pendingConfig, "copy", previewImage);
  initHoverBehaviour();
  initMenu();
  wireSettings();
  startPolling();
}

hydrate();
