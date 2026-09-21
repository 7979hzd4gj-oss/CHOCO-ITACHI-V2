import 'dotenv/config';
import fs, { existsSync, mkdirSync, rmSync } from 'fs';
import path, { dirname } from 'path';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import { parsePhoneNumber as PhoneNumber } from 'awesome-phonenumber';
import readline from 'readline';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { smsg } from './lib/myfunc.js';
import { compileAll } from './lib/compile.js';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, jidDecode, jidNormalizedUser, makeCacheableSignalKeyStore, delay } from '@whiskeysockets/baileys';
import NodeCache from 'node-cache';
import pino from 'pino';
import config from './config.js';
import store from './lib/lightweight_store.js';
import SaveCreds from './lib/session.js';
import { server, PORT } from './lib/server.js';
import { printLog } from './lib/print.js';
import { writeErrorLog } from './lib/logger.js';
import { handleMessages, handleGroupParticipantUpdate, handleStatus, handleCall } from './lib/messageHandler.js';
import commandHandler from './lib/commandHandler.js';

store.readFromFile();
setInterval(() => store.writeToFile(), config.storeWriteInterval || 10000);

setInterval(() => {
    if (global.gc) {
        global.gc();
        console.log('🧹 GC CHOCO fait 😈');
    }
}, 60000);

setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024;
    if (used > 450) {
        printLog('warning', 'RAM CHOCO trop haute (>450MB), restart...');
        process.exit(1);
    }
}, 30000);

const phoneNumber = config.pairingNumber || config.ownerNumber || "224000000000";

// ================= DATA DEFAULTS CHOCO =================
const DATA_DEFAULTS = {
    'owner.json': [],
    'banned.json': [],
    'premium.json': [],
    'warnings.json': {},
    'notes.json': {},
    'autoAi.json': {},
    'messageCount.json': { isPublic: true, messageCount: {} },
    'userGroupData.json': { users: [], groups: [], antilink: {}, antibadword: {}, antimarabou: {}, antilink_type: {}, antistatut: {}, warnings: {}, sudo: [], welcome: {}, goodbye: {}, chatbot: {}, autoReaction: false, responder: {} },
    'autoStatus.json': { enabled: false },
    'autoread.json': { enabled: false },
    'autotyping.json': { enabled: false },
    'pmblocker.json': { enabled: false },
    'anticall.json': { enabled: false },
    'stealthMode.json': { enabled: false },
    'autoBio.json': { enabled: false, customBio: null },
    'autoReaction.json': { enabled: false },
    'antidelete.json': { enabled: false },
    'antilink.json': {},
    'antibadword.json': {},
    'antimarabou.json': {},
    'responder.json': {},
    'antistatut.json': {},
};

fs.mkdirSync('./data', { recursive: true });
for (const [file, def] of Object.entries(DATA_DEFAULTS)) {
    const fp = `./data/${file}`;
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, JSON.stringify(def, null, 2));
}

let owner = [];
try { owner = JSON.parse(fs.readFileSync('./data/owner.json', 'utf-8')); }
catch { owner = []; }

global.botname = config.botName || "CHOCO-ITACHI-V2";
global.themeemoji = "🍫";

const pairingCode =!process.argv.includes("--qr-code");
const useMobile = process.argv.includes("--mobile");

let rl = null;
let rlClosed = false;
if (process.stdin.isTTY &&!config.pairingNumber) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('close', () => { rlClosed = true; });
}
const question = (text) => {
    if (rl &&!rlClosed) return new Promise((resolve) => rl.question(text, resolve));
    else return Promise.resolve(config.ownerNumber || phoneNumber);
};

process.on('exit', () => { if (rl &&!rlClosed) rl.close(); });
process.on('SIGINT', () => { if (rl &&!rlClosed) rl.close(); process.exit(0); });

function ensureSessionDirectory() {
    const sessionPath = path.join(__dirname, 'session');
    if (!existsSync(sessionPath)) mkdirSync(sessionPath, { recursive: true });
    return sessionPath;
}

