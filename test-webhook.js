// ========================================
// Cole aqui a URL do seu webhook do n8n:
const WEBHOOK_URL = "http://localhost:5678/webhook-test/analisar-video";
// ========================================

async function main() {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      }),
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    const data = await res.text();
    if (data) console.log("Resposta:", data);
  } catch (err) {
    console.error("Erro ao conectar:", err.message);
  }
}

main();
