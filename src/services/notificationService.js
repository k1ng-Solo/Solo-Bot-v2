const fs = require('fs');
const path = require('path');
const notificationsFile = path.join(__dirname, '../data/notifications.json');

function loadNotifications() {
    if (!fs.existsSync(notificationsFile)) return [];
    return JSON.parse(fs.readFileSync(notificationsFile, 'utf-8'));
}

function saveNotifications(notifications) {
    fs.writeFileSync(notificationsFile, JSON.stringify(notifications, null, 2));
}

function notify(client, seller, message) {
    client.sendMessage(seller, `*🔔 UPDATE*\n${message}`);
}

module.exports = { loadNotifications, saveNotifications, notify };