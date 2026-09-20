import axios from 'axios';

const AI_APIS = [
    (q) => `https://mistral.stacktoy.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
    (q) => `https://llama.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`
];

const CHOCO_PROMPT = `Tu es CHOCO-ITACHI-V2 😈🍫, bot de CHOCO ITACHI 224611257942. Style Itachi froid + chocolat sucré. Réponds court, puissant, avec 😈🍫. Question: `;

const askAI = async (query) => {
    for (const apiUrl of AI_APIS) {
        try {
            const { data } = await axios.get(apiUrl(CHOCO_PROMPT + query), { timeout: 15000 });
            if (data?.data?.response) return data.data.response.trim();
        } catch { continue; }
    }
    throw new Error('fail');
};

export default {
    command: 'llama',
    aliases: ['chocollama', 'itachi-ai'],
    category: 'ai',
    description: 'CHOCO-ITACHI-V2 Llama 😈🍫',
    
    async handler(sock, message, args, context) {
        const { chatId, config } = context;
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(chatId, { 
                text: `🍫 *CHOCO LLAMA* 😈\nUtilisation: ${config.prefix}llama <question>\nBy CHOCO ITACHI` 
            }, { quoted: message });
        }
        try {
            await sock.sendMessage(chatId, { react: { text: '😈', key: message.key } });
            const answer = await askAI(query);
            await sock.sendMessage(chatId, { 
                text: `😈 *CHOCO-ITACHI-V2* 🍫\n\n${answer}\n\n> 224611257942` 
            }, { quoted: message });
        } catch {
            await sock.sendMessage(chatId, { text: `❌ Erreur CHOCO AI 🍫` }, { quoted: message });
        }
    }
};