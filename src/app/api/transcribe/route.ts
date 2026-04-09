import { execFile } from "child_process";
import path from "path";

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return Response.json(
      { status: "error", message: "URL não fornecida." },
      { status: 400 }
    );
  }

  const scriptPath = path.resolve("extrator_universal.py");

  try {
    const result = await new Promise<string>((resolve, reject) => {
      execFile(
        "python",
        ["-X", "utf8", scriptPath, url],
        { timeout: 120000, env: { ...process.env, PYTHONIOENCODING: "utf-8" } },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
            return;
          }
          resolve(stdout.trim());
        }
      );
    });

    const data = JSON.parse(result);
    return Response.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao processar o vídeo.";
    return Response.json({ status: "error", message }, { status: 500 });
  }
}
