const { Client, LocalAuth } = require('whatsapp-web.js');
const { handleMessage } = require('./handler/MessageHandler');
const SessionManager = require('./utils/SessionManager');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.on('ready', () => {
    console.log('🤖 WhatsApp Business Bot is online!');
});

client.on('message', async message => {
    await handleMessage(client, message);
});

client.initialize();