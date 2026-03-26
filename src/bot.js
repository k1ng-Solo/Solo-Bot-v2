const { Client, LocalAuth } = require('whatsapp-web.js');
const { handleMessage } = require('./handler/MessageHandler');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('ready', () => {
    console.log('✅ Bot is ready!');
});

client.on('message', async message => {
    await handleMessage(client, message);
});

client.initialize();