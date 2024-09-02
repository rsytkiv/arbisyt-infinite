const TelegramBot = require('node-telegram-bot-api');

const { isAuthorized, help } = require('./helpers/helpers');
const { getTickerInfo } = require('./helpers/getTickerInfo');
const { snipePumpAndDump } = require('./commands/snipePumpAndDump');

const {
    ADMIN_USER_ID,
    AUTHORIZED_USERS,
    DEFAULT_EXCHANGES,
    PRICE_CHANGE_THRESHOLD,
} = require('./constants');
const { logErrorToFile } = require('./helpers/logError');
const { sendMessageWithHTML } = require('./helpers/utils');

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
        if (!isAuthorized(from?.id)) return bot.sendMessage(chat?.id, '⛔️ You are not authorized to interact with this bot.');

        if (!sniperIntervalId) {
            const inputArray = match?.input.split(' ');

            const changePercentage = Number(inputArray[2]) || PRICE_CHANGE_THRESHOLD;
            const exchanges = inputArray[1]?.split(',') || DEFAULT_EXCHANGES;

            sendMessageWithHTML(bot, chat?.id, `⚙️ <b>Current settings:</b>\n<b>Exchanges:</b> ${exchanges.map((e) => e)}\n<b>Price change percentage:</b> ${changePercentage}%`);
            bot.sendMessage(chat?.id, 'Sniping started...');

            sniperIntervalId = setInterval(() => {
                snipePumpAndDump(
                    bot,
                    chat?.id,
                    exchanges,
                    changePercentage,
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

bot.onText(/\/adduser/, ({ chat, from }, match) => {
    const chatId = chat?.id;
    const userId = from?.id;

    try {
        // Check if the sender is the admin
        if (userId.toString() === ADMIN_USER_ID) {
            const newUserId = parseInt(match?.input.split(' ')[1], 10).toString();

            if (newUserId && !AUTHORIZED_USERS.includes(newUserId)) {
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
