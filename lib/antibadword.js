import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import store from './lightweight_store.js';
import fs from 'fs';
import { dataFile } from './paths.js';
const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const HAS_DB =!!(MONGO_URL || POSTGRES_URL || MYSQL_URL);

async function loadAntibadwordConfig(groupId) {
    try {
        if (HAS_DB) {
            const config = await store.getSetting(groupId, 'antibadword');
            return config || {};
        } else {
            const configPath = dataFile('userGroupData.json');
            if (!fs.existsSync(configPath)) return {};
            const data = JSON.parse(fs.readFileSync(configPath, "utf-8").toString());
            return data.antibadword?.[groupId] || {};
        }
    } catch (error) {
        console.error('❌ Error loading antibadword config:', error.message);
        return {};
    }
}
async function setAntiBadword(chatId, type, action) {
    try {
        await store.saveSetting(chatId, 'antibadword', { enabled: true, action, type });
        return true;
    } catch (error) { return false; }
}
async function getAntiBadword(chatId, _type) {
    try {
        const settings = await store.getSetting(chatId, 'antibadword');
        return settings || null;
    } catch (error) { return null; }
}
async function removeAntiBadword(chatId) {
    try {
        await store.saveSetting(chatId, 'antibadword', { enabled: false, action: null, type: null });
        return true;
    } catch (error) { return false; }
}
async function incrementWarningCount(chatId, userId) {
    try {
        const warningsKey = `antibadword_warnings`;
        const warnings = await store.getSetting(chatId, warningsKey) || {};
        if (!warnings[userId]) warnings[userId] = 0;
        warnings[userId]++;
        await store.saveSetting(chatId, warningsKey, warnings);
        return warnings[userId];
    } catch (error) { return 0; }
}
async function resetWarningCount(chatId, userId) {
    try {
        const warningsKey = `antibadword_warnings`;
        const warnings = await store.getSetting(chatId, warningsKey) || {};
        if (warnings[userId]) {
            delete warnings[userId];
            await store.saveSetting(chatId, warningsKey, warnings);
        }
        return true;
    } catch (error) { return false; }
}

async function handleAntiBadwordCommand(sock, chatId, message, match) {
    if (!match) {
        return sock.sendMessage(chatId, {
            text: `🍫 *CHOCO-ITACHI ANTI-BADWORD* 😈\n\n*.antibadword on* - Active le filtre\n*.antibadword set <action>* - Choisis: delete/kick/warn\n*.antibadword off* - Désactive\n\n> Bot: CHOCO-ITACHI-V2 🍫😈\n> Owner: CHOCO ITACHI`
        }, { quoted: message });
    }
    if (match === 'on') {
        const existingConfig = await getAntiBadword(chatId, 'on');
        if (existingConfig?.enabled) {
            return sock.sendMessage(chatId, { text: '😈 AntiBad