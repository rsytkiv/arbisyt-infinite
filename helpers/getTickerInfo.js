const ccxt = require('ccxt');

const { separateBySpaces, stringRepresentation } = require('./helpers');

require('dotenv').config();

const getTickerInfo = async (bot, chatId, ticker) => {
    const binance = new ccxt.binance({
        apiKey: process.env.BINANCE_KEY,
        secret: process.env.BINANCE_SECRET,
    });

    const currencies = await binance.fetchCurrencies().catch((error) => console.error(error));

    if (Object.keys(currencies).includes(ticker.toUpperCase())) {
        const tickerData = await binance.fetchTicker(`${ticker.toUpperCase()}/USDT`);
        const curency = currencies[ticker.toUpperCase()];

        return bot.sendMessage(chatId, `Symbol: ${curency.id}\nPrice: $${tickerData.average}\nDeposits: ${curency.deposit ? 'Enabled' : 'Disabled'}\nWithdrawals: ${curency.withdraw ? 'Enabled' : 'Disabled'}\nVolume: $${separateBySpaces(Math.round(tickerData.quoteVolume))}\nNetworks: ${Object.keys(curency.networks).join(', ')}\nFees: ${stringRepresentation(curency.fees)}`);
    } else {
        return bot.sendMessage(chatId, 'Invalid symbol, should be something like - eth');
    }
};

module.exports = {
    getTickerInfo,
};
