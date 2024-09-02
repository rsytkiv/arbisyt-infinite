const {
    AUTHORIZED_USERS,
} = require('../constants');

const isAuthorized = (userId) => AUTHORIZED_USERS.includes(userId.toString());

const separateBySpaces = (number) => {
    const reversedNumber = String(number).split('').reverse().join('');
    const separatedNumber = reversedNumber.replace(/(\d{3})(?=\d)/g, '$1,');

    return separatedNumber.split('').reverse().join('');
};

const stringRepresentation = (obj) => Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

const help = (bot, chatId) => {
    return bot.sendMessage(
        chatId,
        `Available commands:\n/getticker - Get data about pair, format: '/getticker btc'\n/snipe exchanges | price change (%) | pairs - Find arbitrage\n/snipe - Snipe for token price changes, format: /snipe binance,mexc 15`,
    );
};

module.exports = {
    separateBySpaces,
    isAuthorized,
    help,
    stringRepresentation,
};
