import fs from 'fs';
import { dataFile } from './paths.js';
import store from './lightweight_store.js';

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB =!!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);

// CHOCO FIX: on utilise antilink.json comme dans DATA_DEFAULTS
const antilinkFilePath = dataFile('antilink.json');

async function loadAntilinkSettings() {
    if (HAS_DB) {
        const settings = await store.getSetting('global', 'antilinkSettings');
        return settings || {};
    } else {
        if (fs.existsSync(antilinkFilePath)) {
            try {
                const data = fs.readFileSync(antilinkFilePath, 'utf8');
                return JSON.parse(data);
            } catch { return {}; }
        }
        return {};
    }
}

async function saveAntilinkSettings(settings) {
    if (HAS_DB) {
        await store.saveSetting('global', 'antilinkSettings', settings);
    } else {
        fs.writeFileSync(antilinkFilePath, JSON.stringify(settings, null, 2));
    }
}

async function setAntilinkSetting(groupId, type) {
    const settings = await loadAntilinkSettings();
    settings[groupId] = type;
    await saveAntilinkSettings(settings);
}

async function getAntilinkSetting(groupId) {
    const settings = await loadAntilinkSettings();
    return settings[groupId] || 'off';
}

// CHOCO: pour compat avec ton ancien code qui appelle getAntilink
async function getAntilink(jid, def = 'off') {
    const s = await getAntilinkSetting(jid);
    return s === 'off'? null : { action: s };
}

export { setAntilinkSetting, getAntilinkSetting, loadAntilinkSettings, saveAntilinkSettings, getAntilink };