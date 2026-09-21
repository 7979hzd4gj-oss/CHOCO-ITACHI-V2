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

            if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
                return await sock.sendMessage(chatId, { text: '❌ Domaine invalide 😈🍫' }, { quoted: message });
            }

            const apiUrl = `https://discardapi.dpdns.org/api/tools/whois?apikey=guru&domain=${encodeURIComponent(domain)}`;
            const { data } = await axios.get(apiUrl, { timeout: 10000 });

            if (!data?.status ||!data.result?.domain) {
                return await sock.sendMessage(chatId, { text: '❌ WHOIS introuvable 😈🍫' }, { quoted: message });
            }

            const { domain: dom, registrar, registrant, technical } = data.result;

            const text = `┏━━ 🍫 *CHOCO WHOIS* 😈 ━━┓\n`+
                `┃ 🌐 *${dom.domain}*\n`+
                `┗━━━━━━━━━━━━━━┛\n\n`+
                `*📌 DOMAIN*\n`+
                `• Nom: ${dom.name}\n`+
                `• Ext:.${dom.extension}\n`+
                `• Serveur: ${dom.whois_server}\n`+
                `• Status: ${dom.status.join(', ')}\n`+
                `• NS: ${dom.name_servers.join(', ')}\n`+
                `• Créé: ${dom.created_date_in_time}\n`+
                `• Maj: ${dom.updated_date_in_time}\n`+
                `• Expire: ${dom.expiration_date_in_time}\n\n`+
                `*🏢 REGISTRAR*\n`+
                `• ${registrar.name}\n`+
                `• 📞 ${registrar.phone}\n`+
                `• 📧 ${registrar.email}\n`+
                `• 🔗 ${registrar.referral_url}\n\n`+
                `*👤 REGISTRANT*\n`+
                `• Org: ${registrant.organization || 'N/A'}\n`+
                `• Pays: ${registrant.country || 'N/A'}\n`+
                `• Email: ${registrant.email || 'N/A'}\n\n`+
                `*⚙ TECH:* ${technical.email || 'N/A'}\n\n`+
                `> 😈 *CHOCO-ITACHI-V2* | 224611257942 🍫`;

            await sock.sendMessage(chatId, {
                image: { url: CHOCO_IMG },
                caption: text
            }, { quoted: message });

        }
        catch (error) {
            console.error('WHOIS plugin error:', error);
            if (error.code === 'ECONNABORTED') {
                await sock.sendMessage(chatId, { text: '❌ API lente/timeout 🍫😈 Réessaie.' }, { quoted: message });
            }
            else {
                await sock.sendMessage(chatId, { text: '❌ Erreur WHOIS 🍫😈' }, { quoted: message });
            }
        }
    }
};