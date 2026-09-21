import axios from 'axios';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

async function fetchWithRetries(url, retries = 3, delay = 2000) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            const { data } = await axios.get(url);
            return data;
        }
        catch (err) {
            attempt++;
            console.error(`[CHOCO-WHY] Attempt ${attempt} failed:`, err.message);
            if (attempt >= retries)
                throw new Error('Max retries reached');
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

export default {
    command: 'why',
    aliases: ['whyme', 'question', 'chocowhy'],
    category: 'fun',
    description: 'Random Why question - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫why',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });
            
            const data = await fetchWithRetries('https://nekos.life/api/v2/why');
            
            if (!data?.why?.trim()) {
                return await sock.sendMessage(chatId, { text: '❌ Pas de réponse API 😈🍫 Réessaie.' }, { quoted: message });
            }
            
            const caption = `┏━━ 🍫 *CHOCO - WHY?* 😈 ━━┓\n`+
                `┃\n`+
                `┃ 🤔 *${data.why}*\n`+
                `┃\n`+
                `┗━━━━ 😈 By CHOCO 224611257942 🍫`;

            await sock.sendMessage(chatId, { 
                image: { url: CHOCO_IMG },
                caption: caption 
            }, { quoted: message });
            
        }
        catch (error) {
            console.error('Why plugin error:', error);
            await sock.sendMessage(chatId, { text: '❌ Erreur WHY, réessaie plus tard 🍫😈' }, { quoted: message });
        }
    }
};