const ccxt = require('ccxt');

const exchanges = ['binance', 'bybit'];

const PRICE_CHANGE_THRESHOLD = 10;
const TIME_WINDOW = 10 * 60 * 1000;

const priceHistory = {};
const sentOpportunities = new Set();

const sniper = async (bot, chatId) => {
    try {
        console.log(sentOpportunities);
        let currentPrices = [];

        // Fetch price data from all exchanges
        for (let exchangeId of exchanges) {
            try {
                const exchange = new ccxt[exchangeId]();
                const tickers = await exchange.fetchTickers();

                const data = Object.keys(tickers).map(symbol => ({
                    exchange: exchangeId,
                    symbol,
                    price: tickers[symbol].last
                }));

                currentPrices = currentPrices.concat(data);
            } catch (error) {
                console.error(`Error fetching data from ${exchangeId}:`, error);
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

            if (priceChange >= PRICE_CHANGE_THRESHOLD) {
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
                    `Arbitrage opportunity detected:\n${opportunity}`
                );
            }
        }
    } catch (error) {
        console.error('Error in monitorArbitrage:', error);
    }
};

// Clear sent opportunities after 10 minutes
setInterval(() => {
    sentOpportunities.clear();
}, TIME_WINDOW);

module.exports = {
    sniper,
};
