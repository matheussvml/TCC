import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Testar no celular pelo Wi-Fi (http://192.168.x.x:3000): sem isto o next dev
  // responde 403 aos scripts de desenvolvimento, a página não hidrata e nenhum
  // botão funciona, embora tudo pareça carregado. Só vale para o next dev.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
