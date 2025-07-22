let publicKeyRSA = null;
let csrfToken = null;
const API_URL = 'https://localhost:3000'; // Backend HTTPS

// ====================== Funções utilitárias ======================
async function generateAESKey() {
    console.log('[DEBUG] Gerando chave AES...');
    return crypto.subtle.generateKey({ name: "AES-CBC", length: 256 }, true, ["encrypt", "decrypt"]);
}

async function encryptAES(key, data) {
    if (!key) throw new Error('Chave AES não encontrada!');
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encoded = new TextEncoder().encode(data);
    console.log('[DEBUG] Criptografando dado com AES:', data);

    try {
        const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, encoded);
        return {
            cipher: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
            iv: btoa(String.fromCharCode(...iv))
        };
    } catch (error) {
        console.error('Erro ao criptografar com AES:', error);
        throw error;
    }
}

async function encryptAESKeyWithRSA(aesKey) {
    if (!publicKeyRSA) throw new Error('Chave pública RSA não carregada!');
    console.log('[DEBUG] Exportando chave AES para criptografia com RSA...');
    const rawKey = await crypto.subtle.exportKey('raw', aesKey);

    try {
        const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKeyRSA, rawKey);
        console.log('[DEBUG] Chave AES criptografada com RSA.');
        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    } catch (error) {
        console.error('Erro ao criptografar chave AES com RSA:', error);
        throw error;
    }
}

async function fetchPublicKey() {
    if (publicKeyRSA) return; // Evita requisições desnecessárias
    console.log('[DEBUG] Buscando chave pública RSA do servidor...');
    try {
        const res = await fetch(`${API_URL}/api/public-key`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Erro ao buscar chave pública: ${res.status}`);
        const keyPem = await res.text();
        publicKeyRSA = await importPublicKey(keyPem);
        csrfToken = getCookie('XSRF-TOKEN');
        console.log('[DEBUG] Chave pública carregada com sucesso.');
    } catch (error) {
        console.error('Erro ao buscar chave pública RSA:', error);
        throw error;
    }
}

async function importPublicKey(pem) {
    console.log('[DEBUG] Convertendo chave pública PEM para formato WebCrypto...');
    const b64 = pem.replace(/-----.*-----/g, '').replace(/\s+/g, '');
    const binary = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
        'spki',
        binary.buffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt']
    );
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

// ====================== Funções principais ======================
async function registerUser() {
    try {
        await fetchPublicKey();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value.trim();

        if (!username || !password) {
            alert('Preencha todos os campos.');
            return;
        }

        console.log('[DEBUG] Iniciando processo de registro para usuário:', username);

        const aesKey = await generateAESKey();
        const encryptedAESKey = await encryptAESKeyWithRSA(aesKey);
        const encUsername = await encryptAES(aesKey, username);
        const encPassword = await encryptAES(aesKey, password);

        const payload = {
            encryptedKey: encryptedAESKey,
            username: encUsername,
            password: encPassword
        };

        const res = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await res.json();
        document.getElementById('status').innerText = data.message || data.error;
    } catch (error) {
        console.error('Erro no registro:', error);
        alert('Erro ao registrar. Verifique o console.');
    }
}

async function loginUser() {
    try {
        await fetchPublicKey();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!username || !password) {
            alert('Preencha todos os campos.');
            return;
        }

        console.log('[DEBUG] Tentando login do usuário:', username);

        const aesKey = await generateAESKey();
        const encryptedAESKey = await encryptAESKeyWithRSA(aesKey);
        const encUsername = await encryptAES(aesKey, username);
        const encPassword = await encryptAES(aesKey, password);

        const payload = {
            encryptedKey: encryptedAESKey,
            username: encUsername,
            password: encPassword
        };

        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = '/contatos';
        } else {
            document.getElementById('status').innerText = data.error;
        }
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao fazer login. Verifique o console.');
    }
}

async function addContact() {
    try {
        await fetchPublicKey();
        const name = document.getElementById('contactName').value.trim();
        const phone = document.getElementById('contactPhone').value.trim();

        if (!name || !phone) {
            alert('Preencha todos os campos.');
            return;
        }

        console.log('[DEBUG] Adicionando contato:', name);

        const aesKey = await generateAESKey();
        const encryptedAESKey = await encryptAESKeyWithRSA(aesKey);
        const encName = await encryptAES(aesKey, name);
        const encPhone = await encryptAES(aesKey, phone);

        const payload = {
            encryptedKey: encryptedAESKey,
            name: encName,
            phone: encPhone
        };

        const res = await fetch(`${API_URL}/api/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await res.json();
        alert(data.message || data.error);
    } catch (error) {
        console.error('Erro ao adicionar contato:', error);
        alert('Erro ao adicionar contato. Verifique o console.');
    }
}
