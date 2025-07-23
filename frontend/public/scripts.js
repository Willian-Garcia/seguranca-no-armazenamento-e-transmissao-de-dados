let publicKeyRSA = null;
let csrfToken = null;
const API_URL = "https://localhost:3000"; // Backend

// ====================== UTILITÁRIOS ======================
async function generateAESKey() {
  console.log("[DEBUG] Gerando chave AES...");
  return crypto.subtle.generateKey({ name: "AES-CBC", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

async function encryptAES(key, data) {
  if (!key) throw new Error("Chave AES não encontrada!");
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encoded = new TextEncoder().encode(data);
  console.log("[DEBUG] Criptografando dado com AES:", data);

  try {
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      key,
      encoded
    );
    return {
      cipher: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv)),
    };
  } catch (error) {
    console.error("Erro ao criptografar com AES:", error);
    throw error;
  }
}

// ✅ Criptografa chave AES + IV com RSA
async function encryptAESKeyWithRSA(aesKey, iv) {
  if (!publicKeyRSA) throw new Error("Chave pública RSA não carregada!");
  console.log("[DEBUG] Exportando chave AES para criptografia com RSA...");

  const rawKey = await crypto.subtle.exportKey("raw", aesKey);

  // ✅ Concatenar AES key (32 bytes) + IV (16 bytes)
  const combined = new Uint8Array(rawKey.byteLength + iv.byteLength);
  combined.set(new Uint8Array(rawKey), 0);
  combined.set(iv, rawKey.byteLength);

  try {
    const encrypted = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKeyRSA,
      combined
    );
    console.log("[DEBUG] Chave AES + IV criptografados com RSA.");
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  } catch (error) {
    console.error("Erro ao criptografar chave AES com RSA:", error);
    throw error;
  }
}

// ✅ Buscar chave pública RSA e CSRF token
async function fetchPublicKey() {
  if (publicKeyRSA) return; // Evita requisições desnecessárias
  console.log("[DEBUG] Buscando chave pública RSA do servidor...");
  try {
    const res = await fetch(`${API_URL}/api/public-key`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Erro ao buscar chave pública: ${res.status}`);
    const keyPem = await res.text();
    publicKeyRSA = await importPublicKey(keyPem);
    csrfToken = getCookie("XSRF-TOKEN");
    console.log("[DEBUG] Chave pública carregada com sucesso.");
  } catch (error) {
    console.error("Erro ao buscar chave pública RSA:", error);
    throw error;
  }
}

// ✅ Importar chave pública RSA
async function importPublicKey(pem) {
  console.log(
    "[DEBUG] Convertendo chave pública PEM para formato WebCrypto..."
  );
  const b64 = pem.replace(/-----.*-----/g, "").replace(/\s+/g, "");
  const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "spki",
    binary.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

// ✅ Obter cookie CSRF
function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

// ====================== REGISTRO ======================
async function registerUser() {
  try {
    await fetchPublicKey();
    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value.trim();

    if (!username || !password) {
      alert("Preencha todos os campos.");
      return;
    }

    console.log(
      "[DEBUG] Iniciando processo de registro para usuário:",
      username
    );

    const aesKey = await generateAESKey();
    const iv = crypto.getRandomValues(new Uint8Array(16)); // IV global para descriptografia no backend
    const encryptedAESKey = await encryptAESKeyWithRSA(aesKey, iv);

    const encUsername = await encryptAES(aesKey, username);
    const encPassword = await encryptAES(aesKey, password);

    const payload = {
      encryptedKey: encryptedAESKey,
      username: encUsername,
      password: encPassword,
    };

    const res = await fetch(`${API_URL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await res.json();
    document.getElementById("status").innerText = data.message || data.error;
  } catch (error) {
    console.error("Erro no registro:", error);
    alert("Erro ao registrar. Verifique o console.");
  }
}

// ====================== LOGIN ======================
async function loginUser() {
  try {
    await fetchPublicKey();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!username || !password) {
      alert("Preencha todos os campos.");
      return;
    }

    console.log("[DEBUG] Tentando login do usuário:", username);

    const aesKey = await generateAESKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encryptedAESKey = await encryptAESKeyWithRSA(aesKey, iv);

    const encUsername = await encryptAES(aesKey, username);
    const encPassword = await encryptAES(aesKey, password);

    const payload = {
      encryptedKey: encryptedAESKey,
      username: encUsername,
      password: encPassword,
    };

    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "/contatos";
    } else {
      document.getElementById("status").innerText = data.error;
    }
  } catch (error) {
    console.error("Erro no login:", error);
    alert("Erro ao fazer login. Verifique o console.");
  }
}

