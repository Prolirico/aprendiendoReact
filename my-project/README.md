# Iniciar back
node server.js

# Iniciar front
En carpeta raiz ejecutar: npm run dev

# Iniciar base de datos mysql
sudo systemctl enable --now mariadb

{
  username: "alumno1",
  email: "alumno1@example.com",
    password: "Password123",
  tipo_usuario: "alumno",
  estatus: "activo",
},
{
  username: "maestro1",
  email: "maestro1@example.com",
  password: "Password123",
  tipo_usuario: "maestro",
  estatus: "activo",
},
{
  username: "adminuni1",
  email: "adminuni1@example.com",
  password: "Password123",
  tipo_usuario: "admin_universidad",
  estatus: "activo",
},
{
  username: "sedeq1",
  email: "sedeq1@example.com",
  password: "Password123",
  tipo_usuario: "admin_sedeq",
  estatus: "activo",
}

# Base de datos
root: $Yy@pJB5Poqs

# JWT_secret
0d86c1e9aaf0192c1234673d06d6ed452beb5ca2a12014cfa913818b114444bd7a6ee2c64fde53f98503a98a153754becdf0fe8ec53304adb233f0c4fec0bf31
