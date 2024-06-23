const ccxt = require('ccxt');

const { logErrorToFile } = require('./logError');
const { PRICE_CHANGE_THRESHOLD, DEFAULT_EXCHANGES } = require('../constants');

const TIME_WINDOW = 10 * 60 * 1000;

const priceHistory = {};
const sentOpportunities = new Set();

const sniper = async (
    bot,
    chatId,
    exchanges = DEFAULT_EXCHANGES,
    changePercentage = PRICE_CHANGE_THRESHOLD,
    pairs = ['USDT'],
) => {
    try {
        let currentPrices = [];
        console.log('working...');
        // Fetch price data from all exchanges
        for (let exchangeId of exchanges) {
            try {
                const exchange = new ccxt[exchangeId]();
                const tickers = await exchange.fetchTickers();

                // Filter tickers to include only those that end with USDT or USDC
                // const filteredTickers = Object.keys(tickers)
                //     .filter(symbol => pairs.some(pair => symbol.endsWith(pair)))
                //     .reduce((obj, key) => {
                //         obj[key] = tickers[key];
                //         return obj;
                //     }, {});
                // console.log(tickers);
                const data = Object.keys(tickers).map(symbol => ({
                    exchange: exchangeId,
                    symbol,
                    price: tickers[symbol] ? tickers[symbol].last : null
                }));

                currentPrices = currentPrices.concat(data);
            } catch (error) {
                bot.sendMessage(chatId, `Error fetching data from ${exchangeId}`);
                console.error(`Error fetching data from ${exchangeId}:`, error);

                logErrorToFile(error, chatId, bot);
            }
        }

        const now = Date.now();
        const arbitrageOpportunities = [];

        currentPrices.forEach(({ symbol, price }) => {
            if (!priceHistory[symbol]) {
                priceHistory[symbol] = [];
            }

            priceHistory[symbol].push({ time: now, price });

            // Remove old prices outside the time window
            priceHistory[symbol] = priceHistory[symbol].filter(p => now - p.time <= TIME_WINDOW);

            // Check for price changes within the time window
            const oldestPrice = priceHistory[symbol][0].price;
            const priceChange = ((price - oldestPrice) / oldestPrice) * 100;

            if (priceChange >= changePercentage) {
                const opportunity = `${symbol}: ${priceChange.toFixed(2)}% change (Old: ${oldestPrice}, New: ${price})`;

                // Check if this opportunity has already been sent
                if (!sentOpportunities.has(opportunity)) {
                    sentOpportunities.add(opportunity); // Mark this opportunity as sent
                    arbitrageOpportunities.push(opportunity);
                }
            }
        });

        // Send alerts for arbitrage opportunities
        if (arbitrageOpportunities.length > 0) {
            for (let opportunity of arbitrageOpportunities) {
                await bot.sendMessage(
                    chatId,
                    `Price change detected:\n${opportunity}`
                );
            }
        }
    } catch (error) {
        console.error('Error in main sniper block:', error);

        logErrorToFile(error, chatId, bot);
    }
};

// Clear sent opportunities after 10 minutes
setInterval(() => {
    sentOpportunities.clear();
}, TIME_WINDOW);

module.exports = {
    sniper,
};
