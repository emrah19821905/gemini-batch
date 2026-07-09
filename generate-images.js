// generate-images.js
// Gemini API (Nano Banana - gemini-2.5-flash-image) ile toplu görsel üretimi
//
// KURULUM:
//   npm install @google/genai
//
// ÇALIŞTIRMA:
//   GEMINI_API_KEY=senin_api_keyin node generate-images.js
//
// (Codespaces'te .env kullanıyorsan aşağıya "dotenv" ekleyebilirsin, opsiyonel)

const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

// ---- AYARLAR ----
const PROMPTS_FILE = path.join(__dirname, "sessiz-su-gemini-prompts.json");
const OUTPUT_DIR = path.join(__dirname, "output");
const MODEL = "gemini-2.5-flash-image"; // Nano Banana
const DELAY_MS = 4000; // istekler arası bekleme (rate limit'e takılmamak için)

// ---- API KEY KONTROLÜ ----
if (!process.env.GEMINI_API_KEY) {
  console.error("HATA: GEMINI_API_KEY ortam değişkeni bulunamadı.");
  console.error("Şu şekilde çalıştır: GEMINI_API_KEY=senin_key node generate-images.js");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateOne(scene, styleSuffix) {
  const fullPrompt = `${scene.prompt} ${styleSuffix}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: fullPrompt,
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData);

  if (!imagePart) {
    throw new Error("Yanıtta görsel verisi bulunamadı (muhtemelen güvenlik filtresi engelledi).");
  }

  const buffer = Buffer.from(imagePart.inlineData.data, "base64");
  const fileName = `scene_${String(scene.id).padStart(2, "0")}.png`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  return fileName;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const data = JSON.parse(fs.readFileSync(PROMPTS_FILE, "utf-8"));
  const scenes = data.scenes;
  const styleSuffix = data.style_suffix || "";

  console.log(`Toplam ${scenes.length} sahne üretilecek.\n`);

  const results = { success: [], failed: [] };

  for (const scene of scenes) {
    process.stdout.write(`[${scene.id}/${scenes.length}] ${scene.section} ... `);
    try {
      const fileName = await generateOne(scene, styleSuffix);
      console.log(`✅ ${fileName}`);
      results.success.push(scene.id);
    } catch (err) {
      console.log(`❌ HATA: ${err.message}`);
      results.failed.push({ id: scene.id, error: err.message });
    }
    await sleep(DELAY_MS);
  }

  console.log("\n--- ÖZET ---");
  console.log(`Başarılı: ${results.success.length}/${scenes.length}`);
  if (results.failed.length > 0) {
    console.log(`Başarısız sahneler:`);
    results.failed.forEach((f) => console.log(`  - Sahne ${f.id}: ${f.error}`));
    console.log("\nBaşarısız olanları tekrar denemek için script'i tekrar çalıştırabilirsin.");
  }
}

main().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
