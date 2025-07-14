import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Configuración de reescrituras (Rewrites)
   * @see https://nextjs.org/docs/app/api-reference/next-config-js/rewrites
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",

        destination: "http://165.140.156.195:3001/:path*",
      },
    ];
  },

  // Aquí puedes añadir otras opciones de configuración de Next.js si las necesitas.
};

export default nextConfig;
