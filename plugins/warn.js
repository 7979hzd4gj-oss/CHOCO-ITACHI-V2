import fs from 'fs';
import path from 'path';
import store from '../lib/lightweight_store.js';

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB =!!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);
const databaseDir = path.join(process.cwd(), 'data');
const warningsPath = path.join(databaseDir, 'warnings.json');

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

function initializeWarningsFile() {
    if (!HAS_DB) {
        if (!fs.existsSync(databaseDir)) fs.mkdirSync(databaseDir, { recursive: true });
        if (!fs.existsSync(warningsPath)) fs.writeFileSync(warningsPath, JSON.stringify({}), 'utf8');
    }
}

async function getWarnings() {
    if (HAS_DB) {
        const warnings = await store.getSetting('global', 'warnings');
        return warnings || {};
    } else {
        try { return JSON.parse(fs.readFileSync(warningsPath, 'utf8')); }
        catch { return {}; }
    }
}

async function saveWarnings(warnings) {
    if (HAS_DB) await store.saveSetting('global', 'warnings', warnings);
    else fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
}

export default {
    command: 'warn',
    aliases: ['warning', 'chocowarn'],
    category: 'admin',
    description: 'Warn user 3=kick - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫warn [@user]