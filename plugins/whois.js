import axios from 'axios';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'whois',
    aliases: ['domaininfo', 'chocowhois', 'who'],
    category: 'info',
    description: 'WHOIS domaine - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫whois <domaine>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const prefix = "🍫";
        let domain = args?.[0]?.trim();

        if (!domain) {
            return await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO WHOIS* 😈\n\nDonne un domaine\nExemple: ${prefix}whois google.com\n${prefix}whois youtube.com`
            }, { quoted: message });
        }

        domain = domain.replace(/^https?:\/\//i, '');

        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });