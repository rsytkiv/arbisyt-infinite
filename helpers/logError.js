const fs = require('fs');
const path = require('path');

const sendBotErrorMessage = (chatId, error, bot) => {
    const errorString = JSON.stringify(error);

    bot.sendMessage(chatId, `Error: ${errorString.length > 50 ? errorString.substring(0, 50) + '...' : errorString}`);
};

// Function to ensure the logs directory exists
const ensureLogsDirectory = () => {
    const logsDir = path.join(__dirname, '..', 'logs'); // Adjust the path as needed
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    return logsDir;
};

// Updated function to log errors to a file in the logs directory
const logErrorToFile = (errorMessage, chatId, bot) => {
    const logsDir = ensureLogsDirectory();
    const logFilePath = path.join(logsDir, 'error.log');
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} ${chatId} - ${errorMessage}\n`;

    sendBotErrorMessage(chatId, errorMessage, bot);

    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err, `chatId: ${chatId}`);
        }
    });
};

module.exports = {
    logErrorToFile,
};
