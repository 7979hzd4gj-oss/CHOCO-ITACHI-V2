import axios from 'axios';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'xstalk',
    aliases: ['twstalk', 'xprofile', 'chocox'],
    category: 'stalk',
    description: 'Lookup Twitter/X profile - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫xstalk <username>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const prefix = "🍫";
        
        if (!args.length) {
            return await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO X STALK* 😈\n\nDonne un username Twitter\nExemple: ${prefix}xstalk ElonMusk`
            }, { quoted: message });
        }
        const username = args[0].replace('@','');
        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });
            
            const { data } = await axios.get(`https://discardapi.dpdns.org/api/stalk/twitter`, {
                params: { apikey: 'guru', username }
            });
            
            if (!data?.result) {
                return await sock.sendMessage(chatId, { text: '❌ Utilisateur X non trouvé 😈🍫' }, { quoted: message });
            }
            
            const result = data.result;
            const profileImage = result.profile?.image || CHOCO_IMG;
            const bannerImage = result.profile?.banner || null;
            const verifiedMark = result.verified ? '✅ Vérifié' : '❌ Non vérifié';
            
            const caption = `┏━━ 🍫 *CHOCO X STALK* 😈 ━━┓\n`+
                `┃\n`+
                `┃ 👤 *Nom:* ${result.name || 'N/A'} ${verifiedMark}\n`+
                `┃ 🆔 *Username:* @${result.username || 'N/A'}\n`+
                `┃ 📝 *Bio:* ${result