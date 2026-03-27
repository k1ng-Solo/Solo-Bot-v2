import makeWASocket from '@whiskeysockets/baileys';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import P from 'pino';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session'); // your session folder

    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true, // remove if you want pairing code only
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        console.log(update);
        if (update.connection === 'close') {
            console.log('Connection closed, restarting...');
            startBot();
        }
    });

    sock.ev.on('messages.upsert', (m) => {
        console.log(JSON.stringify(m, null, 2));
    });
}

startBot();