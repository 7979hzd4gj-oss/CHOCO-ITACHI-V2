import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const WA_LIMIT = 60000;
const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

function getQuoted(message) {
    return message?.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
}

async function sendResult(sock, chatId, channelInfo, message, text, filename) {
    if (text.length > WA_LIMIT) {
        const tmpFile = path.join(process.cwd(), 'temp', filename);
        fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
        fs.writeFileSync(tmpFile, text);
        await sock.sendMessage(chatId, {
            document: fs.readFileSync(tmpFile),
            mimetype: 'text/plain',
            fileName: filename,
            caption: '📝 Résultat trop long, fichier CHOCO 🍫😈',
            ...channelInfo
        }, { quoted: message });
        try { fs.unlinkSync(tmpFile); } catch { }
    } else {
        await sock.sendMessage(chatId, { 
            image: { url: CHOCO_IMG },
            caption: text, 
            ...channelInfo 
        }, { quoted: message });
    }
}

export default {
    command: 'wordcloud',
    aliases: ['wordfreq', 'topwords', 'wordcount', 'chocoword'],
    category: 'utility',
    description: 'Analyse texte - Top 20 mots - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫wordcloud <texte ou réponds à un message/fichier>',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const prefix = "🍫";
        const scriptPath = path.join(process.cwd(), 'lib', 'wordcloud.py');
        
        if (!fs.existsSync(scriptPath)) {
            return await sock.sendMessage(chatId, {
                text: `❌ wordcloud.py introuvable dans lib/ 😈🍫`,
                ...channelInfo
            }, { quoted: message });
        }

        const quoted = getQuoted(message);
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const hasDoc = !!quoted?.documentMessage;
        const textInput = args.join(' ').trim() || quotedText;

        if (!textInput && !hasDoc) {
            return await sock.sendMessage(chatId, {
                text: `┏━━ 🍫 *CHOCO WORDCLOUD* 😈 ━━┓\n`+
                    `┃\n`+
                    `┃ 📝 *Utilisation:*\n`+
                    `┃ \`${prefix}wordcloud <ton texte>\`\n`+
                    `┃\n`+
                    `┃ *Ou réponds à:*\n`+
                    `┃ • Un message texte\n`+
                    `┃ • Un fichier .txt\n`+
                    `┃\n`+
                    `┃ *Résultat:*\n`+
                    `┃ 📊 Nombre de mots, uniques\n`+
                    `┃ 🏆 Top 20 mots utilisés\n`+
                    `┃ ⏱️ Temps lecture\n`+
                    `┃ 🎯 Diversité lexicale\n`+
                    `┗━━━━ 😈 By CHOCO 224611257942 🍫`,
                ...channelInfo
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: `🍫 Analyse en cours... 😈`,