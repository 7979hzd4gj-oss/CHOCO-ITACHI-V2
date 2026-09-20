import axios from 'axios';

const AI_APIS = [
    (q) => `https://mistral.stacktoy.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
    (q) => `https://llama.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
    (q) => `https://mistral.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`
];

const CHOCO_PROMPT = `Tu es CHOCO-ITACHI-V2 😈🍫, créé par CHOCO ITACHI (224611257942). Tu es un bot WhatsApp puissant, drôle, un peu arrogant, style Itachi Uchiha + chocolat. Réponds toujours avec ce style, ajoute des emojis 😈🍫🔥. Si on te demande qui t'a créé, dis CHOCO ITACHI. Question de l'utilisateur: `;

const askAI = async (query) => {
    for (const apiUrl of AI_APIS) {
        try {
            const { data } = await axios.get(apiUrl(CHOCO_PROMPT + query), { timeout: 15000 });
            const response = data?.data?.response;
            if (response && typeof response === 'string' && response.trim()) {
                return response.trim();
            }
        } catch { continue; }
    }
    throw new Error('All AI APIs failed');
};

export default {
    command: 'gpt',
    aliases: ['ai', 'choco', 'itachi', 'ask', 'mistral'],
    category: 'ai',
    description: 'CHOCO-ITACHI-V2 AI 😈🍫',
    
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ').trim();
        
        if (!query) {
            return sock.sendMessage(chatId, { 
                text: `┏━ 🍫 *CHOCO-ITACHI-V2 AI* 😈 ━┓\n\n┃ Salut! Je suis CHOCO-ITACHI-V2 😈🍫\n┃ Créé par CHOCO ITACHI 224611257942\n┃\n┃ Utilisation:.gpt <question>\n┃ Ex:.gpt c'est quoi Itachi?\n┗━━━━━━━━━━━━━━━━━━━━┛` 
            }, { quoted: message });
        }
        
        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });
            const answer = await askAI(query);
            await sock.sendMessage(chatId, { 
                text: `🍫 *CHOCO-ITACHI-V2* 😈\n\n${answer}\n\n> _By CHOCO ITACHI 224611257942_ 🔥` 
            }, { quoted: message });
        } catch (error) {
            await sock.sendMessage(chatId, { 
                text: `❌ 😈 *CHOCO-ITACHI-V2* a bugué!\nRéessaie plus tard chef 🍫` 
            }, { quoted: message });
        }
    }
};