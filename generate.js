import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";
import { prompts } from "./prompts.js";

// API anahtarını ortam değişkeninden al
// Terminalde çalıştırmadan önce: export GEMINI_API_KEY="senin_anahtarin"
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const OUTPUT_DIR = "./output";
const MODEL = "gemini-2.5-flash-image"; // Nano Banana - ücretsiz katman: günde ~500 istek
const DELAY_MS = 4000; // İstekler arası bekleme (rate limit'e takılmamak için)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateOne(prompt, index) {
  const fileName = String(index + 1).padStart(2, "0") + ".png";
  const filePath = path.join(OUTPUT_DIR, fileName);

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart) {
      console.error(`[${fileName}] Görsel dönmedi. Model metin cevabı verdi olabilir.`);
      return false;
    }

    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    fs.writeFileSync(filePath, buffer);
    console.log(`[${fileName}] ✓ kaydedildi`);
    return true;
  } catch (err) {
    console.error(`[${fileName}] HATA:`, err.message);
    return false;
  }
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("HATA: GEMINI_API_KEY ortam değişkeni ayarlanmamış.");
    console.error('Çalıştırmadan önce: export GEMINI_API_KEY="senin_anahtarin"');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`${prompts.length} görsel üretilecek. Model: ${MODEL}\n`);

  let success = 0;
  let failed = [];

  for (let i = 0; i < prompts.length; i++) {
    const ok = await generateOne(prompts[i], i);
    if (ok) success++;
    else failed.push(i + 1);

    // Son istekten sonra bekleme yapma
    if (i < prompts.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nTamamlandı: ${success}/${prompts.length} görsel başarıyla üretildi.`);
  if (failed.length > 0) {
    console.log(`Başarısız olanlar (numaraları): ${failed.join(", ")}`);
    console.log("Bunları tekrar denemek için generate.js'i o indekslerle yeniden çalıştırabilirsin.");
  }
}

main();
