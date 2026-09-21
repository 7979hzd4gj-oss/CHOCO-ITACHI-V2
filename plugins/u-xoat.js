import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { uploadToX0 } from '../lib/uploaders.js';
import { channelInfo } from '../lib/messageConfig.js';

export default {
    command: 'xoat',
    aliases: ['xo', 'x0at', 'x0', 'upload'],
    category: 'upload',
    description: 'CHOCO - Upload vers X0.at',
    usage: '.xoat (reply ou caption sur media)',

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;

        try {
            const hasMedia = message.message?.imageMessage ||
                message.message?.videoMessage ||
                message.message?.stickerMessage ||
                message.message?.documentMessage;

            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!hasMedia &&!quotedMsg) {
                return sock.sendMessage(chatId, {
                    text: `🍫 *CHOCO X0AT* 😈\n\n💀 Envoie un media avec caption ou reply à un media chef!`,
                  ...channelInfo
                }, { quoted: message });
            }

            const mediaSource = hasMedia? message.message : quotedMsg;
            const type = Object.keys(mediaSource).find(key =>
                ['imageMessage','videoMessage','stickerMessage','documentMessage'].includes(key)
            );

            if (!type) {
                return sock.sendMessage(chatId, {
                    text: `💀 Type non supporté chef!`,
                  ...channelInfo
                }, { quoted: message });
            }

            await sock.sendMessage(chatId, {
                text: `🍫 *Upload vers X0.at...* ⏳`,
              ...channelInfo
            }, { quoted: message });

            const mediaType = type === 'stickerMessage'? 'sticker' : type.replace('Message', '');
            const stream = await downloadContentFromMessage(mediaSource[type], mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            let ext = 'bin';
            if (type === 'imageMessage') ext = 'jpg';
            else if (type === 'videoMessage') ext = 'mp4';
            else if (type === 'stickerMessage') ext = 'webp';
            else if (mediaSource[type].fileName) ext = mediaSource[type].fileName.split('.').pop() || 'bin';

            const tempDir = path.join('./temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const tempPath = path.join(tempDir, `choco_x0_${Date.now()}.${ext}`);
            fs.writeFileSync(tempPath, buffer);

            const result = await uploadToX0(tempPath);

            await sock.sendMessage(chatId, {
                text: `🍫 *X0.AT UPLOAD* 😈\n\n✅ *Succès chef!*\n🔗 ${result.url}\n\n> _By CHOCO-ITACHI-V2_`,
              ...channelInfo
            }, { quoted: message });

            try { fs.unlinkSync(tempPath); } catch {}

        } catch (error) {
            console.error('[CHOCO X0] Error:', error);
            await sock.sendMessage(chatId, {
                text: `💀 *Erreur:* ${error.message}`,
              ...channelInfo
            }, { quoted: message });
        }
    }
};