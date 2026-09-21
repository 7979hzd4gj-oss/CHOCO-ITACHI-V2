import store from '../lib/lightweight_store.js';
import isOwnerOrSudo from '../lib/isOwner.js';
import isAdmin from '../lib/isAdmin.js';
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_PHOTO = "https://files.catbox.moe/TON-LIEN-ICI.jpg";

async function setAntilink(chatId, type, action) {
    try {
        await store.saveSetting(chatId, 'antilink', { enabled: true, action, type });
        return true;
    } catch (e) { console.error(e); return false; }
}
async function getAntilink(chatId) {
    try { return await store.getSetting(chatId, 'antilink') || null; }
    catch { return null; }
}
async function removeAntilink(chatId) {
    try {
        await store.saveSetting(chatId, 'antilink', { enabled: false, action: null, type: null });
        return true;
    } catch { return false; }
}

export async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    try {
        const config = await getAntilink(chatId);
        if (!config?.enabled) return;
        if (await isOwnerOrSudo(senderId, sock, chatId)) return;
        try {
            const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
            if (isSenderAdmin) return;
        } catch {}

        const action = config.action || 'delete';
        const typeFilter = config.type || 'all'; // all, whatsapp, channel, telegram

        const patterns = {
            whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
            whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
            telegram: /t\.me\/[A-Za-z0-9_]+/i,
            allLinks: /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i,
        };

        let shouldAct = false;
        let linkType = '';

        // TES 4 COMMANDES ICI 👇
        if (typeFilter === 'whatsapp' || typeFilter === 'all') {
            if (patterns.whatsappGroup.test(userMessage)) { shouldAct = true; linkType = 'WhatsApp Group'; }
        }
        if (!shouldAct && (typeFilter === 'channel' || typeFilter === 'all')) {
            if (patterns.whatsappChannel.test(userMessage)) { shouldAct = true; linkType = 'WhatsApp Channel'; }
        }
        if (!shouldAct && (typeFilter === 'telegram' || typeFilter === 'all')) {
            if (patterns.telegram.test(userMessage)) { shouldAct = true; linkType = 'Telegram'; }
        }
        if (!shouldAct && typeFilter === 'all') {
            if (patterns.allLinks.test(userMessage)) { shouldAct = true; linkType = 'Lien'; }
        }

        if (!shouldAct) return;

        const messageId = message.key.id;
        const participant = message.key.participant || senderId;

        if (action === 'delete' || action === 'kick') {
            try {
                await sock.sendMessage(chatId, {
                    delete: { remoteJid: chatId, fromMe: false, id: messageId, participant }
                });
            } catch {}
        }

        if (action === 'warn' || action === 'delete') {
            await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO ANTILINK* 😈\n\n⚠️ @${senderId.split('@')[0]}, les ${linkType} sont interdits ici!\n> Protégé par CHOCO ITACHI`,
                mentions: [senderId],
               ...channelInfo
            });
        }

        if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, {
                    text: `😈 *CHOCO-ITACHI* 🍫\n\n🚫 @${senderId.split('@')[0]} kick pour ${linkType}!`,
                    mentions: [senderId],
                   ...channelInfo
                });
            } catch {}
        }
    } catch (e) { console.error('Link detection error:', e); }
}

export default {
    command: 'antilink',
    aliases: ['alink', 'linkblock', 'antilien'],
    category: 'admin',
    description: 'CHOCO - Antilink 4 types',
    usage: '.antilink <on|off|set|type> <value>',
    groupOnly: true,
    adminOnly: true,

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (!action) {
            const config = await getAntilink(chatId);
            return sock.sendMessage(chatId, {
                image: { url: CHOCO_PHOTO },
                caption:
`┏━ 🍫 *CHOCO ANTILINK V2* 😈 ━┓

*Status:* ${config?.enabled? '✅ Activé' : '❌ Désactivé'}
*Action:* ${config?.action || 'Non défini'}
*Type:* ${config?.type || 'all'}

*🍫 4 COMMANDES:*
•.antilink on/off
•.antilink set delete/kick/warn
•.antilink type all - Tous les liens
•.antilink type whatsapp - Que groupe WA
•.antilink type channel - Que channel WA
•.antilink type telegram - Que Telegram

> _By CHOCO-ITACHI-V2_`,
             ...channelInfo
            }, { quoted: message });
        }

        switch (action) {
            case 'on': {
                const conf = await getAntilink(chatId);
                if (conf?.enabled) return sock.sendMessage(chatId, { text:`🍫 Antilink déjà ON 😈`,...channelInfo }, { quoted: message });
                await setAntilink(chatId, 'all', 'delete');
                await sock.sendMessage(chatId, { text:`✅ *CHOCO* Antilink activé (tous liens) 😈`,...channelInfo }, { quoted: message });
                break;
            }
            case 'off':
                await removeAntilink(chatId);
                await sock.sendMessage(chatId, { text:`❌ Antilink OFF 🍫`,...channelInfo }, { quoted: message });
                break;
            case 'set': {
                const setAction = args[1]?.toLowerCase();
                if (!['delete','kick','warn'].includes(setAction)) {
                    return sock.sendMessage(chatId, { text:`💀 Usage:.antilink set delete|kick|warn`,...channelInfo }, { quoted: message });
                }
                const conf = await getAntilink(chatId) || { type: 'all' };
                await setAntilink(chatId, conf.type, setAction);
                await sock.sendMessage(chatId, { text:`✅ Action mise: ${setAction} 😈`,...channelInfo }, { quoted: message });
                break;
            }
            case 'type': {
                const setType = args[1]?.toLowerCase();
                if (!['all','whatsapp','channel','telegram'].includes(setType)) {
                    return sock.sendMessage(chatId, { text:`💀 Type: all / whatsapp / channel / telegram`,...channelInfo }, { quoted: message });
                }
                const conf = await getAntilink(chatId) || { action: 'delete' };
                await setAntilink(chatId, setType, conf.action);
                await sock.sendMessage(chatId, { text:`✅ *CHOCO* Type antilink: ${setType} 😈\nMaintenant ne bloque que ${setType}`,...channelInfo }, { quoted: message });
                break;
            }
            default:
                await sock.sendMessage(chatId, { text:`💀 Commande invalide. Tape.antilink`,...channelInfo }, { quoted: message });
        }
    },
    handleLinkDetection, setAntilink, getAntilink, removeAntilink
};