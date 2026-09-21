import fs from 'fs';
import { dataFile } from '../lib/paths.js';
import store from '../lib/lightweight_store.js';

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB =!!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);
const warningsFilePath = dataFile('warnings.json');

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

async function loadWarnings() {
    if (HAS_DB) {
        const warnings = await store.getSetting('global', 'warnings');
        return warnings || {};
    } else {
        if (!fs.existsSync(warningsFilePath)) {
            fs.writeFileSync(warningsFilePath, JSON.stringify({}), 'utf8');
        }
        const data = fs.readFileSync(warningsFilePath, 'utf8');
        return JSON.parse(data);
    }
}

export default {
    command: 'warnings',
    aliases: ['checkwarn', 'warncount', 'chocowarn'],
    category: 'group',
    description: 'Check warn count - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫warnings [@user]',
    groupOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const mentionedJidList = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (mentionedJidList.length === 0) {
            await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO WARNINGS* 😈\n\nMentionne un user!\