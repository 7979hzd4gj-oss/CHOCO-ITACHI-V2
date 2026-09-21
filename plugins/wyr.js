import axios from 'axios';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'wyr',
    aliases: ['wouldyourather', 'chocowyr', 'choix'],
    category: 'fun',
    description: 'Would You Rather - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫wyr',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const prefix = "🍫";
        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });
            
            const res = await axios.get('https://discardapi.dpdns.org/api/quote/wyr?apikey=guru');
            
            if (!res.data || res.data.status !== true) {
                return await sock.sendMessage(chatId, { text: '❌ Pas de question trouvée 😈🍫' }, { quoted: message });
            }
            
            const opt1 = res.data.question?.option1 || 'Option 1';
            const opt2 = res.data.question?.option2 || 'Option 2';
            
            const replyText = `┏━━ 🍫 *CHOCO - TU PRÉFÈRES* 😈 ━━┓\n`+
                `┃\n`+
                `┃ 🤔 *Would You Rather?*\n`+
                `┃\n`+
                `┃ 🅰️ ${opt1}\n`+
                `┃\n`+
                `┃ 🅱️ ${opt2}\n`+
                `┃\n`+
                `┣━ Réponds A ou B 😈\n`+
                `┗━━━━ 🍫 By CHOCO ITACHI 224611257942 