import axios from 'axios';
import { channelInfo } from '../lib/messageConfig.js';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'weather',
    aliases: ['forecast', 'climate', 'chocoweather', 'meteo'],
    category: 'info',
    description: 'Météo ville - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫weather <ville>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const city = args.join(' ').trim();
        const prefix = "🍫";

        if (!city) {
            return await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO METEO* 😈\n\nDonne une ville!\nExemple: ${prefix}weather Conakry\n${prefix}weather Paris\n${prefix}weather Abidjan`,
                ...channelInfo
            }, { quoted: message });
        }

        try {
            await sock.sendMessage(chatId, { react: { text: '🍫', key: message.key } });
            
            const apiKey = '060a6bcfa19809c2cd4d97a212b19273';
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`);
            const weather = response.data;

            const weatherText = `┏━━ 🍫 *CHOCO METEO* 😈 ━━┓\n`+
                `┃ 🌍 *${weather.name}, ${weather.sys.country}*\n`+
                `┗━━━━━━━━━━━━━━┛\n\n`+
                `🌅 *Ville:* ${weather.name}\n`+
                `🗺️ *Pays:* ${weather.sys.country}\n`+
                `🌤️ *Ciel:* ${weather.weather[0].description}\n`+
                `🌡️ *Temp:* ${weather.main.temp}°C\n`+
                `💠 *Min:* ${weather.main.temp_min}°C\n`+
                `🔥 *Max:* ${weather.main.temp_max}°C\n`+
                `💦 *Humidité:* ${weather.main.humidity}%\n`+
                `🌬️ *Vent:* ${weather.wind.speed} km/h\n\n`+
                `> 😈 *CHOCO-ITACHI-V2* | 224611257942 🍫`;

            await sock.sendMessage(chatId, {
                image: { url: CHOCO_IMG },
                caption: weatherText,
                ...channelInfo
            }, { quoted: message });

        } catch (error) {
            console.error('Weather plugin error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Météo introuvable pour "${city}" 😈🍫 Vérifie le nom.`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};