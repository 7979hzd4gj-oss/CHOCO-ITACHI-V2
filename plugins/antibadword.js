import store from '../lib/lightweight_store.js';
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_PHOTO = "https://files.catbox.moe/TON-LIEN-ICI.jpg";

async function getAntibadwordSettings(chatId) {
    const settings = await store.getSetting(chatId, 'antibadword');
    return settings || { enabled: false, words: [] };
}
async function saveAntibadwordSettings(chatId, settings) {
    await store.saveSetting(chatId, 'antibadword', settings);
}

async function handleAntiBadwordCommand(sock, chatId, message, match) {
    const args = match.trim().toLowerCase().split(/\s+/);
    const action = args[0];
    const settings = await getAntibadwordSettings(chatId);

    if (!action || action === 'status') {
        const status = settings.enabled? '✅ Activé' : '❌ Désactivé';
        const wordCount = settings.words?.length || 0;
        await sock.sendMessage(chatId, {
            image: { url: CHOCO_PHOTO },
            caption:`🍫 *CHOCO ANTIBADWORD* 😈\n\n📊 Status: ${status}\n🚫 Mots bloqués: ${wordCount}\n\n💀 *Commandes:*\n•.antibadword on - Activer\n•.antibadword off - Désactiver\n•.antibadword add <mot>\n•.antibadword remove <mot>\n•.antibadword list`,
      ...channelInfo
        }, { quoted: message });
        return;
    }

    if (action === 'on') {
        settings.enabled = true;
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, {
            text:`🍫 *ANTIBADWORD ACTIVÉ* 😈\n\n✅ Les messages avec mots interdits seront supprimés!`,...channelInfo
        }, { quoted: message });
        return;
    }
    if (action === 'off') {
        settings.enabled = false;
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, { text:`❌ *Antibadword désactivé*`,...channelInfo }, { quoted: message });
        return;
    }
    if (action === 'add') {
        const word = args.slice(1).join(' ').toLowerCase().trim();
        if (!word) return sock.sendMessage(chatId, { text:`💀 Spécifie un mot chef! Ex:.antibadword add connard`,...channelInfo }, { quoted: message });
        if (!settings.words) settings.words = [];
        if (settings.words.includes(word)) return sock.sendMessage(chatId, { text:`💀 "${word}" déjà bloqué!`,...channelInfo }, { quoted: message });
        settings.words.push(word);
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, { text:`✅ Mot ajouté: "${word}"\nTotal: ${settings.words.length}`,...channelInfo }, { quoted: message });
        return;
    }
    if (['remove','delete','del'].includes(action)) {
        const word = args.slice(1).join(' ').toLowerCase().trim();
        if (!word) return sock.sendMessage(chatId, { text:`💀 Quel mot retirer?`,...channelInfo }, { quoted: message });
        if (!settings.words ||!settings.words.includes(word)) return sock.sendMessage(chatId, { text:`💀 "${word}" pas dans la liste`,...channelInfo }, { quoted: message });
        settings.words = settings.words.filter(w => w!== word);
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, { text:`✅ Retiré: "${word}" | Reste: ${settings.words.length}`,...channelInfo }, { quoted: message });
        return;
    }
    if (action === 'list') {
        if (!settings.words || settings.words.length === 0) {
            return sock.sendMessage(chatId, { text:`📝 Aucun mot bloqué. Ajoute avec.antibadword add <mot>`,...channelInfo }, { quoted: message });
        }
        const wordList = settings.words.map((w,i) => `${i+1}. ${w}`).join('\n');
        await sock.sendMessage(chatId, { text:`🍫 *LISTE MOTS BLOQUÉS* 😈\n\n${wordList}\n\nTotal: ${settings.words.length}`,...channelInfo }, { quoted: message });
        return;
    }
    await sock.sendMessage(chatId, { text:`💀 Action invalide!.antibadword on/off/add/remove/list`,...channelInfo }, { quoted: message });
}

async function checkAntiBadword(sock, message) {
    const chatId = message.key.remoteJid;
    if (!chatId.endsWith('@g.us')) return false;
    const settings = await getAntibadwordSettings(chatId);
    if (!settings.enabled ||!settings.words?.length) return false;
    const messageText = (message.message?.conversation || message.message?.extendedTextMessage?.text || message.message?.imageMessage?.caption || message.message?.videoMessage?.caption || '').toLowerCase();
    if (!messageText) return false;
    for (const word of settings.words) {
        if (messageText.includes(word.toLowerCase())) {
            try {
                await sock.sendMessage(chatId, { delete: message.key });
                await sock.sendMessage(chatId, { text:`🍫 *Message supprimé* 😈\n💀 Mot bloqué: "${word}"`,...channelInfo });
                return true;
            } catch (e) { console.error(e); }
            break;
        }
    }
    return false;
}

export default {
    command: 'antibadword',
    aliases: ['abw', 'badword', 'antibad', 'antigrosmot'],
    category: 'admin',
    description: 'CHOCO - Filtre anti-gros mots',
    usage: '.antibadword <on|off|add|remove|list>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const match = args.join(' ');
        try { await handleAntiBadwordCommand(sock, chatId, message, match); }
        catch (e) {
            console.error(e);
            await sock.sendMessage(chatId, { text:`💀 Erreur antibadword`,...channelInfo }, { quoted: message });
        }
    }
};
export { handleAntiBadwordCommand };
export { checkAntiBadword };