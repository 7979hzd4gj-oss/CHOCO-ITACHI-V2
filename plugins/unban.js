import fs from 'fs';
import store from '../lib/lightweight_store.js';
import { channelInfo } from '../lib/messageConfig.js';

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB =!!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);
const bannedFilePath = './data/banned.json';

async function getBannedUsers() {
    if (HAS_DB) {
        const banned = await store.getSetting('global', 'banned');
        return banned || [];
    } else {
        if (fs.existsSync(bannedFilePath)) {
            return JSON.parse(fs.readFileSync(bannedFilePath, "utf-8"));
        }
        return [];
    }
}

async function saveBannedUsers(bannedUsers) {
    if (HAS_DB) {
        await store.saveSetting('global', 'banned', bannedUsers);
    } else {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(bannedFilePath, JSON.stringify(bannedUsers, null, 2));
    }
}

export default {
    command: 'unban',
    aliases: ['pardon', 'deban', 'free'],
    category: 'admin',
    description: 'CHOCO - Débannir un user',
    usage: '.unban @user ou reply',

    async handler(sock, message, args, context) {
        const { chatId, isGroup, senderIsOwnerOrSudo, isSenderAdmin, isBotAdmin } = context;

        if (isGroup) {
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, {
                    text: `💀 *Fais de moi admin d'abord chef!*`,
                  ...channelInfo
                }, { quoted: message });
            }
            if (!isSenderAdmin &&!message.key.fromMe &&!senderIsOwnerOrSudo) {
                return sock.sendMessage(chatId, {
                    text: `👑 *Admin seulement chef!*`,
                  ...channelInfo
                }, { quoted: message });
            }
        } else {
            if (!message.key.fromMe &&!senderIsOwnerOrSudo) {
                return sock.sendMessage(chatId, {
                    text: `👑 *Owner seulement en privé!*`,
                  ...channelInfo
                }, { quoted: message });
            }
        }

        let userToUnban;
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToUnban = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToUnban = message.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToUnban) {
            return sock.sendMessage(chatId, {
                text: `🍫 *CHOCO UNBAN* 😈\n\n💀 Mentionne ou reply au mec à débannir!\nEx: \`.unban @user\``,
              ...channelInfo
            }, { quoted: message });
        }

        try {
            const bannedUsers = await getBannedUsers();
            const index = bannedUsers.indexOf(userToUnban);

            if (index > -1) {
                bannedUsers.splice(index, 1);
                await saveBannedUsers(bannedUsers);
                await sock.sendMessage(chatId, {
                    text: `🍫 *DÉBANNIS* 😈\n\n✅ @${userToUnban.split('@')[0]} est libre maintenant!\n📦 Stockage: ${HAS_DB? 'DB' : 'Fichier'}\n\n> _By CHOCO_`,
                    mentions: [userToUnban],
                  ...channelInfo
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    text: `😅 @${userToUnban.split('@')[0]} n'est même pas banni chef!`,
                    mentions: [userToUnban],
                  ...channelInfo
                }, { quoted: message });
            }
        } catch (error) {
            console.error('[CHOCO UNBAN] Error:', error);
            await sock.sendMessage(chatId, {
                text: `💀 *Échec du unban chef!*`,
              ...channelInfo
            }, { quoted: message });
        }
    }
};