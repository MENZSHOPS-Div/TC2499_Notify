const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const USER_DB_PATH = "./user_ids.json";
const GROUP_DB_PATH = "./group_ids.json";

// โหลด userId จากไฟล์
function loadUserIds() {
  if (!fs.existsSync(USER_DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(USER_DB_PATH));
}

// โหลด groupId จากไฟล์
function loadGroupIds() {
  if (!fs.existsSync(GROUP_DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(GROUP_DB_PATH));
}

// บันทึก userId ใหม่
function saveUserId(userId) {
  const userIds = loadUserIds();
  if (!userIds.includes(userId)) {
    userIds.push(userId);
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(userIds, null, 2));
    console.log(`✅ Saved new userId: ${userId}`);
  }
}

// บันทึก groupId ใหม่
function saveGroupId(groupId) {
  const groupIds = loadGroupIds();
  if (!groupIds.includes(groupId)) {
    groupIds.push(groupId);
    fs.writeFileSync(GROUP_DB_PATH, JSON.stringify(groupIds, null, 2));
    console.log(`✅ Saved new groupId: ${groupId}`);
  }
}

// ตอบกลับข้อความ
async function replyMessage(replyToken, message) {
  await axios.post("https://api.line.me/v2/bot/message/reply", {
    replyToken,
    messages: [{ type: "text", text: message }]
  }, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    }
  });
}

// Webhook รับ event จาก LINE
app.post("/webhook", async (req, res) => {
  const events = req.body.events;
  if (!events) return res.sendStatus(200);

  for (const event of events) {
    const source = event.source;
    const replyToken = event.replyToken;

    // เก็บ userId ถ้ามี
    if (source?.userId) {
      saveUserId(source.userId);
    }

    // เก็บ groupId ถ้ามี
    if (source?.groupId) {
      saveGroupId(source.groupId);
    }

    // ตอบกลับข้อความ
    if (replyToken) {
      await replyMessage(replyToken, "📌 บันทึก ID ของคุณหรือกลุ่มแล้วครับ");
    }
  }

  res.sendStatus(200);
});

// Endpoint ดู userId
app.get("/users", (req, res) => {
  res.json(loadUserIds());
});

// Endpoint ดู groupId
app.get("/groups", (req, res) => {
  res.json(loadGroupIds());
});

// เริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 LINE webhook server running at http://localhost:${PORT}`);
});
