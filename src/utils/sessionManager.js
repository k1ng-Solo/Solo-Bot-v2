// Handles multi-client sessions (network mode)
const fs = require('fs');
const path = require('path');

const sessionsFile = path.join(__dirname, 'sessions.json');

function loadSessions() {
    if (!fs.existsSync(sessionsFile)) return [];
    return JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
}

function saveSessions(sessions) {
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
}

module.exports = { loadSessions, saveSessions };