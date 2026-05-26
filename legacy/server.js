const express = require("express");
const cors = require("cors");
const path = require("path");
const { getDailyQuestion } = require("./questions");
const {
  createUser,
  getUser,
  getUserByFriendCode,
  getPairForUser,
  getPartner,
  createPair,
  saveDrawing,
  getDrawing,
  getPartnerLatestDrawing,
} = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

function requireUser(req, res, next) {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(401).json({ error: "ログインが必要です" });
  }
  const user = getUser(userId);
  if (!user) {
    return res.status(401).json({ error: "ユーザーが見つかりません" });
  }
  req.user = user;
  next();
}

app.post("/api/users", (req, res) => {
  const { displayName } = req.body || {};
  const user = createUser(
    (displayName || "あなた").toString().slice(0, 20) || "あなた"
  );
  res.json({
    id: user.id,
    friendCode: user.friend_code,
    displayName: user.display_name,
  });
});

app.get("/api/me", requireUser, (req, res) => {
  const pair = getPairForUser(req.user.id);
  const partner = getPartner(req.user.id);
  res.json({
    id: req.user.id,
    friendCode: req.user.friend_code,
    displayName: req.user.display_name,
    paired: !!pair,
    partner: partner
      ? { displayName: partner.display_name, friendCode: partner.friend_code }
      : null,
  });
});

app.patch("/api/me", requireUser, (req, res) => {
  const { displayName } = req.body || {};
  if (displayName) {
    const { db } = require("./database");
    db.prepare("UPDATE users SET display_name = ? WHERE id = ?").run(
      displayName.toString().slice(0, 20),
      req.user.id
    );
  }
  const user = getUser(req.user.id);
  res.json({
    displayName: user.display_name,
    friendCode: user.friend_code,
  });
});

app.post("/api/pair", requireUser, (req, res) => {
  const { friendCode } = req.body || {};
  if (!friendCode) {
    return res.status(400).json({ error: "フレンドコードを入力してください" });
  }
  const partner = getUserByFriendCode(friendCode);
  if (!partner) {
    return res.status(404).json({ error: "フレンドコードが見つかりません" });
  }
  try {
    const pair = createPair(req.user.id, partner.id);
    res.json({
      paired: true,
      partner: {
        displayName: partner.display_name,
        friendCode: partner.friend_code,
      },
      pairId: pair.id,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/daily", requireUser, (req, res) => {
  const daily = getDailyQuestion();
  const mine = getDrawing(req.user.id, daily.date);
  const partnerArt = getPartnerLatestDrawing(req.user.id, daily.date);
  res.json({
    date: daily.date,
    question: daily.question,
    submitted: !!mine,
    myDrawing: mine ? mine.image_data : null,
    partnerDrawing: partnerArt
      ? {
          image: partnerArt.image_data,
          date: partnerArt.question_date,
          partnerName: partnerArt.partner_name,
        }
      : null,
  });
});

app.post("/api/drawings", requireUser, (req, res) => {
  const { imageData } = req.body || {};
  if (!imageData || !imageData.startsWith("data:image/")) {
    return res.status(400).json({ error: "画像データが不正です" });
  }
  const pair = getPairForUser(req.user.id);
  if (!pair) {
    return res
      .status(400)
      .json({ error: "ペアになるまでお絵描きできません" });
  }
  const daily = getDailyQuestion();
  const drawing = saveDrawing(
    req.user.id,
    pair.id,
    daily.date,
    imageData
  );
  res.json({ ok: true, date: daily.date, createdAt: drawing.created_at });
});

app.get("/api/partner-icon", requireUser, (req, res) => {
  const daily = getDailyQuestion();
  const partnerArt = getPartnerLatestDrawing(req.user.id, daily.date);
  if (!partnerArt) {
    return res.json({ image: null, partnerName: null });
  }
  res.json({
    image: partnerArt.image_data,
    date: partnerArt.question_date,
    partnerName: partnerArt.partner_name,
  });
});

app.listen(PORT, () => {
  console.log(`💕 お絵描きアプリ: http://localhost:${PORT}`);
});
