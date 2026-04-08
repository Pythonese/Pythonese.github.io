function copyText(groupId) {
    const divElement = document.getElementById("view" + groupId);
    const textToCopy = divElement.textContent || divElement.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
        console.log("Text copied to clipboard successfully!");
    }).catch(err => {
        console.error("Could not copy text: ", err);
    });
}

const alphabetEn = {
    'e': 'е',
    'E': 'Е',
    'T': 'Т',
    'o': 'о',
    'O': 'О',
    'p': 'р',
    'P': 'Р',
    'a': 'а',
    'A': 'А',
    // 'K': 'К',
    'x': 'х',
    'X': 'Х',
    'c': 'с',
    'C': 'С',
    'B': 'В',
    'M': 'М',
    'H': 'Н',
    'y': 'у',
};
const alphabetRus = {
    'е': 'e',
    'Е': 'E',
    'Т': 'T',
    'о': 'o',
    'О': 'O',
    'р': 'p',
    'Р': 'P',
    'а': 'a',
    'А': 'A',
    // 'К': 'K',
    'х': 'x',
    'Х': 'X',
    'с': 'c',
    'С': 'C',
    'В': 'B',
    'М': 'M',
    'H': 'Н',
    'у': 'y',
};

function regularTextStegoPack(container, secret, key) {
    console.log('container = ' + container);
    console.log('secret = ' + secret);
    const secret0 = secret.slice(0, Math.floor(key * secret.length));
    const secret1 = secret.slice(Math.floor(key * secret.length), secret.length);
    function pack0(container, secret) {
        let secretI = 0;
        const arr = container.trim().replaceAll('  ', ' ').replaceAll('\n\n', '\n').replaceAll('. ', '.\n').split('.\n');
        const s = arr.map((s, i) => {
            const s1 = s.split(' ').map((w, j) => {
                if (secretI == (secret.length * 8)) {
                    return w + ' ';
                }
                if ((secret[Math.floor(secretI / 8)] >> (secretI & 7)) & 1) {
                    secretI++;
                    console.log('bit 1 by space: ' + w);
                    return w + '  ';
                }
                secretI++;
                console.log('bit 0 by space: ' + w);
                return w + ' ';
            }).join('');
            if (secretI == (secret.length * 8)) {
                if ((s.length ^ i) & 1) {
                    return s1 + '. ';
                }
                return s1 + '.\n';
            }
            if ((secret[Math.floor(secretI / 8)] >> (secretI & 7)) & 1) {
                secretI++;
                console.log('bit 1 by dot: ' + s1);
                return s1 + '. ';
            }
            secretI++;
            console.log('bit 0 by dot: ' + s1);
            return s1 + '.\n';
        }).join('');
        if (secretI == (secret.length * 8)) {
            return s;
        }
        console.log('container is too small for secret in pack0');
    }
    function pack1(container, secret) {
        let secretI = 0;
        const s = container.split('').map((c, i) => {
            if (secretI == (secret.length * 8)) {
                return c;
            }
            if (alphabetEn[c] !== undefined) {
                if ((secret[Math.floor(secretI / 8)] >> (secretI & 7)) & 1) {
                    secretI++;
                    return alphabetEn[c];
                }
                secretI++;
            }
            if (alphabetRus[c] !== undefined) {
                if (!((secret[Math.floor(secretI / 8)] >> (secretI & 7)) & 1)) {
                    secretI++;
                    return alphabetRus[c];
                }
                secretI++;
            }
            return c;
        }).join('');
        if (secretI == (secret.length * 8)) {
            return s;
        }
        console.log('container is too small for secret in pack1');
    }
    return pack1(pack0(container, secret0), secret1);
}

function regularTextStegoUnpack(container, length, key) {
    console.log('container = ' + container);
    console.log('length = ' + length);
    const length0 = Math.floor(key * length);
    const length1 = length - length0;
    function unpack0(container, length) {
        let secretI = 0;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < container.length - 1; i++) {
            if (secretI >= (length * 8)) {
                break;
            }
            if (container[i] == '.') {
                if (container[i + 1] == ' ') {
                    bytes[Math.floor(secretI / 8)] |= 1 << (secretI & 7);
                    secretI++;
                    i++;
                } else if (container[i + 1] == '\n') {
                    // bytes[Math.floor(secretI / 8)] &= ~(1 << (secretI & 7));
                    secretI++;
                    i++;
                }
            } else if (container[i] == ' ') {
                if (container[i + 1] == ' ') {
                    bytes[Math.floor(secretI / 8)] |= 1 << (secretI & 7);
                    secretI++;
                    i++;
                } else {
                    // bytes[Math.floor(secretI / 8)] &= ~(1 << (secretI & 7));
                    secretI++;
                }
            }
        }
        if (secretI == (length * 8)) {
            return (bytes);
        }
        console.log('container is too small for secret in unpack0 ' + bytes);
    }
    function unpack1(container, length) {
        let secretI = 0;
        const bytes = new Uint8Array(length);
        for (let c of container) {
            if (alphabetEn[c] !== undefined) {
                secretI++;
            } else if (alphabetRus[c] !== undefined) {
                bytes[Math.floor(secretI / 8)] |= 1 << (secretI & 7);
                secretI++;
            }
            if (secretI == (length * 8)) {
                break;
            }
        }
        if (secretI == (length * 8)) {
            return bytes;
        }
        console.log('container is too small for secret in unpack1 ' + bytes);
    }
    return new Uint8Array([...unpack0(container, length0), ...unpack1(container, length1)]);
}
