import store from '../lib/lightweight_store.js';
import isOwnerOrSudo from '../lib/isOwner.js';
import isAdmin from '../lib/isAdmin.js';
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_PHOTO = "https://files.catbox.moe/TON-LIEN-ICI.jpg";

// ================= ANTILINK =================
async function setAntilink(chatId, type, action) {
    try { await store.saveSetting(chatId, 'antilink', { enabled: true, action, type }); return true; }
    catch (e) { console.error(e); return false; }
}
async function getAntilink(chatId) {
    try { return await store.getSetting(chatId, 'antilink') || null; }
    catch { return null; }
}
async function removeAntilink(chatId) {
    try { await store.saveSetting(chatId, 'antilink', { enabled: false, action: null, type: null }); return true; }
    catch { return false; }
}
export async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    try {
        const config = await getAntilink(chatId);
        if (!config?.enabled) return;
        if (await isOwnerOrSudo(senderId, sock, chatId)) return;
        try { const { isSenderAdmin } = await isAdmin(sock, chatId, senderId); if (isSenderAdmin) return; } catch {}

        const action = config.action || 'delete';
        const typeFilter = config.type || 'all';
        const patterns = {
            whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
            whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
            telegram: /t\.me\/[A-Za-z0-9_]+/i,
            allLinks: /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i,
        };
        let shouldAct = false, linkType = '';
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
            try { await sock.sendMessage(chatId, { delete: { remoteJid: chatId, fromMe: false, id: messageId, participant } }); } catch {}
        }
        if (action === 'warn' || action === 'delete') {
            await sock.sendMessage(chatId, { text: `🍫 *CHOCO ANTILINK* 😈\n\n⚠️ @${senderId.split('@')[0]}, les ${linkType} interdits!`, mentions: [senderId],...channelInfo });
        }
        if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, { text: `😈 *CHOCO* 🍫\n\n🚫 @${senderId.split('@')[0]} kick pour ${linkType}!`, mentions: [senderId],...channelInfo });
            } catch {}
        }
    } catch (e) { console.error(e); }
}

// ================= ANTISTATUT =================
async function getAntiStatut(chatId) { return await store.getSetting(chatId, 'antistatut') || { enabled: false }; }
async function handleAntiStatut(sock, chatId, message, args) {
    const action = args[0]?.toLowerCase();
    const conf = await getAntiStatut(chatId);
    if (!action || action === 'status') {
        return sock.sendMessage(chatId, { image: { url: CHOCO_PHOTO }, caption: `🍫 *CHOCO ANTISTATUT* 😈\n\nStatus: ${conf.enabled? '✅ ON' : '❌ OFF'}\n\n. antistatut on\n. antistatut off`,...channelInfo }, { quoted: message });
    }
    if (action === 'on') {
        await store.saveSetting(chatId, 'antistatut', { enabled: true });
        return sock.sendMessage(chatId, { text: `✅ Antistatut ON 😈 - Les statuts seront supprimés`,...channelInfo }, { quoted: message });
    }
    if (action === 'off') {
        await store.saveSetting(chatId, 'antistatut', { enabled: false });
        return sock.sendMessage(chatId, { text: `❌ Antistatut OFF`,...channelInfo }, { quoted: message });
    }
}

// ================= ANTIMARABOU =================
const MARABOU_WORDS = ["marabout","retour d'affection","voyant","portefeuille magique","bedou","rituel","désenvoutement","whatsapp +229","bénin","multiplication d'argent"];
async function getAntiMarabou(chatId) { return await store.getSetting(chatId, 'antimarabou') || { enabled: false }; }
async function handleAntiMarabou(sock, chatId, message, args) {
    const action = args[0]?.toLowerCase();
    const conf = await getAntiMarabou(chatId);
    if (!action || action === 'status') {
        return sock.sendMessage(chatId, { image: { url: CHOCO_PHOTO }, caption: `🍫 *CHOCO ANTIMARABOU* 😈\n\nStatus: ${