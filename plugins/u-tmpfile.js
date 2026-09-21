import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { uploadToTmpfiles } from '../lib/uploaders.js';
import { channelInfo } from '../lib/messageConfig.js';

export default {
    command: 'tmpfiles',
    aliases: ['tmpf', 'tfiles', 'tmp'],
    category: 'upload',
    description: 'CHOCO - Upload Tmpfiles.org',
    usage: '.tmpfiles (reply ou caption media)',

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
                    text: `🍫 *CHOCO TMPFILES* 😈\n\n💀 Reply à un media chef!`,
                ...channelInfo
                }, { quoted: message });
            }

            const mediaSource = hasMedia? message.message : quotedMsg;
            const type = Object.keys(mediaSource).find(k =>
                ['imageMessage','videoMessage','stickerMessage','documentMessage'].includes(k)
            );
            if (!type) return sock.sendMessage(chatId, { text:`💀 Type non supporté!`,...channelInfo }, { quoted: message });

            await sock.sendMessage(chatId, { text:`🍫 *Upload vers Tmpfiles...* ⏳`,...channelInfo }, { quoted: message });

            const mediaType = type === 'stickerMessage'? 'sticker' : type.replace('Message','');
            const stream = await downloadContentFromMessage(mediaSource[type], mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            let ext = 'bin';
            if (type === 'imageMessage') ext='jpg';
            else if (type === 'videoMessage') ext='mp4';
            else if (type === 'stickerMessage') ext='webp';
            else if (mediaSource[type].fileName) ext = mediaSource[type].fileName.split('.').pop() || 'bin';

            const tempDir = './temp';
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive:true });
            const tempPath = path.join(tempDir, `choco_tmp_${Date.now()}.${ext}`);
            fs.writeFileSync(tempPath, buffer);

            const result = await uploadToTmpfiles(tempPath);

            await sock.sendMessage(chatId, {
                text:`🍫 *TMPFILES* 😈\n\n✅ *Upload réussi!*\n🔗 Direct: ${result.url}\n📄 Page: ${result.page_url}\n\n>