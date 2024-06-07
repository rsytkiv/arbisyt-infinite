const {
    AUTHORIZED_USERS,
} = require('../constants');

const isAuthorized = (userId = '') => AUTHORIZED_USERS.includes(userId.toString());

const separateBySpaces = (number) => {
    const reversedNumber = String(number).split('').reverse().join('');
    const separatedNumber = reversedNumber.replace(/(\d{3})(?=\d)/g, '$1,');

    return separatedNumber.split('').reverse().join('');
};

const stringRepresentation = (obj) => Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

const startTicker = async (bot, chatId) => {
    try {
        // const response = await getBinanceTokenPrice('GALAUSDT');
        // const oneresponse = await getOneInchTokenPrice();
        // console.log(oneresponse);
    } catch (error) {
        console.error('Error:', error.message);
        return []; // Return an empty array in case of error
    }
};

const help = (bot, chatId) => {
    return bot.sendMessage(
        chatId,
        `Available commands:\n/getticker - Get data about pair, format: '/getticker btc'\n/snipe - Find arbitrage`,
    );
};

module.exports = {
    separateBySpaces,
    isAuthorized,
    startTicker,
    help,
    stringRepresentation,
};
