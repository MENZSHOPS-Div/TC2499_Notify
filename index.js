const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const DB_PATH = "./user_ids.json";

// โหลด userId จากไฟล์ (หรือคืน [] หากไม่มี)
function loadUserIds() {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH));
}

// บันทึก userId ใหม่
function saveUserId(userId) {
  const userIds = loadUserIds();
  if (!userIds.includes(userId)) {
    userIds.push(userId);
    fs.writeFileSync(DB_PATH, JSON.stringify(userIds, null, 2));
    console.log(`✅ Saved new userId: ${userId}`);
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

  for (const event of events) {
    const userId = event.source?.userId;
    const replyToken = event.replyToken;

    if (userId) {
      saveUserId(userId);
      await replyMessage(replyToken, "📌 บันทึก ID ของคุณแล้วครับ");
    }
  }

  res.sendStatus(200);
});

// Endpoint ทดสอบดู userId ที่บันทึกไว้
app.get("/users", (req, res) => {
  res.json(loadUserIds());
});

// เริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 LINE webhook server running at http://localhost:${PORT}`);
});
