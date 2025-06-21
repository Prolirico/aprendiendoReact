const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

const userRoutes = require("./routes/userRoutes");

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rutas
app.get("/", (req, res) => {
  res.send("API funcionando");
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