function hasValidSession() {
    try {
        const credsPath = path.join(__dirname, 'session', 'creds.json');
        if (!existsSync(credsPath)) return false;
        const fileContent = fs.readFileSync(credsPath, 'utf8');
        if (!fileContent || fileContent.trim().length === 0) return false;
        try {
            const creds = JSON.parse(fileContent);
            if (!creds.noiseKey ||!creds.signedIdentityKey ||!creds.signedPreKey) return false;
            if (creds.registered === false) {
                try { rmSync(path.join(__dirname, 'session'), { recursive: true, force: true }); } catch {}
                return false;
            }
            printLog('success', 'Session CHOCO valide trouvée 😈');
            return true;
        } catch { return false; }
    } catch (error) {
        printLog('error', `Session check: ${error.message}`);
        return false;
    }
}

async function initializeSession() {
    ensureSessionDirectory();
    const txt = config.sessionId;
    if (!txt) {
        if (hasValidSession()) return true;
        return false;
    }
    if (hasValidSession()) return true;
    try {
        await SaveCreds(txt);
        await delay(2000);
        if (hasValidSession()) {
            printLog('success', 'Session CHOCO vérifiée 😈');
            await delay(1000);
            return true;
        } else return false;
    } catch (error) {
        printLog('error', `Erreur session: ${error.message}`);
        return false;
    }
}

server.listen(PORT, () => {
    printLog('success', `CHOCO Server sur port ${PORT} 🍫`);
});