// ====================== CONTATOS ======================
async function addContact() {
  try {
    await fetchPublicKey();
    const name = document.getElementById("contactName").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();

    if (!name || !phone) {
      document.getElementById("status").style.color = "red";
      document.getElementById("status").innerText = "Preencha todos os campos.";
      return;
    }

    const aesKey = await generateAESKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encryptedAESKey = await encryptAESKeyWithRSA(aesKey, iv);

    const encName = await encryptAES(aesKey, name);
    const encPhone = await encryptAES(aesKey, phone);

    const payload = {
      encryptedKey: encryptedAESKey,
      name: encName,
      phone: encPhone,
    };

    const res = await fetch(`${API_URL}/api/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await res.json();
    const statusEl = document.getElementById("status");
    statusEl.style.color = data.error ? "red" : "green";
    statusEl.innerText = data.message || data.error;

    if (!data.error) {
      document.getElementById("contactName").value = "";
      document.getElementById("contactPhone").value = "";
      loadContacts();
    }

    setTimeout(() => (statusEl.innerText = ""), 3000);
  } catch (error) {
    console.error("Erro ao adicionar contato:", error);
  }
}

async function loadContacts() {
  try {
    await fetchPublicKey();
    const res = await fetch(`${API_URL}/api/contacts`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await res.json();
    const contactsList = document.getElementById("contactsList");
    contactsList.innerHTML = "";

    if (data.length === 0) {
      contactsList.innerHTML = "<p>Nenhum contato encontrado.</p>";
      return;
    }

    data.forEach((contact) => {
      const contactItem = document.createElement("div");
      contactItem.className = "contact-item";
      contactItem.innerHTML = `
                <div class="contact-info">
                    <strong>Nome:</strong> (Cripto) ${
                      contact.name
                    } | (Descriptografado simulado) ${"***"}<br>
                    <strong>Telefone:</strong> (Cripto) ${
                      contact.phone
                    } | (Descriptografado simulado) ${"***"}
                </div>
                <div class="contact-actions">
                    <button onclick="editContact(${contact.id}, '${
        contact.name
      }', '${contact.phone}')">Atualizar</button>
                    <button onclick="removeContact(${
                      contact.id
                    })">Excluir</button>
                </div>
            `;
      contactsList.appendChild(contactItem);
    });
  } catch (error) {
    console.error("Erro ao carregar contatos:", error);
  }
}
// Função para habilitar modo de edição
function editContact(id, encryptedName, encryptedPhone) {
  document.getElementById("contactName").value =
    "[Necessário descriptografar ou editar manual]";
  document.getElementById("contactPhone").value =
    "[Necessário descriptografar ou editar manual]";

  const addButton = document.getElementById("addButton");
  addButton.textContent = "Atualizar Contato";
  addButton.onclick = () => updateContact(id);
}

// Função para atualizar contato
async function updateContact(id) {
  try {
    await fetchPublicKey();
    const name = document.getElementById("contactName").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();

    if (!name || !phone) {
      document.getElementById("status").style.color = "red";
      document.getElementById("status").innerText = "Preencha todos os campos.";
      return;
    }

    // Criptografa os dados novamente
    const aesKey = await generateAESKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encryptedAESKey = await encryptAESKeyWithRSA(aesKey, iv);

    const encName = await encryptAES(aesKey, name);
    const encPhone = await encryptAES(aesKey, phone);

    const payload = {
      encryptedKey: encryptedAESKey,
      name: encName,
      phone: encPhone,
    };

    const res = await fetch(`${API_URL}/api/contacts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await res.json();
    const statusEl = document.getElementById("status");
    statusEl.style.color = data.error ? "red" : "green";
    statusEl.innerText = data.message || data.error;

    if (!data.error) {
      document.getElementById("contactName").value = "";
      document.getElementById("contactPhone").value = "";
      const addButton = document.getElementById("addButton");
      addButton.textContent = "Adicionar Contato";
      addButton.onclick = addContact;
      loadContacts();
    }

    setTimeout(() => (statusEl.innerText = ""), 3000);
  } catch (error) {
    console.error("Erro ao atualizar contato:", error);
  }
}

// Função para excluir contato
async function removeContact(id) {
  if (!confirm("Deseja realmente excluir este contato?")) return;

  try {
    const res = await fetch(`${API_URL}/api/contacts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
        "x-csrf-token": csrfToken,
      },
      credentials: "include",
    });

    const data = await res.json();
    const statusEl = document.getElementById("status");
    statusEl.style.color = data.error ? "red" : "green";
    statusEl.innerText = data.message || data.error;

    if (!data.error) {
      loadContacts();
    }

    setTimeout(() => (statusEl.innerText = ""), 3000);
  } catch (error) {
    console.error("Erro ao excluir contato:", error);
  }
}
window.onload = () => {
  loadContacts();
};
