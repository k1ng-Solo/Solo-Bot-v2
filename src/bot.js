import makeWASocket, { useSingleFileAuthState } from "@whiskeysockets/baileys";

const { state, saveState } = useSingleFileAuthState('./session/auth_info.json');

async function startBot() {
    const sock = makeWASocket({
        auth: state
    });

    // Save auth updates automatically
    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('✅ Bot connected!');
        } else if (connection === 'close') {
            console.log('❌ Connection closed');
            if (lastDisconnect?.error?.output?.statusCode === 428) {
                console.log('⚠️ Requesting pairing code...');
                const pairing = await sock.requestPairingCode('web'); // 'web' for WhatsApp Web
                console.log('🔑 Pairing code:', pairing);
            }
        }
    });
}

startBot();