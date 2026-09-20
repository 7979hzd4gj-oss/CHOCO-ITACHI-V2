import config from '../config.js';
import commandHandler from '../lib/commandHandler.js';
import path from 'path';
import fs from 'fs';

// TA PHOTO ET TON NOM
const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";
const CHOCO_NAME = "CHOCO-ITACHI-V2 😈🍫";

function formatTime() {
    const now = new Date();
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: config.timeZone || 'UTC'
    };
    return now.toLocaleTimeString('en-US', options);
}

const menuStyles = [
    {
        render({ _title, info, categories, prefix }) {
            let t = `╭━━『 *${CHOCO_NAME}* 』━⬣\n`;
            t += `┃ ✨ *Bot: ${info.bot}*\n`;
            t += `┃ 🍫 *Prefix: ${info.prefix}*\n`;
            t += `┃ 📦 *Plugin: ${info.total}*\n`;
            t += `┃ 💎 *Version: ${info.version}*\n`;
            t += `┃ ⏰ *Time: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `┃━━━ *${cat.toUpperCase()}* ━✦\n`;
                for (const c of cmds)
                    t += `┃ ➤ ${prefix}${c}\n`;
            }
            t += `╰━━━━━━━ By 224611257942 ━━━━━⬣`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `◈╭─❍「 *${CHOCO_NAME}* 」❍\n`;
            t += `◈├• 🌟 *Bot: ${info.bot}*\n`;
            t += `◈├• 🍫 *Prefix: ${info.prefix}*\n`;
            t += `◈├• 📦 *Plugins: ${info.total}*\n`;
            t += `◈├• 💎 *Version: ${info.version}*\n`;
            t += `◈├• ⏰ *Time: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `◈├─❍「 *${cat.toUpperCase()}* 」❍\n`;
                for (const c of cmds)
                    t += `◈├• ${prefix}${c}\n`;
            }
            t += `◈╰──★ By CHOCO ITACHI ──❍`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `┏━━━━ *${CHOCO_NAME}* ━━━┓\n`;
            t += `┃• *Bot : ${info.bot}*\n`;
            t += `┃• *Prefixes : ${info.prefix}*\n`;
            t += `┃• *Plugins : ${info.total}*\n`;
            t += `┃• *Version : ${info.version}*\n`;
            t += `┃• *Time : ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `┃━━━━ *${cat.toUpperCase()}* ━━◆\n`;
                for (const c of cmds)
                    t += `┃ ▸ ${prefix}${c}\n`;
            }
            t += `┗━━━━━━━ 😈🍫 ━━━━━━━┛`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `✦═══ *${CHOCO_NAME}* ═══✦\n`;
            t += `║➩ *Bot: ${info.bot}*\n`;
            t += `║➩ *Prefixes: ${info.prefix}*\n`;
            t += `║➩ *Plugins: ${info.total}*\n`;
            t += `║➩ *Version: ${info.version}*\n`;
            t += `║➩ *Time: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `║══ *${cat.toUpperCase()}* ══✧\n`;
                for (const c of cmds)
                    t += `║ ✦ ${prefix}${c}\n`;
            }
            t += `✦════ By 224611257942 ════✦`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `❀━━━ *${CHOCO_NAME}* ━━━❀\n`;
            t += `┃☞ *Bot: ${info.bot}*\n`;
            t += `┃☞ *Prefixes: ${info.prefix}*\n`;
            t += `┃☞ *Plugins: ${info.total}*\n`;
            t += `┃☞ *Version: ${info.version}*\n`;
            t += `┃☞ *Time: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `┃━━━〔 *${cat.toUpperCase()}* 〕━❀\n`;
                for (const c of cmds)
                    t += `┃☞ ${prefix}${c}\n`;
            }
            t += `❀━━━━━━━━━━━━━━❀`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `◆━━━ *${CHOCO_NAME}* ━━━◆\n`;
            t += `┃ ¤ *Bot: ${info.bot}*\n`;
            t += `┃ ¤ *Prefixes: ${info.prefix}*\n`;
            t += `┃ ¤ *Plugins: ${info.total}*\n`;
            t += `┃ ¤ *Version: ${info.version}*\n`;
            t += `┃ ¤ *Time: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `┃━━ *${cat.toUpperCase()}* ━━◆◆\n`;
                for (const c of cmds)
                    t += `┃ ¤ ${prefix}${c}\n`;
            }
            t += `◆━━━━━━━━━━━━━━━━◆`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `╭───⬣ *${CHOCO_NAME}* ──⬣\n`;
            t += ` | ● *Bot: ${info.bot}*\n`;
            t += ` | ● *Prefixes: ${info.prefix}*\n`;
            t += ` | ● *Plugins: ${info.total}*\n`;
            t += ` | ● *Version: ${info.version}*\n`;
            t += ` | ● *Time: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += ` |───⬣ *${cat.toUpperCase()}* ──⬣\n`;
                for (const c of cmds)
                    t += ` | ● ${prefix}${c}\n`;
            }
            t += `╰──────────⬣`;
            return t;
        }
    }
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default {
    command: 'menu',
    aliases: ['help', 'commands', 'h', 'list', 'chocomenu'],
    category: 'general',
    description: 'Show all commands - CHOCO-ITACHI-V2',
    usage: '🍫menu [command]',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const prefix = "🍫"; // TON PREFIXE CHOCO
        const imagePath = CHOCO_IMG; // TA PHOTO

        if (args.length) {
            const searchTerm = args[0].toLowerCase();
            let cmd = commandHandler.commands.get(searchTerm);
            if (!cmd && commandHandler.aliases.has(searchTerm)) {
                const mainCommand = commandHandler.aliases.get(searchTerm);
                cmd = commandHandler.commands.get(mainCommand);
            }
            if (!cmd) {
                return sock.sendMessage(chatId, {
                    text: `❌ Command "${args[0]}" not found.\n\nUse ${prefix}menu to see all commands.`,
                    ...channelInfo
                }, { quoted: message });
            }
            const text = `╭━━━━━━━━━━━━━━⬣
┃ 📌 *COMMAND INFO - CHOCO*
┃
┃ ⚡ *Command:* ${prefix}${cmd.command}
┃ 📝 *Desc:* ${cmd.description || 'No description'}
┃ 📖 *Usage:* ${cmd.usage || `${prefix}${cmd.command}`}
┃ 🏷️ *Category:* ${cmd.category || 'misc'}
┃ 🔖 *Aliases:* ${cmd.aliases?.length ? cmd.aliases.map((a) => prefix + a).join(', ') : 'None'}
┃
╰━━━━━━━━━━━━━━⬣`;
            return sock.sendMessage(chatId, {
                image: { url: imagePath },
                caption: text,
                ...channelInfo
            }, { quoted: message });
        }

        const style = pick(menuStyles);
        const text = style.render({
            title: CHOCO_NAME,
            prefix,
            info: {
                bot: CHOCO_NAME,
                prefix: "🍫",
                total: commandHandler.commands.size,
                version: config.version || "6.0.0 CHOCO",
                time: formatTime()
            },
            categories: commandHandler.categories
        });

        await sock.sendMessage(chatId, {
            image: { url: imagePath },
            caption: text,
            ...channelInfo
        }, { quoted: message });
    }
};