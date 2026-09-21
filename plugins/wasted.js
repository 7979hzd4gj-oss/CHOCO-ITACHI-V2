import axios from 'axios';
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'wasted',
    aliases: ['waste', 'chocowasted', 'rip'],
    category: 'fun',
    description: 'Waste quelqu’un - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫wasted @user',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        let userToWaste;

        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToWaste = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWaste = message.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToWaste) {
            return await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO WASTED* 😈\n\nMentionne quelqu’un ou réponds à son message!\nExemple: 🍫wasted @user`,
               ...channelInfo
            }, { quoted: message });
        }

        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });

            let profilePic;
            try {
                profilePic = await sock.profilePictureUrl(userToWaste, 'image');
            } catch {
                profilePic = CHOCO_IMG;
            }

            const wastedResponse = await axios.get(`https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(profilePic)}`, { responseType: 'arraybuffer' });

            const name = sock.store?.contacts?.[userToWaste]?.name || sock.store?.contacts?.[userToWaste]?.notify || (userToWaste.includes('@s.whatsapp.net')? `+${userToWaste.replace('@s.whatsapp.net', '')}` : 'User');

            const caption = `┏━━ 🍫 *CHOCO WASTED* 😈 ━━┓\n`+
                `┃ ⚰️ *WASTED*: @${name.split(' ')[0]}\n`+
                `┗━━━━━━━━━━━━━━┛\n\n`+
                `💀 *Rest in pieces!* 😈🍫\n`+
                `> By CHOCO-ITACHI-V2 | 224611257942`;

            await sock.sendMessage(chatId, {
                image: Buffer.from(wastedResponse.data),
                caption: caption,
                mentions: [userToWaste],
               ...channelInfo
            }, { quoted: message });

        } catch (error) {
            console.error('Error in wasted command:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Échec wasted 😈🍫 Réessaie!',
               ...channelInfo
            }, { quoted: message });
        }
    }
};