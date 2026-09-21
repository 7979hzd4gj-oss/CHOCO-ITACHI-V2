/*****************************************************************************
 *                     CHOCO-ITACHI-V2 😈🍫                                 *
 *  Dev: 224611257942                                                        *
 *****************************************************************************/
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { channelInfo } from '../lib/messageConfig.js';
const execAsync = promisify(exec);

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'vnote',
    aliases: ['voicenote', 'vn', 'chocovnote', 'chocovn'],
    category: 'tools',
    description: 'Convert audio en voice note - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫vnote (réponds à un audio)',
    async handler(sock, message, _args, _context) {
        const chatId = message.key.remoteJid;
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted?.audioMessage) {
            return sock.sendMessage(chatId, {
                text: `🍫 *CHOCO VNOTE* 😈\n\nRéponds à un *fichier audio* pour le convertir en note vocale!\nExemple: réponds à un audio avec 🍫vnote`,
               ...channelInfo
            }, { quoted: message });
        }

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const tmpIn = path.join(tmpDir, `choco_vnote_in_${Date.now()}`);
        const tmpOut = path.join(tmpDir, `choco_vnote_out_${Date.now()}.ogg`);

        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });

            const stream = await downloadContentFromMessage(quoted.audioMessage, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            console.log('[CHOCO-VNOTE] original size:', buffer.length);
            fs.writeFileSync(tmpIn, buffer);

            await execAsync(`ffmpeg -y -i "${tmpIn}" -c:a libopus -b:a 64k -ar 48000 -ac 1 "${tmpOut}"`);

            const opusBuffer = fs.readFileSync(tmpOut);
            console.log('[CHOCO-VNOTE] converted size:', opusBuffer.length);

            await sock.sendMessage(chatId, {
                audio: opusBuffer,
                ptt: true,
                mimetype: 'audio/ogg; codecs=opus',
               ...channelInfo
            }, { quoted: message });

        } catch (error) {
            console.error('[CHOCO-VNOTE] Error:', error.message);
            await sock.sendMessage(chatId, {
                text: `❌ Échec conversion vnote 😈🍫\n${error.message}`,
               ...channelInfo
            }, { quoted: message });
        } finally {
            try { fs.unlinkSync(tmpIn); } catch {}
            try { fs.unlinkSync(tmpOut); } catch {}
        }
    }
};