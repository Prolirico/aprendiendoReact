const fs = require('fs');
const path = require('path');

// Nos aseguramos de que el directorio de logs exista.
// Usamos path.join(__dirname, '..', 'logs') para subir un nivel desde 'config' y luego entrar a 'logs'.
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'server.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const logWithLevel = (level, message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    console.log(logMessage.trim());
    logStream.write(logMessage);
};

const logger = {
    log: (message) => logWithLevel('log', message),
    info: (message) => logWithLevel('info', message),
    warn: (message) => logWithLevel('warn', message),
    error: (message) => logWithLevel('error', message),
};

module.exports = logger;
