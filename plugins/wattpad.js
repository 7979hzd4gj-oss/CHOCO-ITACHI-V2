import pkg from 'api-qasim';
const QasimAny = pkg;
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'wattpad',
    aliases: ['wattpadsearch', 'searchwattpad', 'chocowattpad'],
    category: 'search',
    description: 'Cherche histoires Wattpad - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫wattpad <nom histoire>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ').trim();
        const prefix = "🍫";

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO WATTPAD* 😈\n\nDonne un titre/auteur/tag!\nExemple: ${prefix}wattpad The Hunger Games\n${prefix}wattpad Itachi`,
               ...channelInfo
            }, { quoted: message });
        }

        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });

            const results = await QasimAny.wattpad(query);

            if (!Array.isArray(results) || results.length === 0) {
                throw new Error('No results found');
            }

            const firstThumb = results[0]?.thumb || CHOCO_IMG;

            const formattedResults = results.slice(0, 9).map((story, index) => {
                const title = story.judul || 'Sans titre';
                const reads = story.dibaca || 'N/A';
                const votes = story.divote || 'N/A';
                const link = story.link || 'Pas de lien';
                return `*${index + 1}. ${title}*\n👁️ Lectures: ${reads}\n⭐ Votes: ${votes}\n🔗 ${link}`;
            }).join('\n\n');

            const caption = `┏━━ 🍫 *CHOCO WATTPAD* 😈 ━━┓\n`+
                `┃ 🔍 *"${query}"*\n`+
                `┗━━━━━━━━━━━━━━┛\n\n`+
                `${formattedResults}\n\n`+
                `> 😈 *CHOCO-ITACHI-V2* | 224611257942 🍫`;

            await sock.sendMessage(chatId, {
                image: { url: firstThumb },
                caption: caption,
               ...channelInfo
            }, { quoted: message });

        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ Erreur Wattpad pour "${query}" 😈🍫\n${error.message || error}`,
               ...channelInfo
            }, { quoted: message });
        }
    }
};