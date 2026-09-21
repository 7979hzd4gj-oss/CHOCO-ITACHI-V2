import axios from 'axios';
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'wiki',
    aliases: ['wikipedia', 'chocowiki'],
    category: 'search',
    description: 'Search Wikipedia - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫wiki <sujet>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ').trim();
        const prefix = "🍫";
        
        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO WIKI* 😈\n\nQue veux-tu chercher?\nExemple: ${prefix}wiki Itachi Uchiha\n${prefix}wiki Conakry`,
               