async function startChoco() {
    try {
        const { version } = await fetchLatestBaileysVersion();
        ensureSessionDirectory();
        await delay(1000);
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);
        const _saveCreds = async () => { ensureSessionDirectory(); await saveCreds(); };
        const msgRetryCounterCache = new NodeCache();
        const ghostMode = await store.getSetting('global', 'stealthMode');
        const isGhostActive = ghostMode && ghostMode.enabled;

        const ChocoSock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            browser: Browsers.macOS('Chrome'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect:!isGhostActive,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                const jid = jidNormalizedUser(key.remoteJid);
                const msg = await store.loadMessage(jid, key.id);
                return msg?.message || "";
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        });

        ChocoSock.store = store;

        // Ghost mode hooks
        const originalSendPresenceUpdate = ChocoSock.sendPresenceUpdate;
        const originalReadMessages = ChocoSock.readMessages;
        const originalSendReceipt = ChocoSock.sendReceipt;
        ChocoSock.sendPresenceUpdate = async function (...args) {
            const gm = await store.getSetting('global', 'stealthMode');
            if (gm?.enabled) return;
            return originalSendPresenceUpdate.apply(this, args);
        };
        ChocoSock.readMessages = async function (...args) {
            const gm = await store.getSetting('global', 'stealthMode');
            if (gm?.enabled) return;
            return originalReadMessages.apply(this, args);
        };
        if (originalSendReceipt) {
            ChocoSock.sendReceipt = async function (...args) {
                const gm = await store.getSetting('global', 'stealthMode');
                if (gm?.enabled) return;
                return originalSendReceipt.apply(this, args);
            };
        }
        const originalQuery = ChocoSock.query;
        ChocoSock.query = async function (node,...args) {
            const gm = await store.getSetting('global', 'stealthMode');
            if (gm?.enabled && node?.tag === 'receipt') return;
            return originalQuery.apply(this, [node,...args]);
        };
        ChocoSock.isGhostMode = async () => {
            const gm = await store.getSetting('global', 'stealthMode');
            return gm?.enabled;
        };

        ChocoSock.ev.on('creds.update', _saveCreds);
        store.bind(ChocoSock.ev);

        ChocoSock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.message) return;
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')? mek.message.ephemeralMessage.message : mek.message;
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    await handleStatus(ChocoSock, chatUpdate); return;
                }
                if (!ChocoSock.public &&!mek.key.fromMe && chatUpdate.type === 'notify') {
                    if (!mek.key?.remoteJid?.endsWith('@g.us')) return;
                }
                if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
                if (ChocoSock?.msgRetryCounterCache) ChocoSock.msgRetryCounterCache.clear();
                try { await handleMessages(ChocoSock, chatUpdate); }
                catch (err) {
                    printLog('error', `handleMessages: ${err.message}`);
                    if (mek.key?.remoteJid) {
                        await ChocoSock.sendMessage(mek.key.remoteJid, { text: '❌ Erreur CHOCO 😈',...global.channelInfo }).catch(()=>{});
                    }
                }
            } catch (err) { printLog('error', `messages.upsert: ${err.message}`); }
        });

        ChocoSock.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {};
                return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
            } else return jid;
        };

        ChocoSock.ev.on('contacts.update', (update) => {
            for (const contact of update) {
                const id = ChocoSock.decodeJid(contact.id);
                if (store?.contacts) store.contacts[id] = { id, name: contact.notify };
            }
        });

        ChocoSock.getName = (jid, withoutContact = false) => {
            const id = ChocoSock.decodeJid(jid);
            withoutContact = ChocoSock.withoutContact || withoutContact;
            let v;
            if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
                v = store.contacts[id] || {};
                if (!(v.name || v.subject)) v = ChocoSock.groupMetadata(id) || {};
                resolve(v.name || v.subject || PhoneNumber(`+${id.replace('@s.whatsapp.net', '')}`).number?.international);
            });
            else v = id === '0@s.whatsapp.net'? { id, name: 'WhatsApp' } : id === ChocoSock.decodeJid(ChocoSock.user.id)? ChocoSock.user : (store.contacts[id] || {});
            return (withoutContact? '' : v.name) || v.subject || v.verifiedName || PhoneNumber(`+${jid.replace('@s.whatsapp.net', '')}`).number?.international;
        };

        ChocoSock.public = true;
        ChocoSock.serializeM = (m) => smsg(ChocoSock, m, store);

        const isRegistered = state.creds?.registered === true;
        if (pairingCode &&!isRegistered) {
            if (useMobile) throw new Error('Cannot use pairing code with mobile');
            let phoneNumberInput;
            if (config.pairingNumber) phoneNumberInput = config.pairingNumber;
            else if (process.env.PAIRING_NUMBER) phoneNumberInput = process.env.PAIRING_NUMBER;
            else if (rl &&!rlClosed) phoneNumberInput = await question(chalk.bgBlack(chalk.greenBright(`Entre ton num WhatsApp CHOCO 😈\nFormat: 224000000000 : `)));
            else phoneNumberInput = phoneNumber;

            phoneNumberInput = phoneNumberInput.replace(/[^0-9]/g, '');
            const pn = PhoneNumber(`+${phoneNumberInput}`);
            if (!pn.valid) {
                printLog('error', 'Numéro invalide');
                if (rl &&!rlClosed) rl.close();
                process.exit(1);
            }
            const doPairing = async (num) => {
                try {
                    let code = await ChocoSock.requestPairingCode(num);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log(chalk.black(chalk.bgGreen(`Ton Code Pairing CHOCO : `)), chalk.black(chalk.white(code)));
                    if (rl &&!rlClosed) { rl.close(); rl = null; }
                } catch (error) {
                    printLog('error', `Pairing fail: ${error.message}`);
                }
            };
            setTimeout(() => doPairing(phoneNumberInput), 3000);
        } else {
            if (rl &&!rlClosed) { rl.close(); rl = null; }
        }

        ChocoSock.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect, qr } = s;
            if (qr &&!pairingCode) {
                try { console.log(await QRCode.toString(qr, { type: 'terminal', small: true })); }
                catch { console.log('QR:', qr); }
            }
            if (connection === "open") {
                printLog('success', 'CHOCO-ITACHI-V2 Connecté! 🍫😈');
                try {
                    const setbioModule = await import('./plugins/setbio.js');
                    const startAutoBio = setbioModule.startAutoBio || setbioModule.default?.startAutoBio;
                    if (typeof startAutoBio === 'function') startAutoBio(ChocoSock);
                } catch {}
                const ghostMode = await store.getSetting('global', 'stealthMode');
                const ghostStatus = (ghostMode?.enabled)? '\n👻 Stealth: ACTIVE' : '';
                try {
                    const botNumber = `${ChocoSock.user.id.split(':')[0]}@s.whatsapp.net`;
                    await ChocoSock.sendMessage(botNumber, {
                        text: `🍫 *CHOCO-ITACHI-V2 Connecté!* 😈\n\n⏰ ${new Date().toLocaleString()}\n✅ CHOCO prêt!${ghostStatus}`,
                    });
                } catch {}
                await delay(1999);
                try { owner = JSON.parse(fs.readFileSync('./data/owner.json', 'utf-8')); } catch {}
                printLog('info', `[ ${config.botName} ]`);
                printLog('info', `WA NUMBER : ${owner[0] || config.ownerNumber}`);
                printLog('success', `CHOCO Connecté!`);
                printLog('info', `Plugins : ${commandHandler.commands.size}`);
                printLog('info', `Prefixes : ${config.prefixes.join(', ')}`);
                printLog('store', `Backend : ${store.getStats().backend}`);
                console.log();
            }
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode!== DisconnectReason.loggedOut && statusCode!== 401;
                if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                    try { rmSync('./session', { recursive: true, force: true }); } catch {}
                    await delay(3000); startChoco(); return;
                }
                if (shouldReconnect) {
                    printLog('connection', 'Reconnexion CHOCO dans 5s...');
                    await delay(5000); startChoco();
                }
            }
        });

        ChocoSock.ev.on('call', async (calls) => { await handleCall(ChocoSock, calls); });
        ChocoSock.ev.on('group-participants.update', async (u) => { await handleGroupParticipantUpdate(ChocoSock, u); });
        ChocoSock.ev.on('status.update', async (status) => { await handleStatus(ChocoSock, status); });
        ChocoSock.ev.on('messages.reaction', async (reaction) => { await handleStatus(ChocoSock, reaction); });

        return ChocoSock;
    } catch (error) {
        printLog('error', `startChoco: ${error.message}`);
        if (rl &&!rlClosed) { rl.close(); rl = null; }
        await delay(5000); startChoco();
    }
}

