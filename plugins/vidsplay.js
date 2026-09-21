import axios from 'axios';
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'vidsplay',
    aliases: ['vidsplaydl', 'vidsplayvideo', 'chocovidsplay'],
    category: 'download',
    description: 'DL Vidsplay - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫vidsplay <url Vidsplay>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const url = args?.[0];

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO VIDSPLAY* 😈\n\nDonne un lien!\nExemple: 🍫vidsplay https://www.vidsplay.com/golf-free-stock-video/`,
              ...channelInfo
            }, { quoted: message });
        }

        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });

            const apiUrl = `https://discardapi.dpdns.org/api/dl/vidsplay?apikey=guru&url=${encodeURIComponent(url)}`;
            const { data } = await axios.get(apiUrl, { timeout: 15000 });

            if (!data?.status ||!data.result?.length) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Aucune vidéo trouvée pour ce lien 😈🍫`,
                  ...channelInfo
                }, { quoted: message });
            }

            const videoUrl = data.result[0].video