import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'viewonce',
    aliases: ['viewmedia', 'vv', 'chocovv', 'antiviewonce'],
    category: 'tools',
    description: 'Débloque vue unique - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫vv (réponds à une vue unique)',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;

        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });

            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            // FIX CHOCO: nouvelle version WhatsApp = viewOnceMessageV2
            let quotedImage = quoted?.imageMessage;
            let quotedVideo = quoted?.videoMessage;
            let quotedAudio = quoted?.audioMessage;

            // Support viewOnceMessage wrapper (Baileys récent)
            if (quoted?.viewOnceMessage) {
                quotedImage = quoted.viewOnceMessage.message?.imageMessage;
                quotedVideo = quoted.viewOnceMessage.message?.videoMessage