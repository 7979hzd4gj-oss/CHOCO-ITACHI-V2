import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { UploadFileUgu, TelegraPh } from '../lib/uploader.js';
import { channelInfo } from '../lib/messageConfig.js';

async function getMediaBuffer(msg, sock) {
    return await downloadMediaMessage(msg, 'buffer', {}, {
        logger: sock.logger,
        reuploadRequest: sock.updateMediaMessage
    });
}

function getQuotedMessage(message) {
    const ctx = message.message?.extendedTextMessage?.contextInfo;
    if (!ctx?.quotedMessage) return null;
    return {
        key: {
            remoteJid: message.key.remoteJid,
            fromMe: false,
            id: ctx.stanzaId,
            participant: ctx.participant
        },
        message: ctx.quotedMessage
    };
}

function getExtFromMessage(msg) {
    const m = msg.message;
    if (m.imageMessage) return '.jpg';
    if (m.videoMessage) return '.mp4';
    if (m.audioMessage) return '.mp3';
    if (m.stickerMessage) return '.webp';
    if (m.documentMessage) return path.extname(m.documentMessage.fileName || '') || '.bin';
    return null;
}

export default {
    command: 'tourl',
    aliases: ['geturl', 'mediaurl', 'url'], // CHOCO: garde url en alias mais commande principale = tourl
    category: 'tools',
    description: 'CHOCO - Convert media to URL',
    usage: '.tourl (envoie ou reply à un media)',

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;

        try {
            let targetMsg = null;

            if (message.message?.imageMessage ||
                message.message?.videoMessage ||
                message.message?.audioMessage ||
                message.message?.stickerMessage ||
                message.message?.documentMessage) {
                targetMsg = message;
            }

            if (!targetMsg) {
                const quoted = getQuotedMessage(message);
                if (quoted) targetMsg = quoted;
            }

            if (!targetMsg) {
                return sock.sendMessage(chatId, { 
                    text: `🍫 *CHOCO TOURL* 😈\n\n💀 Envoie ou reply à une image/video/audio/sticker/document chef!`,
                   ...channelInfo
                }, { quoted: message });
            }

            const ext = getExtFromMessage(targetMsg);
            if (!ext) throw new Error('Unsupported media');

            await sock.sendMessage(chatId, { 
                text: `⏳ *Upload en cours...* 🍫`,
               ...channelInfo
            }, { quoted: message });

            const buffer = await getMediaBuffer(targetMsg, sock);
            if (!buffer) throw new Error('Failed download');

            const tempDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const tempPath = path.join(tempDir, `choco_${Date.now()}${ext}`);
            fs.writeFileSync(tempPath, buffer);

            let url = '';
            try {
                if (['.jpg', '.png', '.webp', '.jpeg'].includes(ext.toLowerCase())) {
                    try {
                        url = await TelegraPh(tempPath);
                    } catch {
                        const res = await UploadFileUgu(tempPath);
                        url = typeof res === 'string' ? res : (res.url || res.url_full || '');
                    }
                } else {
                    const res = await UploadFileUgu(tempPath);
                    url = typeof res === 'string' ? res : (res.url || res.url_full || '');
                }
            } finally {
                setTimeout(() => { try { fs.unlinkSync(tempPath); } catch {} }, 2000);
            }

            if (!url) {
                return sock.sendMessage(chatId, { 
                    text: `💀 *Upload échoué chef!* Réessaie`,
                   ...channelInfo
                }, { quoted: message });
            }

            await sock.sendMessage(chatId, { 
                text: `🍫 *CHOCO URL* 😈\n\n🔗 *URL:* ${url}\n\n📁 *Type:* ${ext}\n\n> _By CHOCO-ITACHI-V2_`,
               ...channelInfo
            }, { quoted: message });

        } catch (error) {
            console.error('[CHOCO TOURL] error:', error);
            await sock.sendMessage(chatId, { 
                text: `❌ *Erreur:* ${error.message}`,
               ...channelInfo
            }, { quoted: message });
        }
    }
};