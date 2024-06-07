const TelegramBot = require('node-telegram-bot-api');
const { isAuthorized, startTicker, help } = require('./helpers/helpers');
const { getTickerInfo } = require('./helpers/getTickerInfo');
const { sniper } = require('./helpers/startSniping');

const { ADMIN_USER_ID, AUTHORIZED_USERS } = require('./constants');

require('dotenv').config();

const bot = new TelegramBot('6937685262:AAGsahvt9YMj5Mi5XjIS7WZhU9hLxCnXalU', { polling: true });

bot.on('message', async ({ from, chat, text, ...e }) => {
    const chatId = chat?.id;
    const userId = from?.id;
    console.log('q');
    if (text.startsWith('/adduser')) {
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
    } else if (text.startsWith('/help')) {
        help(bot, chat?.id);
    } else if (isAuthorized(userId)) {
        bot.onText(/\/getticker/, async ({ chat }, match) => {
            const inputArray = match?.input.split(' ');

            if (inputArray.length === 2) {
                await getTickerInfo(bot, chat?.id, inputArray[1]);
            } else {
                bot.sendMessage(chat?.id, 'This command requires ONE parameter');
            }
        });

        bot.onText(/\/snipe/, async ({ chat }) => {
            setInterval(() => {
                sniper(bot, chat?.id).catch(console.error);
            }, 30000);
            bot.sendMessage(chat?.id, 'Sniping started...');
        });
    } else {
        bot.sendMessage(chatId, 'You are not authorized to interact with this bot.');
    }
});

bot.onText(/.*/, ({ from }) => {
    if (from.id.toString() !== ADMIN_USER_ID) {
        bot.sendMessage(ADMIN_USER_ID, `Somebody trying to use me.\nHere is the info: ${JSON.stringify(from)}`);
    }
});
