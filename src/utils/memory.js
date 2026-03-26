// Persistent memory for dynamic data
const fs = require('fs');
const path = require('path');
const memoryFile = path.join(__dirname, 'memory.json');

function loadMemory() {
    if (!fs.existsSync(memoryFile)) return {};
    return JSON.parse(fs.readFileSync(memoryFile, 'utf-8'));
}

function saveMemory(memory) {
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}

module.exports = { loadMemory, saveMemory };