async function main() {
    await compileAll();
    await commandHandler.loadCommands();
    printLog('info', 'Démarrage CHOCO-ITACHI-V2 🍫😈...');
    await initializeSession();
    await delay(3000);
    startChoco().catch((error) => {
        printLog('error', `Fatal: ${error.message}`);
        if (rl &&!rlClosed) rl.close();
        process.exit(1);
    });
}
main();

// Cleanup session
const sessionDir = path.join(process.cwd(), 'session');
setInterval(() => {
    if (!fs.existsSync(sessionDir)) return;
    fs.readdir(sessionDir, (err, files) => {
        if (err) return;
        for (const file of files) {
            if (file === 'creds.json') continue;
            if (file.startsWith('app-state-sync-key-')) continue;
            fs.unlink(path.join(sessionDir, file), () => {});
        }
    });
}, 3 * 60 * 1000);

// Temp folder
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp; process.env.TEMP = customTemp; process.env.TMP = customTemp;

setInterval(() => {
    fs.readdir(customTemp, (err, files) => {
        if (err) return;
        for (const file of files) {
            const fp = path.join(customTemp, file);
            fs.stat(fp, (err, stats) => {
                if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) fs.unlink(fp, () => {});
            });
        }
    });
}, 1 * 60 * 60 * 1000);

// Syntax check
const folders = [path.join(__dirname, './lib'), path.join(__dirname, './plugins')];
folders.forEach(folder => {
    if (!fs.existsSync(folder)) return;
    fs.readdirSync(folder).filter(f => f.endsWith('.js')).forEach(file => {
        const fp = path.join(folder, file);
        try {
            const code = fs.readFileSync(fp, 'utf-8');
            const err = syntaxerror(code, file, { sourceType: 'module', allowAwaitOutsideFunction: true });
            if (err) console.error(chalk.red(`❌ Syntax CHOCO ${fp}:\n${err}`));
        } catch (e) { console.error(chalk.yellow(`⚠️ Cannot read ${fp}:\n${e}`)); }
    });
});

process.on('uncaughtException', (err) => {
    printLog('error', `Uncaught: ${err.message}`);
    writeErrorLog({ type: 'uncaughtException', error: err.message, stack: err.stack, timestamp: new Date().toISOString() });
});
process.on('unhandledRejection', (err) => {
    printLog('error', `Rejection: ${err.message}`);
    writeErrorLog({ type: 'unhandledRejection', error: err.message, stack: err.stack, timestamp: new Date().toISOString() });
});
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        printLog('error', `Port ${PORT} utilisé`);
        server.close();
    } else printLog('error', `Server: ${error.message}`);
});