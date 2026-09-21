import axios from 'axios';
import yts from 'yt-search';
import config from '../config.js';
import { channelInfo } from '../lib/messageConfig.js';

const DL_API = 'https://api.qasimdev.dpdns.org/api/loaderto/download';
const API_KEY = 'qasim-dev';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const downloadWithRetry = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const { data } = await axios.get(DL_API, {
                params: { apiKey: API_KEY, format: '360', url },
                timeout: 120000
            });
            if (data?.data?.downloadUrl) return data.data;
            throw new Error('No download URL');
        } catch (err) {
            if (i === retries - 1) throw err;
            await wait(5000);
        }
    }
};

export default {
    command: 'video',
    aliases: ['ytmp4', 'ytvideo', 'ytdl', 'yt'],
    category: 'download',
    description: 'CHOCO Download YouTube videos',
    usage: '.video <link | nom>',

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: `🍫 *CHOCO-ITACHI VIDEO* 😈\n\n🎥 Tu veux quoi chef?\nEx: *.video Alan Walker Faded*\nEx: *.video https://youtu.be/xxx*`,
                ...channelInfo
            }, { quoted: message });
        }

        try {
            let videoUrl, videoTitle, videoThumbnail;

            if (query.startsWith('http')) {
                videoUrl = query;
            } else {
                const { videos } = await yts(query);
                if (!videos?.length) {
                    return sock.sendMessage(chatId, { 
                        text: `💀 *Aucune vidéo trouvée pour:* ${query}`,
                        ...channelInfo
                    }, { quoted: message });
                }
                videoUrl = videos[0].url;
                videoTitle = videos[0].title;
                videoThumbnail = videos[0].thumbnail;
                videoUrl = videos[0].url;
            }

            const validYT = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
            if (!validYT) {
                return sock.sendMessage(chatId, { 
                    text: `❌ *Lien YouTube invalide chef!*`,
                    ...channelInfo 
                }, { quoted: message });
            }

            const ytId = validYT[1];
            const thumb = videoThumbnail || `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`;

            // Message chargement CHOCO
            await sock.sendMessage(chatId, {
                image: { url: thumb },
                caption: `🍫 *CHOCO DOWNLOAD* 😈\n\n🎬 *${videoTitle || query}*\n⬇️ *Téléchargement... 30s max*\n\n> _Par CHOCO-ITACHI-V2_`,
                ...channelInfo
            }, { quoted: message });

            const videoData = await downloadWithRetry(videoUrl);

            await sock.sendMessage(chatId, {
                video: { url: videoData.downloadUrl },
                mimetype: 'video/mp4',
                fileName: `${videoData.title || videoTitle || 'choco-video'}.mp4`,
                caption: `🎬 *${videoData.title || videoTitle}*\n\n🍫 *DOWNLOADED BY CHOCO-ITACHI-V2* 😈\n> _Enjoy chef!_`,
                ...channelInfo
            }, { quoted: message });

        } catch (err) {
            console.error('[VIDEO CHOCO] Error:', err.message);
            await sock.sendMessage(chatId, { 
                text: `💀 *Échec du download chef!*\nRaison: ${err.message}\n\n> _Réessaie plus tard_`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};