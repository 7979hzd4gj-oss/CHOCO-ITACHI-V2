import config from '../config.js';
import yts from 'yt-search';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'ytsearch',
    aliases: ['yts', 'chocoyt', 'yt'],
    category: 'music',
    description: 'Search YouTube - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫yts [query]',
    async handler(sock, message, args, context) {
        const { chatId } = context;
        const query = args.join(' ');
        const prefix = "🍫";

        if (!query) {
            return sock.sendMessage(chatId, {
                text: `🍫 *CHOCO YT SEARCH* 😈\n\nExemple: *${prefix}yts* Lil Peep\n*${prefix}play* Burna Boy`
            }, { quoted: message });
        }
        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });
            const result = await yts(query);
            const videos = result.videos.slice(0, 10);
            if (videos.length === 0) {
                return sock.sendMessage(chatId, { text: '❌ Aucun résultat 😈' }, { quoted: message });
            }

            let searchText = `┏━━ 🍫 *CHOCO YT SEARCH* 😈 ━━┓\n`;
            searchText += `┃ Recherche: *${query}*\n`;
            searchText += `┗━━━━━━━━━━━━━━┛\n\n`;

            videos.forEach((v, index) => {
                searchText += `*${index + 1}.🎧 ${v.title}*\n`;
                searchText += `*⌚ Durée:* ${v.timestamp}\n`;
                searchText += `*👀 Vues:* ${v.views}\n`;
                searchText += `*🔗 Lien:* ${v.url}\n`;
                searchText += `*▶️ Pour jouer:* ${prefix}play ${v.url}\n`;
                searchText += `──────────────────\n`;
            });

            searchText += `\n> 😈 *CHOCO-ITACHI-V2* | 224611257942 🍫`;

            await sock.sendMessage(chatId, {
                image: { url: videos[0].image },
                caption: searchText
            }, { quoted: message });
        }
        catch (error) {
            console.error('YouTube Search Error:', error);
            await sock.sendMessage(chatId, { text: '❌ Erreur recherche YouTube 🍫' }, { quoted: message });
        }
    }
};