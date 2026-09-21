import { handleWelcome } from '../lib/welcome.js';
import { isWelcomeOn, getWelcome } from '../lib/index.js';

const CHOCO_IMG = "https://files.catbox.moe/ykfu82.png";

export default {
    command: 'welcome',
    aliases: ['setwelcome', 'chocowelcome'],
    category: 'admin',
    description: 'Configure welcome - CHOCO-ITACHI-V2 😈🍫',
    usage: '🍫welcome [on/off/message]',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const { chatId } = context;
        const matchText = args.join(' ');
        await handleWelcome(sock, chatId, message, matchText);
    }
};

async function handleJoinEvent(sock, id, participants) {
    const isWelcomeEnabled = await isWelcomeOn(id);
    if (!isWelcomeEnabled) return;

    const customMessage = await getWelcome(id);
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;
    const groupDesc = groupMetadata.desc || 'Pas de description 🍫';

    const channelInfo = {
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363319098372999@newsletter',
                newsletterName: 'CHOCO-ITACHI-V2 😈🍫',
                serverMessageId: -1
            }
        }
    };

    for (const participant of participants) {
        try {
            const participantString = typeof participant === 'string'? participant : (participant.id || participant.toString());
            const user = participantString.split('@')[0];
            let displayName = user;

            try {
                const groupParticipants = groupMetadata.participants;
                const userParticipant = groupParticipants.find((p) => p.id === participantString);
                if (userParticipant && userParticipant.notify) {
                    displayName = userParticipant.notify;
                }
            } catch { }

            let finalMessage;
            if (customMessage) {
                finalMessage = customMessage
                   .replace(/{user}/g, `@${displayName}`)
                   .replace(/{group}/g, groupName)
                   .replace(/{description}/g, groupDesc);
            } else {
                const now = new Date();
                const timeString = now.toLocaleString('fr-FR', {
                    month: '2-digit', day: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                });
                finalMessage = `┏━━ 🍫 *CHOCO WELCOME* 😈 ━━┓\n`+
                    `┃ 👋 BIENVENUE: @${displayName}\n`+
                    `┃ 👥 Membres: #${groupMetadata.participants.length}\n`+
                    `┃ ⏰ ${timeString}\n`+
                    `┗━━━━━━━━━━━━━━┛\n\n`+
                    `@${displayName} Bienvenue dans *${groupName}*! 🎉🍫\n\n`+
                    `*📜 DESCRIPTION:*\n${groupDesc}\n\n`+
                    `> 😈 *CHOCO-ITACHI-V2* | 224611257942 🍫`;
            }

            try {
                let profilePicUrl = CHOCO_IMG;
                try {
                    const profilePic = await sock.profilePictureUrl(participantString, 'image');
                    if (profilePic) profilePicUrl = profilePic;
                } catch { }

                const apiUrl = `https://api.some-random-api.com/welcome/img/2/gaming3?type=join&textcolor=red&username=${encodeURIComponent(displayName)}&guildName=${encodeURIComponent(groupName)}&memberCount=${groupMetadata.participants.length}&avatar=${encodeURIComponent(profilePicUrl)}`;
                const response = await fetch(apiUrl);

                if (response.ok) {
                    const imageBuffer = Buffer.from(await response.arrayBuffer());
                    await sock.sendMessage(id, {
                        image: imageBuffer,
                        caption: finalMessage,
                        mentions: [participantString],
                       ...channelInfo
                    });
                    continue;
                }
            } catch (e) {
                console.log('Image welcome fail, fallback texte');
            }

            await sock.sendMessage(id, {
                image: { url: CHOCO_IMG },
                caption: finalMessage,
                mentions: [participantString],
               ...channelInfo
            });

        } catch (error) {
            console.error('Error CHOCO welcome:', error);
            const participantString = typeof participant === 'string'? participant : (participant.id || participant.toString());
            const user = participantString.split('@')[0];
            let fallbackMessage = customMessage?
                customMessage.replace(/{user}/g, `@${user}`).replace(/{group}/g, groupName).replace(/{description}/g, groupDesc) :
                `🍫 Bienvenue @${user} dans ${groupName}! 😈 | 224611257942`;

            await sock.sendMessage(id, {
                text: fallbackMessage,
                mentions: [participantString],
               ...channelInfo
            });
        }
    }
}

export { handleJoinEvent };