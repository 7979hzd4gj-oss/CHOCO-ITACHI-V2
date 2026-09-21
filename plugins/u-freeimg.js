import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { uploadToFreeimage } from '../lib/uploaders.js';
import { channelInfo } from '../lib/messageConfig.js';

export default {
    command: 'freeimage',
    aliases: ['fimg', 'freeimg', 'free'],
    category: 'upload',
    description: 'CHOCO - Upload Freeimage.host',
    usage: '.freeimage (reply image)',

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return sock.sendMessage(chatId, {
                    text:`🍫 *CHOCO FREEIMAGE* 😈\n\n💀 Reply à une image chef!`,
             ...channelInfo
                }, { quoted: message });
            }

            await sock.sendMessage(chatId, { text:`🍫 *Upload Freeimage...* ⏳`,...channelInfo }, { quoted: message });

            const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            const tempDir='./temp';
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir,{recursive:true});
            const tempPath=path.join(tempDir,`choco_free_${Date.now()}.jpg`);
            fs.writeFileSync(tempPath, buffer);

            const result=await uploadToFreeimage(tempPath);

            await sock.sendMessage(chatId, {
                text:`🍫 *FREEIMAGE HOST* 😈\n\n✅ *Upload réussi chef!*\n🔗 *URL:* ${result.url}\n🖼️ *Display:* ${result.display_url}\n🗑️ *Delete:* ${result.delete_url}\n\n> _By CHOCO-ITACHI-V2_`,
         ...channelInfo
            }, { quoted: message });

            try{ fs.unlinkSync(tempPath); }catch{}

        } catch (error) {
            console.error('[CHOCO FREEIMAGE] Error:', error);
            await sock.sendMessage(chatId, { text:`💀 *Erreur:* ${error.message}`,...channelInfo }, { quoted: message });
        }
    }
};