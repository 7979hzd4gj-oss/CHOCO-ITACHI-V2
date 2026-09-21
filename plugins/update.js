import config from '../config.js';
import { channelInfo } from '../lib/messageConfig.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

async function hasGitRepo() {
    const gitDir = path.join(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) return false;
    try { await run('git --version'); return true; } catch { return false; }
}

async function updateViaGit() {
    const oldRev = String(await run('git rev-parse HEAD').catch(() => 'unknown')).trim();
    await run('git fetch --all --prune');
    const newRev = String(await run(`git rev-parse origin/${config.branch || 'main'}`)).trim();
    const alreadyUpToDate = oldRev === newRev;
    const commits = alreadyUpToDate? '' : await run(`git log --pretty=format:"%h %s (%an)" ${oldRev}..${newRev}`).catch(() => '');
    const files = alreadyUpToDate? '' : await run(`git diff --name-status ${oldRev} ${newRev}`).catch(() => '');
    await run(`git reset --hard ${newRev}`);
    await run('git clean -fd');
    return { oldRev, newRev, alreadyUpToDate, commits, files };
}

function downloadFile(url, dest, visited = new Set()) {
    return new Promise((resolve, reject) => {
        try {
            if (visited.has(url) || visited.size > 5) return reject(new Error('Too many redirects'));
            visited.add(url);
            const useHttps = url.startsWith('https://');
            const http = require('http');
            const client = useHttps? https : http;
            const req = client.get(url, { headers: { 'User-Agent': 'CHOCO-Updater/2.0' } }, (res) => {
                if ([301,302,303,307,308].includes(res.statusCode)) {
                    const nextUrl = new URL(res.headers.location, url).toString();
                    res.resume();
                    return downloadFile(nextUrl, dest, visited).then(resolve).catch(reject);
                }
                if (res.statusCode!== 200) return reject(new Error(`HTTP ${res.statusCode}`));
                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => file.close(resolve));
                file.on('error', (err) => { try{file.close(()=>{})}catch{} fs.unlink(dest, ()=>reject(err)); });
            });
            req.on('error', (err) => { fs.unlink(dest, ()=>reject(err)); });
        } catch(e){ reject(e); }
    });
}

async function extractZip(zipPath, outDir) {
    if (process.platform === 'win32') {
        await run(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(/\\/g,'/')}' -Force"`);
        return;
    }
    try { await run('command -v unzip'); await run(`unzip -o '${zipPath}' -d '${outDir}'`); return; } catch{}
    try { await run('command -v 7z'); await run(`7z x -y '${zipPath}' -o'${outDir}'`); return; } catch{}
    throw new Error("No unzip tool found");
}

function copyRecursive(src, dest, ignore = [], relative = '', outList = []) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (ignore.includes(entry)) continue;
        const s = path.join(src, entry), d = path.join(dest, entry);
        const stat = fs.lstatSync(s);
        if (stat.isDirectory()) copyRecursive(s, d, ignore, path.join(relative, entry), outList);
        else { fs.copyFileSync(s, d); if (outList) outList.push(path.join(relative, entry).replace(/\\/g,'/')); }
    }
}

async function updateViaZip(zipOverride) {
    const zipUrl = (zipOverride || config.updateZipUrl || process.env.UPDATE_ZIP_URL || '').trim();
    if (!zipUrl) throw new Error('No ZIP URL. Set UPDATE_ZIP_URL');
    const tmpDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const zipPath = path.join(tmpDir, 'choco_update.zip');
    await downloadFile(zipUrl, zipPath);
    const extractTo = path.join(tmpDir, 'choco_extract');
    if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });
    await extractZip(zipPath, extractTo);
    const [root] = fs.readdirSync(extractTo).map(n=>path.join(extractTo,n));
    const srcRoot = fs.existsSync(root) && fs.lstatSync(root).isDirectory()? root : extractTo;
    const ignore = ['node_modules','.git','session','tmp','temp','data','baileys_store.json'];
    const copied = [];
    copyRecursive(srcRoot, process.cwd(), ignore, '', copied);
    try{ fs.rmSync(extractTo, {recursive:true,force:true}); }catch{}
    try{ fs.rmSync(zipPath, {force:true}); }catch{}
    return { copiedFiles: copied };
}

async function restartProcess() {
    try { if (fs.existsSync('/.dockerenv')) { setTimeout(()=>process.exit(1),500); return; } }catch{}
    try { await run('pm2 restart all'); return; } catch{}
    try {
        const { spawn } = await import('child_process');
        const child = spawn(process.execPath, process.argv.slice(1), { detached:true, stdio:'ignore', cwd:process.cwd(), env:process.env });
        child.unref();
        setTimeout(()=>process.exit(0),1500); return;
    } catch{}
    setTimeout(()=>process.exit(0),500);
}

export default {
    command: 'update',
    aliases: ['upgrade', 'restart', 'maj'],
    category: 'owner',
    description: 'CHOCO Update bot',
    usage: '.update [zip_url]',
    ownerOnly: true,

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO UPDATE* 😈\n\n🔄 *Mise à jour en cours chef...*`,
              ...channelInfo
            }, { quoted: message });

            let changesSummary = '';

            if (await hasGitRepo()) {
                const { oldRev, newRev, alreadyUpToDate, commits, files } = await updateViaGit();
                if (alreadyUpToDate) {
                    changesSummary = `✅ *Déjà à jour chef!*\n📌 ${newRev.substring(0,7)}`;
                } else {
                    changesSummary = `🍫 *CHOCO MIS À JOUR!* 😈\n\n📌 Old: ${oldRev.substring(0,7)}\n📌 New: ${newRev.substring(0,7)}\n\n`;
                    if (commits) {
                        const commitLines = String(commits).split('\n').slice(0,5);
                        changesSummary += `📝 *Commits:*\n${commitLines.map(c=>`• ${c}`).join('\n')}\n\n`;
                    }
                    if (files) {
                        const fileLines = String(files).split('\n').slice(0,10);
                        changesSummary += `📁 *Fichiers:*\n${fileLines.map(f=>`• ${f}`).join('\n')}`;
                    }
                }
                await run('npm install --no-audit --no-fund');
            } else {
                const { copiedFiles } = await updateViaZip(args[0] || null);
                changesSummary = `🍫 *MAJ via ZIP* 😈\n\n📁 ${copiedFiles.length} fichiers\n${copiedFiles.slice(0,10).map(f=>`• ${f}`).join('\n')}`;
            }

            await sock.sendMessage(chatId, {
                text: `${changesSummary}\n\n♻️ *Redémarrage...* 🍫`,
              ...channelInfo
            }, { quoted: message });

            await new Promise(r=>setTimeout(r,1000));
            await restartProcess();

        } catch (err) {
            console.error('[CHOCO UPDATE] fail:', err);
            await sock.sendMessage(chatId, {
                text: `💀 *MAJ échouée chef!*\n${err.message}`,
              ...channelInfo
            }, { quoted: message });
        }
    }
};