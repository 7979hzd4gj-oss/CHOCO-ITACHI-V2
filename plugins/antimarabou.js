import store from '../lib/lightweight_store.js';

export default {
    command: 'antimarabou',
    aliases: ['antimara', 'antiscam', 'antifake'],
    category: 'admin',
    description: 'CHOCO-ITACHI-V2 Anti Marabou 😈🍫',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, m, args, context) {
        const chatId = context.chatId;
        const act = args[0]?.toLowerCase();

        if (!act) {
            return sock.sendMessage(chatId, {
                text: `┏━ 😈 *CHOCO ANTI-MARABOU* 🍫 ━┓\n\n┃.antimarabou on - Activer 🔥\n┃.antimarabou off - Désactiver\n\n*Détecte:* portefeuille magique, marabout, +229, retour d'affection, multiplication d'argent\n\n┗━ *By CHOCO ITACHI 224611257942* ━┛`
            }, { quoted: m });
        }

        if (act === 'on') {
            await store.saveSetting(chatId, 'antimarabou', { enabled: true });
            return sock.sendMessage(chatId, {
                text: `✅ 🍫 *CHOCO-ITACHI-V2* 😈\n*ANTI-MARABOU ACTIVÉ!*\n\nJe vais supprimer et kicker tous les marabouts 🔥\n> Protégé par CHOCO ITACHI`
            }, { quoted: m });
        }

        if (act === 'off') {
            await store.saveSetting(chatId, 'antimarabou', { enabled: false });
            return sock.sendMessage(chatId, {
                text: `❌ 🍫 *CHOCO-ITACHI-V2*\nAnti-marabou désactivé`
            }, { quoted: m });
        }
    }
};

// Détection automatique des marabouts
export async function handleMarabou(sock, m, chatId) {
    const setting = await store.getSetting(chatId, 'antimarabou');
    if (!setting?.enabled) return false;

    const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase();
    const marabouWords = ['portefeuille magique', 'marabout', 'retour d affection', 'multiplication', 'bédou magique', '+229', 'voyant', 'riche en 24h'];

    if (marabouWords.some(w => text.includes(w))) {
        try {
            await sock.sendMessage(chatId, { delete: m.key });
            await sock.sendMessage(chatId, {
                text: `😈🍫 *CHOCO-ITACHI-V2 ANTI-MARABOU*\n\n@${m.pushName} Message de maraboutage supprimé 🔥\n\n> Arnaque interdite ici!`
            });
            return true;
        } catch (e) {}
    }
    return false;
}