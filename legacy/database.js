const Database = require("better-sqlite3");
const path = require("path");
const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

const db = new Database(path.join(__dirname, "couple-draw.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    friend_code TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL DEFAULT 'あなた',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pairs (
    id TEXT PRIMARY KEY,
    user_a TEXT NOT NULL REFERENCES users(id),
    user_b TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_a, user_b)
  );

  CREATE TABLE IF NOT EXISTS drawings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    pair_id TEXT NOT NULL REFERENCES pairs(id),
    question_date TEXT NOT NULL,
    image_data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, question_date)
  );

  CREATE INDEX IF NOT EXISTS idx_drawings_pair_date ON drawings(pair_id, question_date);
`);

function generateFriendCode() {
  let code;
  let attempts = 0;
  do {
    code = nanoid();
    attempts++;
    if (attempts > 50) throw new Error("フレンドコード生成に失敗しました");
  } while (db.prepare("SELECT 1 FROM users WHERE friend_code = ?").get(code));
  return code;
}

function createUser(displayName = "あなた") {
  const id = require("crypto").randomUUID();
  const friendCode = generateFriendCode();
  db.prepare(
    "INSERT INTO users (id, friend_code, display_name) VALUES (?, ?, ?)"
  ).run(id, friendCode, displayName);
  return getUser(id);
}

function getUser(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) || null;
}

function getUserByFriendCode(code) {
  return (
    db
      .prepare("SELECT * FROM users WHERE friend_code = ? COLLATE NOCASE")
      .get(code.trim().toUpperCase()) || null
  );
}

function getPairForUser(userId) {
  return (
    db
      .prepare(
        `SELECT * FROM pairs WHERE user_a = ? OR user_b = ? LIMIT 1`
      )
      .get(userId, userId) || null
  );
}

function getPartner(userId) {
  const pair = getPairForUser(userId);
  if (!pair) return null;
  const partnerId = pair.user_a === userId ? pair.user_b : pair.user_a;
  return getUser(partnerId);
}

function createPair(userA, userB) {
  if (userA === userB) throw new Error("自分自身とはペアになれません");
  const existingA = getPairForUser(userA);
  const existingB = getPairForUser(userB);
  if (existingA || existingB) {
    throw new Error("どちらかがすでにペアになっています");
  }
  const id = require("crypto").randomUUID();
  const [a, b] = userA < userB ? [userA, userB] : [userB, userA];
  db.prepare("INSERT INTO pairs (id, user_a, user_b) VALUES (?, ?, ?)").run(
    id,
    a,
    b
  );
  return db.prepare("SELECT * FROM pairs WHERE id = ?").get(id);
}

function saveDrawing(userId, pairId, questionDate, imageData) {
  const id = require("crypto").randomUUID();
  db.prepare(
    `INSERT INTO drawings (id, user_id, pair_id, question_date, image_data)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, question_date) DO UPDATE SET
       image_data = excluded.image_data,
       created_at = datetime('now')`
  ).run(id, userId, pairId, questionDate, imageData);
  return getDrawing(userId, questionDate);
}

function getDrawing(userId, questionDate) {
  return (
    db
      .prepare(
        "SELECT * FROM drawings WHERE user_id = ? AND question_date = ?"
      )
      .get(userId, questionDate) || null
  );
}

function getPartnerLatestDrawing(userId, questionDate) {
  const pair = getPairForUser(userId);
  if (!pair) return null;
  const partner = getPartner(userId);
  if (!partner) return null;
  const drawing =
    getDrawing(partner.id, questionDate) ||
    db
      .prepare(
        `SELECT * FROM drawings
         WHERE user_id = ? AND pair_id = ?
         ORDER BY question_date DESC, created_at DESC
         LIMIT 1`
      )
      .get(partner.id, pair.id);
  return drawing
    ? { ...drawing, partner_name: partner.display_name }
    : null;
}

module.exports = {
  db,
  createUser,
  getUser,
  getUserByFriendCode,
  getPairForUser,
  getPartner,
  createPair,
  saveDrawing,
  getDrawing,
  getPartnerLatestDrawing,
};
