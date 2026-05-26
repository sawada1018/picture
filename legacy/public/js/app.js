const STORAGE_KEY = "futarioe_user_id";

const $ = (sel) => document.querySelector(sel);

const screens = {
  welcome: $("#screen-welcome"),
  pair: $("#screen-pair"),
  main: $("#screen-main"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name]?.classList.add("active");
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2600);
}

function getUserId() {
  return localStorage.getItem(STORAGE_KEY);
}

function setUserId(id) {
  localStorage.setItem(STORAGE_KEY, id);
}

function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const uid = getUserId();
  if (uid) headers["X-User-Id"] = uid;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "エラーが発生しました");
  return data;
}

/** 相手の絵をアプリアイコン（favicon / ホーム画面）に反映 */
function setAppIconFromDrawing(dataUrl, partnerName) {
  if (!dataUrl) return;

  const favicon = $("#favicon");
  const apple = $("#apple-touch-icon");
  const partnerIcon = $("#partner-icon");

  [favicon, apple, partnerIcon].forEach((el) => {
    if (el) el.src = dataUrl;
  });

  document.title = partnerName
    ? `${partnerName}の絵 | ふたりおえ`
    : "ふたりおえ";

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SET_ICON",
      image: dataUrl,
    });
  }
}

function setPreview(imgEl, src, empty = false) {
  if (!imgEl) return;
  if (src) {
    imgEl.src = src;
    imgEl.classList.remove("empty");
  } else {
    imgEl.src = "/icons/placeholder.svg";
    imgEl.classList.add("empty");
  }
}

let drawer;

async function refreshDaily() {
  const daily = await api("/api/daily");
  $("#daily-question").textContent = daily.question;
  $("#daily-date").textContent = daily.date;

  if (daily.myDrawing) {
    drawer.loadFromDataUrl(daily.myDrawing);
    $("#submit-status").textContent = "今日の絵は送信済み。上書きして再送できます";
  }

  setPreview($("#my-preview"), daily.myDrawing);

  const partner = daily.partnerDrawing;
  if (partner?.image) {
    setPreview($("#partner-preview"), partner.image);
    $("#partner-caption").textContent = partner.partnerName || "相手";
    setAppIconFromDrawing(partner.image, partner.partnerName);
  } else {
    setPreview($("#partner-preview"), null, true);
  }

  return daily;
}

async function refreshMe() {
  return api("/api/me");
}

async function initMain() {
  const me = await refreshMe();
  if (!me.paired) {
    showScreen("pair");
    $("#my-friend-code").textContent = me.friendCode;
    return;
  }

  $("#partner-name").textContent = me.partner?.displayName || "相手";
  showScreen("main");
  await refreshDaily();

  setInterval(async () => {
    try {
      const daily = await api("/api/daily");
      const p = daily.partnerDrawing;
      if (p?.image) {
        setPreview($("#partner-preview"), p.image);
        setAppIconFromDrawing(p.image, p.partnerName);
      }
    } catch {
      /* ignore poll errors */
    }
  }, 30000);
}

async function bootstrap() {
  const canvas = $("#draw-canvas");
  drawer = new DrawCanvas(canvas, { paletteEl: $("#color-palette") });

  $("#brush-size").addEventListener("input", (e) => {
    drawer.setBrushSize(e.target.value);
  });

  $("#btn-eraser").addEventListener("click", () => {
    drawer.setEraser(true);
    toast("消しゴムモード");
  });

  $("#color-palette").addEventListener("click", () => {
    drawer.setEraser(false);
  });

  $("#btn-clear").addEventListener("click", () => {
    if (confirm("キャンバスを白紙に戻しますか？")) drawer.clear();
  });

  const uid = getUserId();
  if (uid) {
    try {
      await initMain();
      return;
    } catch {
      clearUser();
    }
  }
  showScreen("welcome");
}

$("#form-start").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#display-name").value.trim() || "あなた";
  try {
    const user = await api("/api/users", {
      method: "POST",
      body: JSON.stringify({ displayName: name }),
    });
    setUserId(user.id);
    toast(`ようこそ、${user.displayName}さん！`);
    $("#my-friend-code").textContent = user.friendCode;
    showScreen("pair");
  } catch (err) {
    toast(err.message);
  }
});

$("#form-pair").addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = $("#partner-code").value.trim();
  const errEl = $("#pair-error");
  errEl.hidden = true;
  try {
    await api("/api/pair", {
      method: "POST",
      body: JSON.stringify({ friendCode: code }),
    });
    toast("ペア成立！ 💕");
    await initMain();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  }
});

$("#btn-copy-code").addEventListener("click", async () => {
  const code = $("#my-friend-code").textContent;
  try {
    await navigator.clipboard.writeText(code);
    toast("コードをコピーしたよ");
  } catch {
    toast(code);
  }
});

$("#btn-submit").addEventListener("click", async () => {
  if (drawer.isBlank()) {
    toast("何か描いてから送ってね");
    return;
  }
  const btn = $("#btn-submit");
  btn.disabled = true;
  try {
    const imageData = drawer.exportDataUrl();
    await api("/api/drawings", {
      method: "POST",
      body: JSON.stringify({ imageData }),
    });
    toast("今日の絵を送ったよ！ ✨");
    $("#submit-status").textContent = "送信完了";
    setPreview($("#my-preview"), imageData);
    await refreshDaily();
  } catch (err) {
    toast(err.message);
  } finally {
    btn.disabled = false;
  }
});

$("#btn-settings").addEventListener("click", async () => {
  const me = await refreshMe();
  $("#settings-name").value = me.displayName;
  $("#settings-code").textContent = me.friendCode;
  $("#dialog-settings").showModal();
});

$("#form-settings").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#settings-name").value.trim();
  if (name) {
    await api("/api/me", {
      method: "PATCH",
      body: JSON.stringify({ displayName: name }),
    });
    $("#partner-name").textContent = name;
  }
  $("#dialog-settings").close();
});

$("#btn-reset").addEventListener("click", () => {
  if (confirm("ログイン情報を消して最初からやり直しますか？")) {
    clearUser();
    location.reload();
  }
});

bootstrap();
