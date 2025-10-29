const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio"); // Nueva dependencia
const SERVER_URL = process.env.API_URL || "http://localhost:5000";

/**
 * Genera un documento PDF a partir de una plantilla HTML y datos dinámicos.
 * @param {string} templateName - Nombre del archivo de plantilla HTML (ej. 'constancia.html').
 * @param {Object} data - Objeto con los datos para reemplazar en la plantilla.
 * @param {string} outputPath - Ruta absoluta donde se guardará el PDF generado.
 */
const generatePdf = async (templateName, data, outputPath) => {
  let browser = null;
  try {
    // 1. Cargar la plantilla HTML desde la carpeta public del frontend
    const templatePath = path.resolve(
      __dirname,
      "../../my-project/public",
      templateName,
    );
    let htmlContent = fs.readFileSync(templatePath, "utf-8");

    // Inyectar la etiqueta <base> para assets relativos como background (opcional con base64)
    const baseTag = `<base href="${SERVER_URL}/">`;
    htmlContent = htmlContent.replace("<head>", `<head>\n ${baseTag}`);

    // 2. Usar Cheerio para parsear y reemplazar placeholders de manera robusta
    const $ = cheerio.load(htmlContent);

    for (const key in data) {
      const value = data[key] || ""; // Valor vacío si null
      const elements = $(`[data-field="${key}"]`);
      elements.each((i, el) => {
        if (key === "logoUniversidad" && value) {
          // Para logo: Setea src y display en el img
          $(el).attr("src", value).css("display", "block");
        } else if (key.startsWith("firma") && value) {
          // Para firmas: El data-field está en el div padre; setea en el img hijo
          const img = $(el).find("img");
          if (img.length) {
            img.attr("src", value).css({
              width: "100%",
              height: "100%",
              "object-fit": "contain",
              display: "block",
            });
          }
        } else {
          // Para campos de texto: Setea textContent
          $(el).text(value);
        }
      });
    }

    htmlContent = $.html(); // Obtener el HTML actualizado

    // Debug: Guarda HTML post-replace para inspeccionar
    fs.writeFileSync("debug_post_replace.html", htmlContent);

    // 3. Iniciar Puppeteer y generar el PDF
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    // Establecer el contenido de la página
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Asegurarse de que el directorio de salida exista
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 4. Generar el PDF
    await page.pdf({
      path: outputPath,
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    });
  } catch (error) {
    console.error(`Error al generar el PDF para ${templateName}:`, error);
    throw new Error("No se pudo generar el documento PDF.");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { generatePdf };
