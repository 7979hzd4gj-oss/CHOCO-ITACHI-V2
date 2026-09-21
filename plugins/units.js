import { channelInfo } from '../../lib/messageConfig.js';

const UNITS = {
    length: {
        mm: { factor: 0.001, base: 'm', name: 'Millimètre' },
        cm: { factor: 0.01, base: 'm', name: 'Centimètre' },
        m: { factor: 1, base: 'm', name: 'Mètre' },
        km: { factor: 1000, base: 'm', name: 'Kilomètre' },
        in: { factor: 0.0254, base: 'm', name: 'Pouce' },
        ft: { factor: 0.3048, base: 'm', name: 'Pied' },
        yd: { factor: 0.9144, base: 'm', name: 'Yard' },
        mi: { factor: 1609.344, base: 'm', name: 'Mile' },
        nmi: { factor: 1852, base: 'm', name: 'Mile Nautique' },
    },
    weight: {
        mg: { factor: 0.000001, base: 'kg', name: 'Milligramme' },
        g: { factor: 0.001, base: 'kg', name: 'Gramme' },
        kg: { factor: 1, base: 'kg', name: 'Kilogramme' },
        t: { factor: 1000, base: 'kg', name: 'Tonne' },
        oz: { factor: 0.0283495, base: 'kg', name: 'Once' },
        lb: { factor: 0.453592, base: 'kg', name: 'Livre' },
    },
    temperature: {
        c: { factor: 1, base: 'c', name: 'Celsius' },
        f: { factor: 1, base: 'c', name: 'Fahrenheit' },
        k: { factor: 1, base: 'c', name: 'Kelvin' },
    },
    speed: {
        mps: { factor: 1, base: 'mps', name: 'm/s' },
        kph: { factor: 0.277778, base: 'mps', name: 'Km/h' },
        mph: { factor: 0.44704, base: 'mps', name: 'Miles/h' },
        knot: { factor: 0.514444, base: 'mps', name: 'Noeud' },
    },
    data: {
        bit: { factor: 1, base: 'bit', name: 'Bit' },
        byte: { factor: 8, base: 'bit', name: 'Byte' },
        kb: { factor: 8000, base: 'bit', name: 'Kilobyte' },
        mb: { factor: 8e6, base: 'bit', name: 'Megabyte' },
        gb: { factor: 8e9, base: 'bit', name: 'Gigabyte' },
        tb: { factor: 8e12, base: 'bit', name: 'Terabyte' },
    },
    time: {
        s: { factor: 1, base: 's', name: 'Seconde' },
        min: { factor: 60, base: 's', name: 'Minute' },
        hr: { factor: 3600, base: 's', name: 'Heure' },
        day: { factor: 86400, base: 's', name: 'Jour' },
        wk: { factor: 604800, base: 's', name: 'Semaine' },
        yr: { factor: 31557600, base: 's', name: 'Année' },
    },
};

const UNIT_TO_CATEGORY = {};
for (const [cat, units] of Object.entries(UNITS)) {
    for (const sym of Object.keys(units)) UNIT_TO_CATEGORY[sym] = cat;
}

function convertTemperature(value, from, to) {
    let celsius;
    if (from === 'c') celsius = value;
    else if (from === 'f') celsius = (value - 32) * 5/9;
    else celsius = value - 273.15;
    if (to === 'c') return celsius;
    if (to === 'f') return celsius * 9/5 + 32;
    return celsius + 273.15;
}

function convert(value, from, to) {
    from = from.toLowerCase(); to = to.toLowerCase();
    const cat = UNIT_TO_CATEGORY[from];
    if (!cat || UNIT_TO_CATEGORY[to]!== cat) return null;
    if (cat === 'temperature') return { result: convertTemperature(value, from, to), category: cat };
    const base = value * UNITS[cat][from].factor;
    return { result: base / UNITS[cat][to].factor, category: cat };
}

function formatNumber(n) {
    if (Math.abs(n) < 0.0001 || Math.abs(n) >= 1e12) return n.toExponential(4);
    return n.toPrecision(8).replace(/\.?0+$/, '');
}

export default {
    command: 'units',
    aliases: ['convert', 'conv', 'unit', 'conversion'],
    category: 'utility',
    description: 'CHOCO - Convertisseur d\'unités',
    usage: '.units 100 km to mi',

    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const input = args.join(' ').trim().toLowerCase();

        if (!input) {
            return await sock.sendMessage(chatId, {
                text: `🍫 *CHOCO CONVERTISSEUR* 😈\n\n`+
                      `*Usage:* \`.units 100 km to mi\`\n\n`+
                      `*Exemples:*\n`+
                      `• \`.units 100 km to mi\`\n`+
                      `• \`.units 70 kg to lb\`\n`+
                      `• \`.units 37 c to f\`\n`+
                      `• \`.units 1 gb to mb\`\n\n`+
                      `*Catégories:*\n📐 longueur · ⚖️ poids · 🌡️ temp\n💨 vitesse · 💾 data · ⏱️ temps`,
               ...channelInfo
            }, { quoted: message });
        }

        const toIndex = args.findIndex(a => a.toLowerCase() === 'to');
        let value, fromUnit, toUnit;

        if (toIndex === 2 && args.length === 4) {
            value = parseFloat(args[0]); fromUnit = args[1].toLowerCase(); toUnit = args[3].toLowerCase();
        } else if (args.length === 3 && toIndex === -1) {
            value = parseFloat(args[0]); fromUnit = args[1].toLowerCase(); toUnit = args[2].toLowerCase();
        } else {
            return await sock.sendMessage(chatId, {
                text: `💀 *Format invalide chef!*\nUtilise: \`.units 100 km to mi\``,
               ...channelInfo
            }, { quoted: message });
        }

        if (isNaN(value)) {
            return await sock.sendMessage(chatId, { text: `❌ Nombre invalide: \`${args[0]}\``,...channelInfo }, { quoted: message });
        }

        const res = convert(value, fromUnit, toUnit);
        if (!res) {
            return await sock.sendMessage(chatId, {
                text: `💀 *Conversion impossible chef!*\n\`${fromUnit}\` -> \`${toUnit}\` (catégories différentes)`,
               ...channelInfo
            }, { quoted: message });
        }

        const fromName = UNITS[res.category][fromUnit].name;
        const toName = UNITS[res.category][toUnit].name;
        const emoji = { length:'📐', weight:'⚖️', temperature:'🌡️', speed:'💨', data:'💾', time:'⏱️' }[res.category] || '📏';

        await sock.sendMessage(chatId, {
            text: `🍫 ${emoji} *CHOCO CONVERT* 😈\n\n📥 *${value} ${fromName}* (${fromUnit})\n📤 *${formatNumber(res.result)} ${toName}* (${toUnit})\n\n📂 *Cat:* ${res.category}`,
           ...channelInfo
        }, { quoted: message });
    }
};