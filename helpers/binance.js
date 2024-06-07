const axios = require('axios');
const { BINANCE_API } = require('../constants');

const getBinanceTokenPrice = async (token) => await axios.get(
    `${BINANCE_API.BASE_URL}${BINANCE_API.PRICE_ENDPOINT}${token}`, {
    'X-MBX-APIKEY': BINANCE_API.KEY,
});

module.exports = {
    getBinanceTokenPrice,
};
