import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { channelInfo } from '../../lib/messageConfig.js';

const execAsync = promisify(exec);
const WA_LIMIT = 60000;

function getQuoted(message) {
    return message?.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
}

async function sendResult(sock, chatId, message, text, filename) {
    if (text.length > WA_LIMIT) {
        const tmpFile = path.join(process.cwd(), 'temp', filename);
        fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
        fs.writeFileSync(tmpFile, text);
        await sock.sendMessage(chatId, {
            document: fs.readFileSync(tmpFile),
            mimetype: 'text/plain',
            fileName: filename,
            caption: '🍫 Résultat trop long, envoyé en fichier chef!',
           ...channelInfo
        }, { quoted: message });
        try { fs.unlinkSync(tmpFile); } catch {}
    } else {
        await sock.sendMessage(chatId, { text,...channelInfo }, { quoted: message });
    }
}

export default {
    command: 'urldecode',
    aliases: ['urlencode', 'urlextract', 'links', 'extractlinks', 'url'],
    category: 'utility',
    description: 'CHOCO URL tools - encode/decode/extract',
    usage: '.urldecode <url> |.urlencode <text> |.extractlinks <text>',

    async handler(sock, message, args, context) {
        const { chatId, userMessage } = context;
        const scriptPath = path.join(process.cwd(), 'lib', 'urltool.py');

        if (!fs.existsSync(scriptPath)) {
            return await sock.sendMessage(chatId, {
                text: `💀 *urltool.py introuvable dans lib/* chef!`,
               ...channelInfo
            }, { quoted: message });
        }

        const quoted = getQuoted(message);
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const hasDoc =!!quoted?.documentMessage;

        // CHOCO MODE DETECT
        let mode = 'decode';
        const cmd = userMessage.toLowerCase();
        if (cmd.includes('encode')) mode = 'encode';
        else if (cmd.includes('extract') || cmd.includes('links')) mode = 'extract';

        if (['encode','extract','decode','links'].includes(args[0]?.toLowerCase())) {
            if(args[0].toLowerCase()!== 'links') mode = args[0].toLowerCase();
            else mode = 'extract';
            args = args.slice(1);
        }

        const textInput = args.join(' ').trim() || quotedText;

        if (!textInput &&!hasDoc) {
            return await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO URL TOOLS* 😈\n\n`+
                      `*1. Decode:*\n\`.urldecode https://ex.com/path%20space\`\n\n`+
                      `*2. Encode:*\n\`.urlencode hello world & co\`\n\n`+
                      `*3. Extract links:*\n\`.extractlinks <texte>\`\n`+
                      `Ou reply à un fichier avec \`.extractlinks\`\n\n`+
                      `> _Powered by CHOCO-ITACHI-V2_`,
               ...channelInfo
            }, { quoted: message });
        }

        const tempDir = path.join(process.cwd(), 'temp');
        fs.mkdirSync(tempDir, { recursive: true });
        const id = Date.now();

        try {
            let stdout;
            if (hasDoc && mode === 'extract') {
                await sock.sendMessage(chatId, { text: '⏳ *Lecture du fichier chef...* 🍫',...channelInfo }, { quoted: message });
                const msgObj = { message: { documentMessage: quoted.documentMessage } };
                const buf = await downloadMediaMessage(msgObj, 'buffer', {});
                const tmpFile = path.join(tempDir, `url_in_${id}.txt`);
                fs.writeFileSync(tmpFile, buf);
                const result = await execAsync(`python3 "${scriptPath}" extract --file "${tmpFile}"`, { timeout: 30000 });
                stdout = result.stdout;
                try { fs.unlinkSync(tmpFile); } catch {}
            } else {
                const safeText = textInput.replace(/'/g, "'\"'\"'");
                const result = await execAsync(`python3 "${scriptPath}" ${mode} '${safeText}'`, { timeout: 30000 });
                stdout = result.stdout;
            }

            const data = JSON.parse(stdout.trim());
            if (data.error) {
                return await sock.sendMessage(chatId, { text: `❌ ${data.error}`,...channelInfo }, { quoted: message });
            }

            let resultText = '';
            if (mode === 'decode') {
                resultText = `🍫 *URL DECODER* 😈\n\n📥 *Original:*\n\`${data.original}\`\n\n📤 *Decoded:*\n\`${data.decoded}\``;
                if (data.scheme) resultText += `\n\n🔍 *Breakdown:*\n• Scheme: ${data.scheme}\n• Host: ${data.host}\n• Path: ${data.path}`;
                if (data.query_params) {
                    const params = Object.entries(data.query_params).map(([k,v])=>` • ${k}: ${v}`).join('\n');
                    resultText += `\n• Params:\n${params}`;
                }
                if (data.fragment) resultText += `\n• Fragment: ${data.fragment}`;
            } else if (mode === 'encode') {
                resultText = `🍫 *URL ENCODER* 😈\n\n📥 *Original:*\n\`${data.original}\`\n\n🔒 *Full:*\n\`${data.fully_encoded}\`\n\n🔓 *Safe:*\n\`${data.safe_encoded}\``;
            } else {
                if (data.total === 0) {
                    resultText = `🍫 *EXTRACTOR* 😈\n\n💀 Aucun lien trouvé chef!`;
                } else {
                    const lines = [`🍫 *EXTRACTOR - ${data.total} liens* 😈\n`];
                    if (data.social?.length) { lines.push(`📱 *Social (${data.social.length}):*`); data.social.forEach(u=>lines.push(`• ${u}`)); lines.push(''); }
                    if (data.media?.length) { lines.push(`🖼️ *Media (${data.media.length}):*`); data.media.forEach(u=>lines.push(`• ${u}`)); lines.push(''); }
                    if (data.documents?.length) { lines.push(`📄 *Docs (${data.documents.length}):*`); data.documents.forEach(u=>lines.push(`• ${u}`)); lines.push(''); }
                    if (data.other?.length) { lines.push(`🔗 *Autres (${data.other.length}):*`); data.other.forEach(u=>lines.push(`• ${u}`)); }
                    resultText = lines.join('\n');
                }
            }

            await sendResult(sock, chatId, message, resultText, `choco_urls_${id}.txt`);

        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `💀 *Erreur CHOCO:* ${error.message}`,
               ...channelInfo
            }, { quoted: message });
        }
    }
};