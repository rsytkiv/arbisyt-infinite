const TelegramBot = require('node-telegram-bot-api');

const { isAuthorized, help } = require('./helpers/helpers');
const { getTickerInfo } = require('./helpers/getTickerInfo');
const { sniper } = require('./helpers/startSniping');

const {
    ADMIN_USER_ID,
    AUTHORIZED_USERS,
    DEFAULT_EXCHANGES,
    PRICE_CHANGE_THRESHOLD,
    DEFAULT_PAIRS,
} = require('./constants');
const { logErrorToFile } = require('./helpers/logError');

require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_KEY, { polling: true });

let sniperIntervalId = null;

bot.onText(/.*/, ({ from }) => {
    if (from.id.toString() !== ADMIN_USER_ID) {
        bot.sendMessage(ADMIN_USER_ID, `Somebody trying to use me.\nHere is the info: ${JSON.stringify(from)}`);
    }
});

bot.onText(/\/snipe/, async ({ chat, from }, match) => {
    try {
        if (!isAuthorized(from?.id)) return bot.sendMessage(chat?.id, 'You are not authorized to interact with this bot.');

        if (!sniperIntervalId) {
            const inputArray = match?.input.split(' ');

            const changePercentage = inputArray[2] || PRICE_CHANGE_THRESHOLD;
            const exchanges = inputArray[1]?.split(',') || DEFAULT_EXCHANGES;
            const pairsToDetect = inputArray[3]?.split(',') || DEFAULT_PAIRS;

            bot.sendMessage(chat?.id, `Current settings:\nExchanges: ${exchanges.map((e) => e)}\nPrice change percentage: ${changePercentage}% \nPairs: ${pairsToDetect?.map((i) => i)}`);
            bot.sendMessage(chat?.id, 'Sniping started...');

            sniperIntervalId = setInterval(() => {
                sniper(
                    bot,
                    chat?.id,
                    exchanges,
                    changePercentage,
                    pairsToDetect,
                ).catch(console.error);
            }, 30000);
        } else {
            bot.sendMessage(chat?.id, 'Sniping is already started, to stop it use /stopsnipe');
        }
    } catch (error) {
        logErrorToFile(error, chat?.id, bot);
    }
});

bot.onText(/\/stopsnipe/, ({ chat, from }) => {
    if (!isAuthorized(from?.id)) return bot.sendMessage(chat?.id, 'You are not authorized to interact with this bot.');

    if (sniperIntervalId !== null) {
        clearInterval(sniperIntervalId);
        sniperIntervalId = null; // Reset the ID to indicate there's no active interval
        bot.sendMessage(chat?.id, 'Sniping stopped.');
    } else {
        bot.sendMessage(chat?.id, 'No sniping is active.');
    }
});

bot.onText('/\/adduser/', ({ chat, from }) => {
    const chatId = chat?.id;
    const userId = from?.id;

    try {
        // Check if the sender is the admin
        if (userId === ADMIN_USER_ID) {
            const newUserId = parseInt(text.split(' ')[1], 10);

            if (!isNaN(newUserId) && !AUTHORIZED_USERS.includes(newUserId)) {
                AUTHORIZED_USERS.push(newUserId);

                bot.sendMessage(chatId, `User ${newUserId} has been added to the authorized list.`);
                bot.sendMessage(chatId, `Authorized users: ${AUTHORIZED_USERS}`);
            } else {
                bot.sendMessage(chatId, 'Invalid user ID or user already authorized.');
            }
        } else {
            bot.sendMessage(chatId, 'You are not authorized to add users.');
        }
    } catch (error) {
        logErrorToFile(error, chatId, bot);
    }
});

bot.onText(/\/getticker/, async ({ chat, from }, match) => {
    try {
        if (!isAuthorized(from?.id)) return bot.sendMessage(chat?.id, 'You are not authorized to interact with this bot.');

        const inputArray = match?.input.split(' ');

        if (inputArray.length === 2) {
            await getTickerInfo(bot, chat?.id, inputArray[1]);
        } else {
            bot.sendMessage(chat?.id, 'This command requires ONE parameter');
        }
    } catch (error) {
        logErrorToFile(error, chat?.id, bot);
    }
});

bot.onText(/\/help/, ({ chat }) => {
    help(bot, chat?.id);
});
