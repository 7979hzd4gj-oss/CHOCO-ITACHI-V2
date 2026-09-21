import axios from 'axios';
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_PHOTO = "https://files.catbox.moe/TON-LIEN-ICI.jpg";

export default {
    command: 'ttstalk',
    aliases: ['tikstalk', 'ttprofile', 'tiktokstalk'],
    category: 'stalk',
    description: 'CHOCO - TikTok Profile Lookup',
    usage: '.ttstalk <username>',

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        if (!args.length) {
            return sock.sendMessage(chatId, {
                image: { url: CHOCO_PHOTO },
                caption:`🍫 *CHOCO TTSTALK* 😈\n\n💀 Donne un username chef!\n📌 Ex:.ttstalk truepakistanofficial`,
          ...channelInfo
            }, { quoted: message });
        }

        const username = args[0].replace('@','');
        try {
            await sock.sendMessage(chatId, { text:`🍫 *Stalk TikTok @${username}...* ⏳`,...channelInfo }, { quoted: message });

            const { data } = await axios.get('https://discardapi.dpdns.org/api/stalk/tiktok', {
                params: { apikey: 'guru', username },
                timeout: 15000
            });

            if (!data?.result?.user) {
                return sock.sendMessage(chatId, { text:`💀 User TikTok @${username} introuvable chef!`,...channelInfo }, { quoted: message });
            }

            const user = data.result.user;
            const stats = data.result.statsV2 || data.result.stats;
            const profileImage = user.avatarLarger || user.avatarMedium || user.avatarThumb;
            const verifiedMark = user.verified? '✅ Verified' : '❌ Not Verified';

            const caption = `🍫 *CHOCO TIKTOK STALK* 😈\n\n👤 *Nickname:* ${user.nickname || 'N/A'} ${verifiedMark}\n🆔 *Username:* @${user.uniqueId}\n📝 *Bio:* ${user.signature || 'N/A'}\n🔒 *Privé:* ${user.privateAccount? 'Oui' : 'Non'}\n\n👥 *Followers:* ${stats?.followerCount || 0}\n➡ *Following:* ${stats?.followingCount || 0}\n❤️ *Likes:* ${stats?.heartCount || 0}\n🎥 *Vidéos:* ${stats?.videoCount || 0}\n\n🔗 https://www.tiktok.com/@${user.uniqueId}\n\n> _By CHOCO-ITACHI-V2_`;

            if (profileImage) {
                await sock.sendMessage(chatId, { image: { url: profileImage }, caption,...channelInfo }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, { text: caption,...channelInfo }, { quoted: message });
            }

        } catch (err) {
            console.error('[CHOCO TTSTALK] Error:', err);
            await sock.sendMessage(chatId, { text:`💀 Erreur fetch TikTok @${username}`,...channelInfo }, { quoted: message });
        }
    }
};