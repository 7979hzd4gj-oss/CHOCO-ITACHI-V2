import { channelInfo } from '../lib/messageConfig.js';
import config from '../config.js';

export default {
    command: 'uptime',
    aliases: ['runtime', 'botstatus', 'alive'],
    category: 'general',
    description: 'CHOCO Bot status',
    usage: '.uptime',
    isPrefixless: true,

    async handler(sock, message) {
        const chatId = message.key.remoteJid;

        const commandHandler = (await import('../lib/commandHandler.js')).default;
        const uptimeMs = process.uptime() * 1000;

        const formatUptime = (ms) => {
            const sec = Math.floor(ms / 1000) % 60;
            const min = Math.floor(ms / (1000 * 60)) % 60;
            const hr = Math.floor(ms / (1000 * 60 * 60)) % 24;
            const day = Math.floor(ms / (1000 * 60 * 60 * 24));
            const parts = [];
            if (day) parts.push(`${day}j`);
            if (hr) parts.push(`${hr}h`);
            if (min) parts.push(`${min}m`);
            parts.push(`${sec}s`);
            return parts.join(' ');
        };

        const startedAt = new Date(Date.now() - uptimeMs).toLocaleString('fr-FR', { timeZone: config.timezone });
        const ramMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const commandCount = commandHandler.commands.size;

        const text = `🍫 *CHOCO-ITACHI-V2 STATUS* 😈\n\n`+
            `⏱ *Uptime:* ${formatUptime(uptimeMs)}\n`+
            `🚀 *Démarré:* ${startedAt}\n`+
            `📦 *Plugins:* ${commandCount}\n`+
            `💾 *RAM:* ${ramMb} MB\n`+
            `👑 *Owner:* ${config.owner[0]}\n`+
            `⚙️ *Mode:* ${config.mode}\n`+
            `🔮 *Prefix:* ${config.prefix}\n\n`+
            `> _Powered by CHOCO 🍫_`;

        await sock.sendMessage(chatId, { text,...channelInfo });
    }
};