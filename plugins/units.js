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
        byte: {