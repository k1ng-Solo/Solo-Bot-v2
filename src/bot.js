const makeWASocket = require("@whiskeysockets/baileys").default
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const pino = require("pino")

const { handleMessage } = require("./handler/MessageHandler")

async function startBot(){

    const { state, saveCreds } = await useMultiFileAuthState("./sessions")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({level:"silent"}),
        printQRInTerminal:false
    })

    // pairing code
    if(!sock.authState.creds.registered){
        const code = await sock.requestPairingCode(process.env.OWNER_NUMBER)
        console.log("PAIRING CODE:", code)
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("messages.upsert", async ({messages})=>{
        const msg = messages[0]
        if(!msg.message) return
        await handleMessage(sock,msg)
    })
}

startBot()