import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { uploadToLitterbox } from '../lib/uploaders.js';
import { channelInfo } from '../lib/messageConfig.js';

export default {
    command: 'litterbox',
    aliases: ['tempup', 'litter', 'litr', 'lbox'],
    category: 'upload',
    description: 'CHOCO - Upload temporaire Litterbox',
    usage: '.litterbox <1h/12h/24h/72h> (reply media)',

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) {
                return sock.sendMessage(chatId, {
                    text:`🍫 *CHOCO LITTERBOX* 😈\n\n💀 Reply à un media chef!\n📌 Usage:.litterbox 1h / 12h / 24h / 72h`,
            ...channelInfo
                }, { quoted: message });
            }

            const type = Object.keys(quotedMsg)[0];
            const supported = ['imageMessage','videoMessage','stickerMessage','documentMessage'];
            if (!supported.includes(type)) {
                return sock.sendMessage(chatId, { text:`💀 Type non supporté!`,...channelInfo }, { quoted: message });
            }

            const time = args[0] || '1h';
            const valid = ['1h','12h','24h','72h'];
            const uploadTime = valid.includes(time)? time : '1h';

            await sock.sendMessage(chatId, { text:`🍫 *Upload Litterbox (${uploadTime})...* ⏳`,...channelInfo }, { quoted: message });

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
            const tempPath=path.join(tempDir,`choco_litter_${Date.now()}.${ext}`);
            fs.writeFileSync(tempPath, buffer);

            const result=await uploadToLitterbox(tempPath, uploadTime);

            await sock.sendMessage(chatId, {
                text:`🍫 *LITTERBOX* 😈\n\n✅ *Upload réussi!*\n⏰ *Expire:* ${result.expires}\n🔗 *URL:* ${result.url}\n\n⚠️ _Lien expire après ${result.expires} chef!_\n\n> _By CHOCO-ITACHI-V2_`,
        ...channelInfo
            }, { quoted: message });

            try{ fs.unlinkSync(tempPath); }catch{}

        } catch (error) {
            console.error('[CHOCO LITTERBOX] Error:', error);
            await sock.sendMessage(chatId, { text:`💀 *Erreur:* ${error.message}`,...channelInfo }, { quoted: message });
        }
    }
};