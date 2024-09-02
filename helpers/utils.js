const ccxt = require('ccxt');

const { logErrorToFile } = require('../helpers/logError');

const MIN_VOLUME = 500000;

const fetchDataFromChosenExchanges = async (exchanges, currentPrices, bot, chatId) => {
    for (let exchangeId of exchanges) {
        try {
            const exchange = new ccxt[exchangeId]();
            const tickers = await exchange.fetchTickers();

            const data = Object.keys(tickers)
                .filter(symbol => symbol.includes('USDT') && tickers[symbol].quoteVolume >= MIN_VOLUME)
                .map(symbol => ({
                    exchange: exchangeId,
                    symbol,
                    price: tickers[symbol] ? tickers[symbol].last : null,
                    volume: tickers[symbol] ? tickers[symbol].quoteVolume.toFixed(2) : null
                }),
            );

            return currentPrices.concat(data);
        } catch (error) {
            bot.sendMessage(chatId, `Error fetching data from ${exchangeId}`);
            console.error(`Error fetching data from ${exchangeId}:`, error);

            logErrorToFile(error, chatId, bot);
        }
    }
};

const sendMessageWithHTML = async (bot, chatId, message) => {
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
};

module.exports = {
    fetchDataFromChosenExchanges,
    sendMessageWithHTML
};
