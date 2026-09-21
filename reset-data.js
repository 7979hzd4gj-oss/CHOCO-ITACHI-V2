import fs from 'fs';
import path from 'path';
import { channelInfo } from '../lib/messageConfig.js';

const filePath = path.join(process.cwd(), 'data', 'autoreplies.json');

function getData() {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return { enabled: true, replies: [] };
    }
}
function save(d){
    const dir = path.dirname(filePath);
    if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); // FIX 1
    fs.writeFileSync(filePath, JSON.stringify(d, null, 2));
}

export default {
    command: 'responder',
    aliases: ['autoresponder','chocoresponder','ar'],
    category: 'admin',
    description: 'Auto réponse - CHOCO 😈🍫',
    usage: '🍫responder on/off/add/del/list',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const data = getData();
        const sub = args[0]?.toLowerCase();

        if (!sub) {
            const countThisGroup = data.replies.filter(r=> r.chatId === chatId).length;
            return sock.sendMessage(chatId, {
                text: `🍫 *CHOCO RESPONDER* 😈\n\n`+
                      `🍫responder on - active\n`+
                      `🍫responder off - désactive\n`+
                      `🍫responder add mot | réponse\n`+
                      `🍫responder del mot\n`+
                      `🍫responder list\n\n`+
                      `Status: ${data.enabled? '✅ ON' : '❌ OFF'}\n`+
                      `Total (ce groupe): ${countThisGroup} | Global: ${data.replies.length}`,
            ...channelInfo
            }, { quoted: message });
        }

        if (sub === 'on' || sub === 'off') {
            data.enabled = sub === 'on';
            save(data);
            return sock.sendMessage(chatId, {
                text: `✅ Responder ${sub.toUpperCase()} 🍫\n> 224611257942`,
            ...channelInfo
            }, { quoted: message });
        }

        if (sub === 'add') {
            const text = args.slice(1).join(' ');
            const [trigger, response] = text.split('|').map(s=>s?.trim());
            if (!trigger ||!response) {
                return sock.sendMessage(chatId, {
                    text: `❌ Format: 🍫responder add salut | Salut chef 🍫😈`,
                ...channelInfo
                }, { quoted: message });
            }
            data.replies.push({ trigger: trigger.toLowerCase(), response, chatId });
            save(data);
            return sock.sendMessage(chatId, {
                text: `┏━━ 🍫 *RESPONDER ADD* 😈 ━━┓\n┃ Mot: ${trigger}\n┃ Réponse: ${response}\n┗━━━━━━━━━━━━━━┛`,
            ...channelInfo
            }, { quoted: message });
        }

        if (sub === 'del' || sub === 'delete') {
            const trigger = args.slice(1).join(' ').toLowerCase();
            const before = data.replies.length;
            // FIX 2: supprime seulement pour ce groupe
            data.replies = data.replies.filter(r =>!(r.trigger === trigger && r.chatId === chatId));
            save(data);
            return sock.sendMessage(chatId, {
                text: before === data.replies.length? `❌ Mot non trouvé dans ce groupe: ${trigger}` : `✅ Supprimé: ${trigger} 🍫`,
            ...channelInfo
            }, { quoted: message });
        }

        if (sub === 'list') {
            const groupReplies = data.replies.filter(r=> r.chatId === chatId);
            if (groupReplies.length === 0) return sock.sendMessage(chatId, { text: `Aucune réponse dans ce groupe 🍫`,...channelInfo }, { quoted: message });
            let txt = `🍫 *RESPONDER LIST* 😈 - ${groupReplies.length}\n\n`;
            // FIX 3: affiche seulement ce groupe
            groupReplies.forEach((r,i)=>{ txt += `${i+1}. ${r.trigger} => ${r.response}\n`; });
            return sock.sendMessage(chatId, { text: txt,...channelInfo }, { quoted: message });
        }
    }
};