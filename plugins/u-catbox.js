import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { uploadToCatbox } from '../lib/uploaders.js';
import { channelInfo } from '../lib/messageConfig.js';

export default {
    command: 'catbox',
    aliases: ['cb', 'cat', 'catboxup'],
    category: 'upload',
    description: 'CHOCO - Upload Catbox.moe (200MB permanent)',
    usage: '.catbox (reply media)',

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) {
                return sock.sendMessage(chatId, {
                    text:`🍫 *CHOCO CATBOX* 😈\n\n💀 Reply à un media chef!`,
            ...channelInfo
                }, { quoted: message });
            }

            const type = Object.keys(quotedMsg)[0];
            const supported = ['imageMessage','videoMessage','stickerMessage','documentMessage'];
            if (!supported.includes(type)) {
                return sock.sendMessage(chatId, { text:`💀 Type non supporté!`,...channelInfo }, { quoted: message });
            }

            await sock.sendMessage(chatId, { text:`🍫 *Upload Catbox (200MB)...* ⏳`,...channelInfo }, { quoted: message });

            const mediaType = type === 'stickerMessage'? 'sticker' : type.replace('Message','');
            const stream = await downloadContentFromMessage(quotedMsg[type], mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            let ext='bin';
            if (type==='imageMessage') ext='jpg';
            else if (type==='videoMessage') ext='mp4';
            else if (type==='stickerMessage') ext='webp';
            else if (quotedMsg[type].fileName) ext = quotedMsg[type].fileName.split('.').pop() || 'bin';

            const tempDir='./temp';
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir,{recursive:true});
            const tempPath=path.join(tempDir,`choco_catbox_${Date.now()}.${ext}`);
            fs.writeFileSync(tempPath, buffer);

            const result=await uploadToCatbox(tempPath);

            await sock.sendMessage(chatId, {
                text:`🍫 *CATBOX.MOE* 😈\n\n✅ *200MB Permanent chef!*\n🔗 ${result.url}\n\n> _By CHOCO-ITACHI-V2_`,
        ...channelInfo
            }, { quoted: message });

            try{ fs.unlinkSync(tempPath); }catch{}

        } catch (error) {
            console.error('[CHOCO CATBOX] Error:', error);
            await sock.sendMessage(chatId, { text:`💀 *Erreur:* ${error.message}`,...channelInfo }, { quoted: message });
        }
    }
};