import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { uploadToPomf2 } from '../lib/uploaders.js';
import { channelInfo } from '../lib/messageConfig.js';

export default {
    command: 'pomf',
    aliases: ['lain', 'pomf2', 'pomfup'],
    category: 'upload',
    description: 'CHOCO - Upload Pomf.lain.la (1GB permanent)',
    usage: '.pomf (reply media)',

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) {
                return sock.sendMessage(chatId, {
                    text:`🍫 *CHOCO POMF* 😈\n\n💀 Reply à un media chef!`,
              ...channelInfo
                }, { quoted: message });
            }

            const type = Object.keys(quotedMsg)[0];
            const supported = ['imageMessage','videoMessage','stickerMessage','documentMessage'];
            if (!supported.includes(type)) {
                return sock.sendMessage(chatId, { text:`💀 Type non supporté!`,...channelInfo }, { quoted: message });
            }

            await sock.sendMessage(chatId, { text:`🍫 *Upload Pomf...* ⏳`,...channelInfo }, { quoted: message });

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
            const tempPath=path.join(tempDir,`choco_pomf_${Date.now()}.${ext}`);
            fs.writeFileSync(tempPath, buffer);

            const result=await uploadToPomf2(tempPath);

            await sock.sendMessage(chatId, {
                text:`🍫 *POMF UPLOAD* 😈\n\n✅ *1GB Permanent chef!*\n🔗 ${result.url}\n\n> _By CHOCO-ITACHI-V2_`,
          ...channelInfo
            }, { quoted: message });

            try{ fs.unlinkSync(tempPath); }catch{}

        } catch (error) {
            console.error('[CHOCO POMF] Error:', error);
            await sock.sendMessage(chatId, { text:`💀 *Erreur:* ${error.message}`,...channelInfo }, { quoted: message });
        }
    }
};