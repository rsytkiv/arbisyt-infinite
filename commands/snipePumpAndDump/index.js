const { logErrorToFile } = require('../../helpers/logError');
const { fetchDataFromChosenExchanges, sendMessageWithHTML } = require('../../helpers/utils');

const { PRICE_CHANGE_THRESHOLD, DEFAULT_EXCHANGES } = require('../../constants');

const TIME_WINDOW = 10 * 60 * 1000;

const priceHistory = {};
const sentOpportunities = new Set();

const snipePumpAndDump = async (
    bot,
    chatId,
    exchanges = DEFAULT_EXCHANGES,
    changePercentage = PRICE_CHANGE_THRESHOLD,
) => {
    try {
        let currentPrices = [];
        console.log('working...');

        currentPrices = await fetchDataFromChosenExchanges(exchanges, currentPrices, bot, chatId);
        console.log(currentPrices);

        const now = Date.now();
        const arbitrageOpportunities = [];

        currentPrices.forEach(({ symbol, price, exchange, volume }) => {
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
                const opportunity = `<code>${symbol}</code>: ${priceChange.toFixed(2)}% change (Old: ${oldestPrice} ➡️ New: ${price})\n<b>Volume:</b> ${volume} \n<b>Exchange:</b> ${exchange}`;

                // Check if this opportunity has already been sent
                if (!sentOpportunities.has(symbol)) {
                    console.log(sentOpportunities, opportunity);
                    sentOpportunities.add(symbol); // Mark this opportunity as sent
                    arbitrageOpportunities.push(opportunity);
                }
            }
        });

        // Send alerts for arbitrage opportunities
        if (arbitrageOpportunities.length > 0) {
            for (let opportunity of arbitrageOpportunities) {
                sendMessageWithHTML(bot, chatId, `⚠️ <b>Price change detected:</b>\n${opportunity}`);
            }
        }
    } catch (error) {
        console.error('Error in main sniper block:', error);

        logErrorToFile(error, chatId, bot);
    }
};

module.exports = {
    snipePumpAndDump,
};
