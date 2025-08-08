module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "npm",
      args: "start",
      env: {
        PORT: 3001,
        NODE_ENV: "production",
      },
    },
  ],
};

/*
module.exports = {
  apps: [
    {
      name: "backend-microcredenciales",
      script: "./backend/server.js",
      cwd: "/home/site36787",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        // Permitir acceso desde el frontend
        CORS_ORIGIN: "http://165.140.156.195:3001,http://localhost:3001",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_file: "./logs/backend-combined.log",
      time: true,
      // Reintentos en caso de falla
      max_restarts: 10,
      min_uptime: "10s",
    },
    {
      name: "frontend-microcredenciales",
      script: "npm",
      args: "start",
      cwd: "/home/site36787/microCredenciales",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        // Variables necesarias para Next.js
        NEXT_PUBLIC_API_URL: "http://165.140.156.195/api",
        NEXT_PUBLIC_SERVER_URL: "http://165.140.156.195",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_file: "./logs/frontend-combined.log",
      time: true,
      // Reintentos en caso de falla
      max_restarts: 10,
      min_uptime: "10s",
      // Esperar a que el backend se inicie primero
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
*/
