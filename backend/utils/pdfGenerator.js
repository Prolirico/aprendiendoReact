const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

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

    // Inyectar la etiqueta <base> para que las rutas relativas (CSS, imágenes de fondo) funcionen
    const baseTag = `<base href="${SERVER_URL}/">`;
    htmlContent = htmlContent.replace("<head>", `<head>\n    ${baseTag}`);

    // 2. Reemplazar los placeholders con los datos reales
    for (const key in data) {
      const value = data[key] || ""; // Usar string vacío si el valor es null/undefined
      // Crear una expresión regular para buscar el data-field y reemplazar el contenido del elemento
      const regexContenido = new RegExp(`(data-field="${key}"[^>]*>)[^<]*(<)`);
      htmlContent = htmlContent.replace(regexContenido, `$1${value}$2`);

      // Para imágenes, construir URL absoluta, reemplazar el src y quitar el display:none
      if (key.startsWith("logo") || key.startsWith("firma")) {
        const relativePath = value;
        if (
          relativePath &&
          typeof relativePath === "string" &&
          relativePath.startsWith("/")
        ) {
          const absoluteUrl = `${SERVER_URL}${relativePath}`;
          const regexImg = new RegExp(
            `(<img[^>]*data-field="${key}"[^>]*src=")[^"]*("[^>]*style="[^"]*display: none[^"]*")`,
          );
          htmlContent = htmlContent
            .replace(regexImg, `$1${absoluteUrl}$2`)
            .replace(`display: none`, `display: block`);
        }
      }
    }

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
