// Extrai o áudio de um vídeo no próprio navegador, antes do upload.
//
// Motivo: o Whisper só ouve — mandar o vídeo inteiro transfere ordens de grandeza
// mais bytes do que o necessário, duas vezes (browser → Render → Groq). Um vídeo
// de 1 min a 21 MB vira ~2 MB de WAV 16 kHz mono, que é justamente o formato que
// o Whisper usa internamente. Sem ffmpeg, sem dependência: só Web Audio API.

const TAXA_ALVO = 16000; // 16 kHz mono — o que o Whisper consome

export function paraWav(amostras: Float32Array, taxa: number): Blob {
  const buffer = new ArrayBuffer(44 + amostras.length * 2);
  const view = new DataView(buffer);

  const texto = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  texto(0, "RIFF");
  view.setUint32(4, 36 + amostras.length * 2, true);
  texto(8, "WAVEfmt ");
  view.setUint32(16, 16, true); // tamanho do bloco fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, taxa, true);
  view.setUint32(28, taxa * 2, true); // bytes por segundo
  view.setUint16(32, 2, true); // alinhamento do bloco
  view.setUint16(34, 16, true); // bits por amostra
  texto(36, "data");
  view.setUint32(40, amostras.length * 2, true);

  for (let i = 0; i < amostras.length; i++) {
    const v = Math.max(-1, Math.min(1, amostras[i]));
    view.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Devolve um WAV 16 kHz mono com o áudio do arquivo.
 * Se a extração não for possível (codec sem suporte, arquivo sem áudio, navegador
 * antigo) devolve o arquivo original — o upload continua funcionando como antes.
 */
export async function extrairAudio(file: File): Promise<File> {
  try {
    // O AudioContext reamostra na decodificação: pedindo 16 kHz, já sai em 16 kHz.
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return file;

    const ctx = new Ctx({ sampleRate: TAXA_ALVO });
    let audio: AudioBuffer;

    try {
      audio = await ctx.decodeAudioData(await file.arrayBuffer());
    } finally {
      void ctx.close();
    }

    if (!audio.length) return file;

    // Mistura os canais em mono somando e dividindo pela quantidade de canais.
    const mono = new Float32Array(audio.length);
    for (let c = 0; c < audio.numberOfChannels; c++) {
      const canal = audio.getChannelData(c);
      for (let i = 0; i < canal.length; i++) mono[i] += canal[i] / audio.numberOfChannels;
    }

    const wav = paraWav(mono, audio.sampleRate);

    // Se não encolheu, o original já era eficiente (ex.: um m4a curto). Mantém.
    if (wav.size >= file.size) return file;

    const nome = file.name.replace(/\.[^.]+$/, "") + ".wav";
    return new File([wav], nome, { type: "audio/wav" });
  } catch {
    return file; // qualquer falha: manda o arquivo original
  }
}
