document.addEventListener('DOMContentLoaded', () => {
    
    // Kamus pengganti simbol khas e2Black
    const cipherMap = {
        'A': '@', 'E': '#', 'I': '$', 'O': '%', 'U': '&',
        'a': '!', 'e': '^', 'i': '?', 'o': '+', 'u': '~'
    };

    const reverseCipherMap = {};
    for (let key in cipherMap) {
        reverseCipherMap[cipherMap[key]] = key;
    }

    // Fungsi pembantu untuk menghitung nilai geser dinamis berdasarkan Key
    function getDynamicShift(key) {
        if (!key) return 3; // Default jika key kosong
        let sum = 0;
        for (let i = 0; i < key.length; i++) {
            sum += key.charCodeAt(i);
        }
        return (sum % 10) + 2; // Menghasilkan angka geser antara 2 sampai 11
    }

    // Fungsi operasi biner XOR untuk mengacak teks asli (Aman untuk UTF-8)
    function xorProcess(text, key) {
        if (!key) return text;
        let result = "";
        for (let i = 0; i < text.length; i++) {
            let textChar = text.charCodeAt(i);
            let keyChar = key.charCodeAt(i % key.length);
            result += String.fromCharCode(textChar ^ keyChar);
        }
        return result;
    }

    // --- ENCODER LOGIC (ANTI-BUG VERSION) ---
    function e2BlackEncode(text, key) {
        if (!text) return '';
        
        // 1. Jalankan proses XOR terlebih dahulu
        let xorText = xorProcess(text, key);

        // 2. Ubah hasil XOR ke Base64 (Menggunakan btoa aman dengan btoa(unescape(encodeURIComponent)))
        let base64 = btoa(unescape(encodeURIComponent(xorText)));

        // 3. Substitusi karakter Base64 murni menggunakan cipherMap
        let substituted = "";
        for (let i = 0; i < base64.length; i++) {
            let char = base64[i];
            substituted += cipherMap[char] || char;
        }

        // 4. Lakukan Shift Cipher secara dinamis berdasarkan nilai Key
        let shiftValue = getDynamicShift(key);
        let finalResult = "";
        const cipherValues = Object.values(cipherMap);

        for (let j = 0; j < substituted.length; j++) {
            let char = substituted[j];
            // Jika karakter adalah simbol hasil kamus atau tanda '=', jangan di-shift!
            if (cipherValues.includes(char) || char === '=') {
                finalResult += char;
            } else {
                finalResult += String.fromCharCode(char.charCodeAt(0) + shiftValue);
            }
        }

        // 5. Ganti tanda "=" menjadi "_" agar tidak kentara Base64 dan anti-tabrakan
        return finalResult.replace(/=/g, '_');
    }

    // --- DECODER LOGIC (ANTI-BUG VERSION) ---
    function e2BlackDecode(cipherText, key) {
        if (!cipherText) return '';

        try {
            // 1. Kembalikan tanda "_" menjadi "=" kembali
            let restoredText = cipherText.replace(/_/g, '=');

            // 2. Kembalikan pergeseran karakter dinamis (Shift minus)
            let shiftValue = getDynamicShift(key);
            let unshiftedText = "";
            const cipherValues = Object.values(cipherMap);

            for (let i = 0; i < restoredText.length; i++) {
                let char = restoredText[i];
                if (cipherValues.includes(char) || char === '=') {
                    unshiftedText += char;
                } else {
                    unshiftedText += String.fromCharCode(char.charCodeAt(0) - shiftValue);
                }
            }

            // 3. Kembalikan simbol kustom ke karakter Base64 asli menggunakan reverseCipherMap
            let base64 = "";
            for (let j = 0; j < unshiftedText.length; j++) {
                let char = unshiftedText[j];
                base64 += reverseCipherMap[char] || char;
            }

            // 4. Decode balik dari Base64 ke teks hasil XOR dengan aman
            let xorText = decodeURIComponent(escape(atob(base64)));

            // 5. Lepaskan acakan XOR menggunakan Key untuk mendapatkan teks asli
            return xorProcess(xorText, key);
        } catch (error) {
            return "[Error] Gagal memecahkan kode. Kunci rahasia salah atau format rusak.";
        }
    }

    // --- HUBUNGKAN KE ELEMEN HTML ---
    const encodeInput = document.getElementById('encode-input');
    const encodeOutput = document.getElementById('encode-output');
    const decodeInput = document.getElementById('decode-input');
    const decodeOutput = document.getElementById('decode-output');
    const secretKeyInput = document.getElementById('secret-key'); 
    
    const btnEncode = document.getElementById('btn-encode');
    const btnDecode = document.getElementById('btn-decode');

    const btnCopyEncode = document.getElementById('btn-copy-encode');
    const btnPasteDecode = document.getElementById('btn-paste-decode');
    const btnCopyDecode = document.getElementById('btn-copy-decode');

    if (btnEncode && btnDecode) {
        btnEncode.addEventListener('click', () => {
            let key = secretKeyInput ? secretKeyInput.value : '';
            encodeOutput.value = e2BlackEncode(encodeInput.value, key);
        });

        btnDecode.addEventListener('click', () => {
            let key = secretKeyInput ? secretKeyInput.value : '';
            decodeOutput.value = e2BlackDecode(decodeInput.value, key);
        });
    }

    // --- FUNGSI KLIK COPY & PASTE ---
    if (btnCopyEncode) {
        btnCopyEncode.addEventListener('click', () => {
            if (encodeOutput.value) {
                navigator.clipboard.writeText(encodeOutput.value).then(() => {
                    let originalText = btnCopyEncode.innerText;
                    btnCopyEncode.innerText = "Copied!";
                    setTimeout(() => btnCopyEncode.innerText = originalText, 2000);
                }).catch(err => console.error("Gagal menyalin: ", err));
            }
        });
    }

    if (btnPasteDecode) {
        btnPasteDecode.addEventListener('click', () => {
            navigator.clipboard.readText().then(text => {
                decodeInput.value = text;
            }).catch(err => console.error("Gagal menempel: ", err));
        });
    }

    if (btnCopyDecode) {
        btnCopyDecode.addEventListener('click', () => {
            if (decodeOutput.value) {
                navigator.clipboard.writeText(decodeOutput.value).then(() => {
                    let originalText = btnCopyDecode.innerText;
                    btnCopyDecode.innerText = "Copied!";
                    setTimeout(() => btnCopyDecode.innerText = originalText, 2000);
                }).catch(err => console.error("Gagal menyalin: ", err));
            }
        });
    }

    // --- LOGIKA HEADER DINAMIS (SCROLL UP / DOWN) ---
    const header = document.querySelector('header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (Math.abs(currentScrollY - lastScrollY) < 10) return; 

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.classList.add('scroll-down');
            header.classList.remove('scroll-up');
        } else if (currentScrollY < lastScrollY) {
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        lastScrollY = currentScrollY;
    });
});
