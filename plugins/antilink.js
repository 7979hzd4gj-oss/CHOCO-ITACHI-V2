import store from '../lib/lightweight_store.js';
import isOwnerOrSudo from '../lib/isOwner.js';
import isAdmin from '../lib/isAdmin.js';

async function setAntilink(chatId, type, action) {
    try {
        await store.saveSetting(chatId, 'antilink', {
            enabled: true,
            action,
            type
        });
        return true;
    }
    catch (error) {
        console.error('Error setting antilink:', error);
        return false;
    }
}
async function getAntilink(chatId, _type) {
    try {
        const settings = await store.getSetting(chatId, 'antilink');
        return settings || null;
    }
    catch (error) {
        console.error('Error getting antilink:', error);
        return null;
    }
}
async function removeAntilink(chatId, _type) {
    try {
        await store.saveSetting(chatId, 'antilink', {
            enabled: false,
            action: null,
            type: null
        });
        return true;
    }
    catch (error) {
        console.error('Error removing antilink:', error);
        return false;
    }
}
export async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    try {
        const config = await getAntilink(chatId, 'on');
        if (!config?.enabled) return;
        const isOwnerSudo = await isOwnerOrSudo(senderId, sock, chatId);
        if (isOwnerSudo) return;
        try {
            const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
            if (isSenderAdmin) return;
        } catch (e) { }
        const action = config.action || 'delete';
        let shouldAct = false;
        let linkType = '';
        const linkPatterns = {
            whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
            whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
            telegram: /t\.me\/[A-Za-z0-9_]+/i,
            allLinks: /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i,
        };
        if (linkPatterns.whatsappGroup.test(userMessage)) {
            shouldAct = true;
            linkType = 'WhatsApp Group';
        } else if (linkPatterns.whatsappChannel.test(userMessage)) {
            shouldAct = true;
            linkType = 'WhatsApp Channel';
        } else if (linkPatterns.telegram.test(userMessage)) {
            shouldAct = true;
            linkType = 'Telegram';
        } else if (linkPatterns.allLinks.test(userMessage)) {
            shouldAct = true;
            linkType = 'Lien';
        }
        if (!shouldAct) return;
        const messageId = message.key.id;
        const participant = message.key.participant || senderId;
        if (action === 'delete' || action === 'kick') {
            try {
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: messageId,
                        participant
                    }
                });
            } catch (error) {
                console.error('Failed to delete message:', error);
            }
        }
        if (action === 'warn' || action === 'delete') {
            await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO-ITACHI-V2 ANTILINK* 😈\n\n⚠️ @${senderId.split('@')[0]}, les ${linkType} sont interdits ici!\n> Protégé par CHOCO ITACHI`,
                mentions: [senderId]
            });
        }
        if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, {
                    text: `😈 *CHOCO-ITACHI-V2* 🍫\n\n🚫 @${senderId.split('@')[0]} a été kick pour ${linkType}!`,
                    mentions: [senderId]
                });
            } catch (error) {
                console.error('Failed to kick user:', error);
            }
        }
    } catch (error) {
        console.error('Error in link detection:', error);
    }
}
export default {
    command: 'antilink',
    aliases: ['alink', 'linkblock'],
    category: 'admin',
    description: 'CHOCO-ITACHI-V2 Antilink 🍫😈',
    usage: '.antilink <on|off|set>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();
        if (!action) {
            const config = await getAntilink(chatId, 'on');
            await sock.sendMessage(chatId, {
                text: `┏━ 🍫 *CHOCO-ITACHI-V2 ANTILINK* 😈 ━┓\n\n`
                    + `*Status:* ${config?.enabled? '✅ Activé' : '❌ Désactivé'}\n`
                    + `*Action:* ${config?.action || 'Non défini'}\n\n`
                    + `*Commandes:*\n`
                    + `•.antilink on - Activer\n`
                    + `•.antilink off - Désactiver\n`
                    + `•.antilink set delete - Supprimer les liens\n`
                    + `•.antilink set kick - Kick\n`
                    + `•.antilink set warn - Avertir\n\n`
                    + `> *Bot: CHOCO-ITACHI-V2 🍫😈*\n`
                    + `> *Owner: CHOCO ITACHI*`
            }, { quoted: message });
            return;
        }
        switch (action) {
            case 'on':
                const existingConfig = await getAntilink(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, { text: '🍫 Antilink déjà activé 😈' }, { quoted: message });
                    return;
                }
                const result = await setAntilink(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: result? '✅ *CHOCO-ITACHI-V2* 🍫\nAntilink activé!\n> Par CHOCO ITACHI 😈' : '❌ Erreur'
                }, { quoted: message });
                break;
            case 'off':
                await removeAntilink(chatId, 'on');
                await sock.sendMessage(chatId, { text: '❌ *CHOCO-ITACHI-V2* Antilink désactivé 🍫' }, { quoted: message });
                break;
            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, { text: '❌ Usage:.antilink set delete | kick | warn' }, { quoted: message });
                    return;
                }
                const setAction = args[1].toLowerCase();
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    await sock.sendMessage(chatId, { text: '❌ Choisis: delete, kick, warn' }, { quoted: message });
                    return;
                }
                const setResult = await setAntilink(chatId, 'on', setAction);
                await sock.sendMessage(chatId, {
                    text: setResult? `✅ *CHOCO-ITACHI-V2* 🍫\nAction mise: ${setAction} 😈` : '❌ Erreur'
                }, { quoted: message });
                break;
            default:
                await sock.sendMessage(chatId, { text: '❌ Commande invalide. Tape.antilink' }, { quoted: message });
        }
    },
    handleLinkDetection, setAntilink, getAntilink, removeAntilink
};