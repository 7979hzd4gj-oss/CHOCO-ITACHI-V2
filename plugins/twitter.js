import axios from 'axios';
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_PHOTO = "https://files.catbox.moe/TON-LIEN-ICI.jpg";

export default {
    command: 'twitter',
    aliases: ['xtweet', 'tweetdl', 'twitterdl', 'x', 'xdl'],
    category: 'download',
    description: 'CHOCO - Download X/Twitter media',
    usage: '.twitter <Tweet URL>',

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const url = args?.[0];
        if (!url) {
            return sock.sendMessage(chatId, {
                image: { url: CHOCO_PHOTO },
                caption:`🍫 *CHOCO TWITTER DL* 😈\n\n💀 Envoie un lien X chef!\n📌 Ex:.twitter https://x.com/i/status/2002054360428167305`,
          ...channelInfo
            }, { quoted: message });
        }
        try {
            await sock.sendMessage(chatId, { text:`🍫 *Download X...* ⏳`,...channelInfo }, { quoted: message });

            const apiUrl = `https://discardapi.dpdns.org/api/dl/twitter?apikey=guru&url=${encodeURIComponent(url)}`;
            const { data } = await axios.get(apiUrl, { timeout: 15000 });

            if (!data?.status ||!data.result?.media?.length) {
                return sock.sendMessage(chatId, { text:`💀 Aucun media trouvé sur ce Tweet chef!`,...channelInfo }, { quoted: message });
            }

            const tweet = data.result;
            const caption = `🍫 *CHOCO X DL* 😈\n\n📝 @${tweet.authorUsername} (${tweet.authorName})\n📅 ${tweet.date}\n❤️ ${tweet.likes} | 🔁 ${tweet.retweets} | 💬 ${tweet.replies}\n\n💬 ${tweet.text}\n\n> _By CHOCO-ITACHI-V2_`.trim();

            for (const mediaItem of tweet.media) {
                if (mediaItem.type === 'video') {
                    await sock.sendMessage(chatId, { video: { url: mediaItem.url }, caption,...channelInfo }, { quoted: message });
                } else if (mediaItem.type === 'image') {
                    await sock.sendMessage(chatId, { image: { url: mediaItem.url }, caption,...channelInfo }, { quoted: message });
                }
            }

        } catch (error) {
            console.error('[CHOCO TWITTER] Error:', error);
            const msg = error.code === 'ECONNABORTED'? '💀 Timeout API, réessaye chef!' : '💀 Impossible de fetch ce Tweet!';
            await sock.sendMessage(chatId, { text: msg,...channelInfo }, { quoted: message });
        }
    }
};