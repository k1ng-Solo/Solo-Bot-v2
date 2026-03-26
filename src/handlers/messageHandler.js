const fetch = require("node-fetch");
const { load, save } = require("../utils/memory");

const OWNER = (process.env.OWNER_NUMBER || "234XXXXXXXXXX") + "@s.whatsapp.net";

const greetings = [
"hi","hello","hey","how far","hwfr","wagwan","wassup","hyd"
];

async function handleMessage(msg,sock){

try{

if(!msg.message) return;

const body =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
msg.message.imageMessage?.caption || "";

const text = body.toLowerCase().trim();

const remoteJid = msg.key.remoteJid;
const sender = msg.key.participant || remoteJid;

const isOwner = sender === OWNER;


/* ---------------- GREETING ---------------- */

if(greetings.includes(text)){
return sock.sendMessage(remoteJid,{
text:`*SYSTEM ACTIVE* 🟢

Welcome to our business assistant.
Type *.menu* to continue.`
});
}


/* ---------------- MENU ---------------- */

if(text === ".menu"){
return sock.sendMessage(remoteJid,{
text:`🛠 BUSINESS ASSISTANT

User:
.rate
.order product
.pay

Admin:
.dashboard
.broadcast
.confirm
.reseller
.affiliate`
});
}


/* ---------------- LIVE CRYPTO ---------------- */

if(text === ".rate"){

const res = await fetch(
"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=ngn"
);

const data = await res.json();

return sock.sendMessage(remoteJid,{
text:`💱 Live Rates

BTC: ₦${data.bitcoin.ngn}
ETH: ₦${data.ethereum.ngn}
USDT: ₦${data.tether.ngn}`
});
}


/* ---------------- ORDER SYSTEM ---------------- */

if(text.startsWith(".order")){

const product = body.split(" ")[1];

let orders = load("orders");

const id = Date.now();

orders.push({
id,
user: sender,
product,
status:"pending",
paid:false
});

save("orders",orders);

await sock.sendMessage(remoteJid,{
text:`✅ Order created

Order ID: ${id}

Proceed to payment using *.pay*`
});

await sock.sendMessage(OWNER,{
text:`📦 NEW ORDER

ID: ${id}
Product: ${product}
User: ${sender}`
});

return;
}


/* ---------------- PAYMENT INFO ---------------- */

if(text === ".pay"){
return sock.sendMessage(remoteJid,{
text:`💳 Payment Info

Bank: Opay
Name: ADAOBI JOY NSOFOR
Acc: 7076642500

Send payment proof.`
});
}


/* ---------------- PAYMENT PROOF DETECTION ---------------- */

if(msg.message.imageMessage){

let orders = load("orders");

const pending = orders.find(o=>o.user===sender && !o.paid);

if(!pending) return;

pending.status = "awaiting-confirmation";
save("orders",orders);

await sock.sendMessage(OWNER,{
text:`💰 Payment Proof

Order: ${pending.id}
User: ${sender}`
});

await sock.sendMessage(OWNER,{
image: msg.message.imageMessage
});

return;
}


/* ---------------- CONFIRM PAYMENT ---------------- */

if(text.startsWith(".confirm") && isOwner){

const id = body.split(" ")[1];

let orders = load("orders");

const order = orders.find(o=>o.id == id);

if(!order) return;

order.paid = true;
order.status = "completed";

save("orders",orders);

await sock.sendMessage(order.user,{
text:`✅ Payment confirmed

Your order is being delivered.`
});

return;
}


/* ---------------- DASHBOARD ---------------- */

if(text === ".dashboard" && isOwner){

const orders = load("orders");

return sock.sendMessage(remoteJid,{
text:`📊 DASHBOARD

Orders: ${orders.length}
Paid: ${orders.filter(o=>o.paid).length}
Pending: ${orders.filter(o=>!o.paid).length}`
});
}


/* ---------------- BULK BROADCAST ---------------- */

if(text.startsWith(".broadcast") && isOwner){

const msgText = body.replace(".broadcast","");

const users = load("users");

for(const u of users){
await sock.sendMessage(u,{ text: msgText });
}

return;
}


/* ---------------- RESELLER SYSTEM ---------------- */

if(text.startsWith(".reseller") && isOwner){

const number = body.split(" ")[1];

let resellers = load("resellers");

resellers.push(number+"@s.whatsapp.net");

save("resellers",resellers);

return sock.sendMessage(remoteJid,{
text:"✅ Reseller added"
});
}


/* ---------------- AFFILIATE SYSTEM ---------------- */

if(text.startsWith(".affiliate") && isOwner){

const number = body.split(" ")[1];

let affiliates = load("affiliates");

affiliates.push({
user:number+"@s.whatsapp.net",
commission:0
});

save("affiliates",affiliates);

return sock.sendMessage(remoteJid,{
text:"✅ Affiliate added"
});
}


/* ---------------- AUTO SAVE USER ---------------- */

let users = load("users");

if(!users.includes(sender)){
users.push(sender);
save("users",users);
}


}catch(err){
console.log("ERROR:",err);
}

}

module.exports = { handleMessage };