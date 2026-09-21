import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { uploadFile } from '../lib/uploaders.js';
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_PHOTO = "https://files.catbox.moe/TON-LIEN-ICI.jpg"; // <--- MET TON LIEN CATBOX ICI

export default {
    command: 'aupload',
    aliases: ['upall', 'aup', 'toall', 'allup'],
    category: 'upload',
    description: 'CHOCO - Upload All (cloud permanent)',
    usage: '.aupload (reply media)',

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) {
                return sock.sendMessage(chatId, {
                    image: { url: CHOCO_PHOTO },
                    caption: `🍫 *CHOCO AUPLOAD* 😈\n\n💀 Reply à un media chef!\n📎 Image / Vidéo / Gif / Sticker`,
                 ...channelInfo
                }, { quoted: message });
            }

            const type = Object.keys(quotedMsg)[0];
            const supported = ['imageMessage','videoMessage','stickerMessage','documentMessage'];
            if (!supported.includes(type)) {
                return sock.sendMessage(chatId, { text:`💀 Type non supporté chef!`,...channelInfo }, { quoted: message });
            }

            await sock.sendMessage(chatId, { text:`🍫 *Upload Cloud...* ⏳`,...channelInfo }, { quoted: message });

            const mediaType = type === 'stickerMessage'? 'sticker' : type.replace('Message','');
            const stream = await downloadContentFromMessage(quotedMsg[type], mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            let ext='bin';
            if (type==='imageMessage') ext='jpg';
            else if (type==='videoMessage') ext='mp4';
            else if (type==='stickerMessage') ext='webp';
            else if (type==='documentMessage') {
                const fileName = quotedMsg[type].fileName || 'file';
                ext = fileName.split('.').pop() || 'bin';
            }

            const tempDir='./temp';
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir,{recursive:true});
            const tempPath=path.join(tempDir,`choco_all_${Date.now()}.${ext}`);
            fs.writeFileSync(tempPath, buffer);
            const stats = fs.statSync(tempPath);
            const fileSizeMB = (stats.size / (1024*1024)).toFixed(2);

            const result=await uploadFile(tempPath);

            await sock.sendMessage(chatId, {
                image: { url: CHOCO_PHOTO },
                caption:`🍫 *AUPLOAD SUCCESS* 😈\n\n📊 *Service:* ${result.service}\n📦 *Size:* ${fileSizeMB} MB\n🔗 *URL:* ${result.url}\n\n> _By CHOCO-ITACHI-V2_`,
          ...channelInfo
            }, { quoted: message });

            try{ fs.unlinkSync(tempPath); }catch{}

        } catch (error) {
            console.error('[CHOCO AUPLOAD] Error:', error);
            await sock.sendMessage(chatId, { text:`💀 *Erreur:* ${error.message}`,...channelInfo }, { quoted: message });
        }
    }
};