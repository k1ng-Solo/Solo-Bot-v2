import makeWASocket from '@whiskeysockets/baileys';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import P from 'pino';

async function startBot() {
    // This will store your session files in the 'session' folder
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state,
        generateHighQualityLinkPreview: true
    });

    // Save credentials automatically
    sock.ev.on('creds.update', saveCreds);

    // Show pairing code in terminal for connecting a new device
    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') {
            console.log('✅ Bot is online and connected!');
        } else if (update.connection === 'close') {
            console.log('❌ Connection closed, restarting...');
            startBot();
        } else if (update.qr) {
            console.log('🔑 Pairing code:', update.qr); // This is your pairing code
        }
    });

    // Listen to incoming messages
    sock.ev.on('messages.upsert', async (m) => {
        console.log(JSON.stringify(m, null, 2));
        // Example: auto-reply
        if (m.messages && m.messages[0]?.message?.conversation) {
            const msg = m.messages[0];
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello! Bot received your message.' });
        }
    });
}

// Start the bot
startBot();