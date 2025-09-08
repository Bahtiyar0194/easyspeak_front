function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
// utils/amountToWords.js
function amountToWords(input, { locale, currency }) {
    // 1) нормализуем вход
    const normalized = String(input)
        .replace(/\s+/g, '')   // убираем пробелы в разрядах
        .replace(',', '.');    // поддержка "12 000,50"

    if (!/^\d+(\.\d+)?$/.test(normalized)) {
        throw new Error('Неверный формат числа. Пример: "12000.50" или "12 000,50"');
    }

    const [intStrRaw, fracStrRaw = '0'] = normalized.split('.');
    const intStr = String(parseInt(intStrRaw, 10)); // убираем лидирующие нули
    const fracStr = (fracStrRaw + '00').slice(0, 2); // всегда 2 знака

    const intNum = Number(intStr);
    const fracNum = Number(fracStr);

    if (intNum > 999999999999) {
        throw new Error('Слишком большое число (макс. 999 999 999 999.99)');
    }

    if (locale === 'ru') {
        return ruAmountToWords(intNum, fracNum, currency);
    } else if (locale === 'kk') {
        return kkAmountToWords(intNum, fracNum, currency);
    }
}

/* ========================= RU ========================= */

const RU_ONES_MALE = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const RU_ONES_FEMALE = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const RU_TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const RU_TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const RU_HUND = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

function ruDeclension(n, forms) {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n100 >= 11 && n100 <= 14) return forms[2];
    if (n10 === 1) return forms[0];
    if (n10 >= 2 && n10 <= 4) return forms[1];
    return forms[2];
}

function ruTriadToWords(num, female) {
    const words = [];
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const o = num % 10;

    if (h) words.push(RU_HUND[h]);
    if (t > 1) {
        words.push(RU_TENS[t]);
        if (o) words.push((female ? RU_ONES_FEMALE : RU_ONES_MALE)[o]);
    } else if (t === 1) {
        words.push(RU_TEENS[o]);
    } else if (o) {
        words.push((female ? RU_ONES_FEMALE : RU_ONES_MALE)[o]);
    }

    return words.join(' ').trim();
}

function numberToWordsRu(n) {
    if (n === 0) return 'ноль';

    const parts = [];
    const scales = [
        { female: false, forms: ['', '', ''] },
        { female: true, forms: ['тысяча', 'тысячи', 'тысяч'] },
        { female: false, forms: ['миллион', 'миллиона', 'миллионов'] },
        { female: false, forms: ['миллиард', 'миллиарда', 'миллиардов'] }
    ];

    let i = 0;
    let rest = n;
    while (rest > 0 && i < scales.length) {
        const triad = rest % 1000;
        if (triad) {
            const words = ruTriadToWords(triad, scales[i].female);
            const suffix = scales[i].forms[0] === '' ? '' : ' ' + ruDeclension(triad, scales[i].forms);
            parts.unshift(words + suffix);
        }
        rest = Math.floor(rest / 1000);
        i++;
    }

    return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function ruAmountToWords(intNum, fracNum, currency) {
    const RU_CURRENCY = {
        RUB: { majorForms: ['рубль', 'рубля', 'рублей'], minorForms: ['копейка', 'копейки', 'копеек'] },
        USD: { majorForms: ['доллар', 'доллара', 'долларов'], minorForms: ['цент', 'цента', 'центов'] },
        KZT: { majorForms: 'invariable', minorForms: ['тиын', 'тиына', 'тиынов'] }
    };

    const cur = RU_CURRENCY[currency];
    const intWords = numberToWordsRu(intNum);
    const intUnit = cur.majorForms === 'invariable' ? 'тенге' : ruDeclension(intNum, cur.majorForms);
    const fracUnit = ruDeclension(fracNum, cur.minorForms);
    const fracStr = String(fracNum).padStart(2, '0');

    return `${intWords} ${intUnit} ${fracStr} ${fracUnit}`.trim();
}

/* ========================= KK ========================= */

const KK_ONES = ['', 'бір', 'екі', 'үш', 'төрт', 'бес', 'алты', 'жеті', 'сегіз', 'тоғыз'];
const KK_TENS = ['', 'он', 'жиырма', 'отыз', 'қырық', 'елу', 'алпыс', 'жетпіс', 'сексен', 'тоқсан'];
const KK_HUND = ['', 'жүз', 'екі жүз', 'үш жүз', 'төрт жүз', 'бес жүз', 'алты жүз', 'жеті жүз', 'сегіз жүз', 'тоғыз жүз'];

function kkTriadToWords(num) {
    const words = [];
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const o = num % 10;

    if (h) words.push(KK_HUND[h]);
    if (t) words.push(KK_TENS[t]);
    if (o) words.push(KK_ONES[o]);

    return words.join(' ').trim();
}

function numberToWordsKk(n) {
    if (n === 0) return 'нөл';

    const parts = [];
    const scales = ['', 'мың', 'миллион', 'миллиард'];

    let i = 0;
    let rest = n;
    while (rest > 0 && i < scales.length) {
        const triad = rest % 1000;
        if (triad) {
            const chunk = kkTriadToWords(triad);
            const suffix = scales[i] ? ' ' + scales[i] : '';
            parts.unshift(chunk + suffix);
        }
        rest = Math.floor(rest / 1000);
        i++;
    }

    return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function kkAmountToWords(intNum, fracNum, currency) {
    const fracStr = String(fracNum).padStart(2, '0');
    let major = 'теңге';
    let minor = 'тиын';

    if (currency === 'RUB') { major = 'рубль'; minor = 'копейка'; }
    if (currency === 'USD') { major = 'доллар'; minor = 'цент'; }

    const intWords = numberToWordsKk(intNum);
    return `${intWords} ${major} ${fracStr} ${minor}`.trim();
}

/* ====================== Удобный экспорт ====================== */
function formatAmountToWords(value, locale, currency) {
    return capitalize(amountToWords(value, { locale, currency }))
}

export { formatAmountToWords };