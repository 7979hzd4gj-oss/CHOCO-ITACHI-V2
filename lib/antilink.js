import { isJidGroup } from '@whiskeysockets/baileys';
import { getAntilink, incrementWarningCount, resetWarningCount, isSudo } from '../lib/index.js';
import isAdmin from '../lib/isAdmin.js';
import config from '../config.js';
import { channelInfo } from './messageConfig.js';

const WARN_COUNT = config.warnCount || 3;

function containsURL(str) {
    const urlRegex = /(https?:\/\/)?(www\.)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/gi;
    return urlRegex.test(str);
}

async function Antilink(msg, sock) {
    const jid = msg.key.remoteJid;
    if (!isJidGroup(jid)) return;

    const SenderMessage = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if (!SenderMessage) return;

    const sender = msg.key.participant;
    if (!sender) return;

    // Admin & Sudo bypass
    try {
        const { isSenderAdmin } = await isAdmin(sock, jid, sender);
        if (isSenderAdmin) return;
    } catch {}

    if (await isSudo(sender)) return;
    if (!containsURL(SenderMessage.trim())) return;

    const antilinkConfig = await getAntilink(jid, 'on');
    if (!antilinkConfig) return;

    const action = antilinkConfig.action || 'delete';

    try {
        await sock.sendMessage(jid, { delete: msg.key });

        switch (action) {
            case 'delete':
                await sock.sendMessage(jid, {
                    text: `🍫 *ANTILINK* 😈\n@${sender.split('@')[0]} les liens sont interdits ici chef!`,
                    mentions: [sender],
                   ...channelInfo
                });
                break;

            case 'kick':
                await sock.sendMessage(jid, {
                    text: `🍫 *KICKED* 👊\n@${sender.split('@')[0]} a été éjecté pour lien!`,
                    mentions: [sender],
                   ...channelInfo
                });
                await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                break;

            case 'warn':
                const warningCount = await incrementWarningCount(jid, sender);
                if (warningCount >= WARN_COUNT) {
                    await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                    await resetWarningCount(jid, sender);
                    await sock.sendMessage(jid, {
                        text: `🍫 *BANNED* 💀\n@${sender.split('@')[0]} kick après ${WARN_COUNT} warns pour lien!`,
                        mentions: [sender],
                       ...channelInfo
                    });
                } else {
                    await sock.sendMessage(jid, {
                        text: `⚠️ *WARN ${warningCount}/${WARN_COUNT}* 🍫\n@${sender.split('@')[0]} évite les liens chef!`,
                        mentions: [sender],
                       ...channelInfo
                    });
                }
                break;
        }
    } catch (error) {
        console.error('Error in Antilink CHOCO:', error);
    }
}

export default { Antilink };