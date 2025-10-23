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
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },

  // Aquí puedes añadir otras opciones de configuración de Next.js si las necesitas.
};

export default nextConfig;
