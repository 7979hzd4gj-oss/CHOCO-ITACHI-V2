import store from '../lib/lightweight_store.js';

export default {
    command: 'addreply',
    aliases: ['responder', 'autoreply', 'newtrigger', 'setreply'],
    category: 'admin',
    description: 'CHOCO-ITACHI-V2 Auto Reply 😈🍫',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const fullText = args.join(' ');
        const pipeIndex = fullText.indexOf('|');

        if (!fullText || pipeIndex === -1) {
            return await sock.sendMessage(chatId, {
                text: `┏━ 🍫 *CHOCO RESPONDER* 😈 ━┓\n\n┃ *.addreply mot | réponse*\n┃ Ex:.addreply salut | Yo c'est CHOCO-ITACHI-V2 😈\n┃\n┃ *.addreply exact:bonjour | Bonjour {name}*\n┃ {name} = mentionne la personne\n┃\n┃ *.responder on / off*\n┃ *.responder list*\n┃ *.responder del mot*\n┗━ *By CHOCO ITACHI 224611257942* ━┛`
            }, { quoted: message });
        }

        let trigger = fullText.substring(0, pipeIndex).trim().toLowerCase();
        const response = fullText.substring(pipeIndex + 1).trim();

        if (!trigger ||!response) {
            return await sock.sendMessage(chatId, {
                text: `❌ 🍫 Besoin de 2 parties\nEx:.addreply hello | Salut 😈`
            }, { quoted: message });
        }

        let data = await store.getSetting(chatId, 'responder_list') || {};

        if (data[trigger]) {
            return await sock.sendMessage(chatId, {
                text: `⚠️ 🍫 Le mot *"${trigger}"* existe déjà!\nFais.responder del ${trigger} d'abord`
            }, { quoted: message });
        }

        data[trigger] = response;
        await store.saveSetting(chatId, 'responder_list', data);
        await store.saveSetting(chatId, 'responder_enabled', { enabled: true });

        await sock.sendMessage(chatId, {
            text: `✅ 🍫 *CHOCO-ITACHI-V2* 😈\n*Auto-Reply Ajouté!*\n\n🔑 *Mot:* ${trigger}\n💬 *Réponse:* ${response}\n\n> By CHOCO ITACHI`
        }, { quoted: message });
    }
};