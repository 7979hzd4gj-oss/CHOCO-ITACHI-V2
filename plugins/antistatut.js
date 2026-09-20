import store from '../lib/lightweight_store.js';
export default {
    command: 'antistatut',
    aliases: ['antistatus'],
    category: 'admin',
    description: 'CHOCO-ITACHI-V2 Anti Statut',
    async handler(sock, m, args, context) {
        const chatId = context.chatId;
        const action = args[0]?.toLowerCase();
        if(action === 'on'){
            await store.saveSetting(chatId, 'antistatut', { enabled: true });
            await sock.sendMessage(chatId, { text: `✅ 🍫 *CHOCO-ITACHI-V2* 😈\nAntistatut ON - By CHOCO ITACHI` }, {quoted: m});
        } else {
            await store.saveSetting(chatId, 'antistatut', { enabled: false });
            await sock.sendMessage(chatId, { text: `❌ Antistatut OFF 🍫` }, {quoted: m});
        }
    }
}