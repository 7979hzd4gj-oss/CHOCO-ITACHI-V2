import store from '../lib/lightweight_store.js';

export default {
    command: 'responder',
    aliases: ['autoresponder', 'autoreply', 'autoresponse'],
    category: 'admin',
    description: 'CHOCO-ITACHI-V2 Auto Responder 😈🍫',
    groupOnly: false,

    async handler(sock, m, args, context) {
        const chatId = context.chatId;
        const sub = args[0]?.toLowerCase();

        if (!sub) {
            return sock.sendMessage(chatId, {
                text: `┏━ 🍫 *CHOCO RESPONDER* 😈 ━┓\n\n┃.responder on - Activer ✅\n┃.responder off - Désactiver ❌\n┃.responder add mot | reponse - Ajouter\n┃.responder list - Voir liste\n┃.responder del mot - Supprimer\n\n┗━ *By CHOCO ITACHI 224611257942* ━┛`
            }, { quoted: m });
        }

        if (sub === 'on') {
            await store.saveSetting(chatId, 'responder_enabled', { enabled: true });
            return sock.sendMessage(chatId, {
                text: `✅ 🍫 *CHOCO-ITACHI-V2* 😈\n*RESPONDER ACTIVÉ!*\n> Je réponds auto maintenant 🔥`
            }, { quoted: m });
        }

        if (sub === 'off') {
            await store.saveSetting(chatId, 'responder_enabled', { enabled: false });
            return sock.sendMessage(chatId, {
                text: `❌ 🍫 *CHOCO-ITACHI-V2*\nResponder désactivé`
            }, { quoted: m });
        }

        if (sub === 'add') {
            const full = args.slice(1).join(' ').split('|');
            if (full.length < 2) {
                return sock.sendMessage(chatId, {
                    text: `❌ Utilisation:\n.responder add salut | Salut moi c'est CHOCO-ITACHI-V2 😈🍫`
                }, { quoted: m });
            }
            const key = full