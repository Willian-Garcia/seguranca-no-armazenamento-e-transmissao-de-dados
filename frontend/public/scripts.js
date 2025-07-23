let publicKeyRSA = null;
let csrfToken = null;
const API_URL = "https://localhost:3000"; // Backend

// ====================== UTILITÁRIOS ======================
async function generateAESKey() {
  return crypto.subtle.generateKey({ name: "AES-CBC", length: 256 }, true, ["encrypt", "decrypt"]);
}

async function encryptAES(key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encoded = new TextEncoder().encode(data);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, encoded);
  return {
    cipher: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

async function encryptAESKeyWithRSA(aesKey, iv) {
  const rawKey = await crypto.subtle.exportKey("raw", aesKey);
  const combined = new Uint8Array(rawKey.byteLength + iv.byteLength);
  combined.set(new Uint8Array(rawKey), 0);
  combined.set(iv, rawKey.byteLength);
  const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKeyRSA, combined);
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

async function fetchPublicKey() {
  if (publicKeyRSA) return;
  const res = await fetch(`${API_URL}/api/public-key`, { credentials: "include" });
  const keyPem = await res.text();
  publicKeyRSA = await importPublicKey(keyPem);
  csrfToken = getCookie("XSRF-TOKEN");
}

async function importPublicKey(pem) {
  const b64 = pem.replace(/-----.*-----/g, "").replace(/\s+/g, "");
  const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("spki", binary.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

// ====================== LOGOUT ======================
function logoutUser() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

// ====================== REGISTRO ======================
async function registerUser() {
  await fetchPublicKey();
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value.trim();

  if (!username || !password) {
    alert("Preencha todos os campos.");
    return;
  }

  const aesKey = await generateAESKey();
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encryptedAESKey = await encryptAESKeyWithRSA(aesKey, iv);
  const encUsername = await encryptAES(aesKey, username);
  const encPassword = await encryptAES(aesKey, password);

  const payload = { encryptedKey: encryptedAESKey, username: encUsername, password: encPassword };

  const res = await fetch(`${API_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const data = await res.json();
  document.getElementById("status").innerText = data.message || data.error;
}

// ====================== LOGIN ======================
async function loginUser() {
  await fetchPublicKey();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!username || !password) {
    alert("Preencha todos os campos.");
    return;
  }

  const aesKey = await generateAESKey();
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encryptedAESKey = await encryptAESKeyWithRSA(aesKey, iv);
  const encUsername = await encryptAES(aesKey, username);
  const encPassword = await encryptAES(aesKey, password);

  const payload = { encryptedKey: encryptedAESKey, username: encUsername, password: encPassword };

  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
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
}

// ====================== CONTATOS ======================
async function addContact() {
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

  const payload = { encryptedKey: encryptedAESKey, name: encName, phone: encPhone };

  const res = await fetch(`${API_URL}/api/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token"), "x-csrf-token": csrfToken },
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
}

async function loadContacts() {
  console.log("Carregando contatos...");
  await fetchPublicKey();
  const res = await fetch(`${API_URL}/api/contacts`, {
    method: "GET",
    headers: { Authorization: "Bearer " + localStorage.getItem("token"), "Content-Type": "application/json" },
    credentials: "include",
  });

  const data = await res.json();
  const contactsList = document.getElementById("contactsList");
  contactsList.innerHTML = "";

  if (!data || data.length === 0) {
    contactsList.innerHTML = "<p>Nenhum contato encontrado.</p>";
    return;
  }

  data.forEach((contact) => {
    const nameDisplay = contact.name.plain
      ? `${contact.name.plain} (${contact.name.encrypted})`
      : `${contact.name.encrypted}`;

    const phoneDisplay = contact.phone.plain
      ? `${contact.phone.plain} (${contact.phone.encrypted})`
      : `${contact.phone.encrypted}`;

    const contactItem = document.createElement("div");
    contactItem.className = "contact-item";
    contactItem.innerHTML = `
      <div class="contact-info">
        <strong>Nome:</strong> ${nameDisplay}<br>
        <strong>Telefone:</strong> ${phoneDisplay}
      </div>
      <div class="contact-actions">
        <button onclick="editContact(${contact.id}, '${contact.name.plain || ""}', '${contact.phone.plain || ""}')">Atualizar</button>
        <button onclick="removeContact(${contact.id})">Excluir</button>
      </div>`;
    contactsList.appendChild(contactItem);
  });
}

// ✅ Preenche inputs ao editar
function editContact(id, plainName = null, plainPhone = null) {
  const nameInput = document.getElementById("contactName");
  const phoneInput = document.getElementById("contactPhone");

  if (plainName && plainPhone) {
    nameInput.value = plainName;
    phoneInput.value = plainPhone;
  } else {
    nameInput.value = "";
    phoneInput.value = "";
    alert("Os valores descriptografados não estão disponíveis. Edite manualmente.");
  }

  const addButton = document.getElementById("addButton");
  addButton.textContent = "Atualizar Contato";
  addButton.onclick = () => updateContact(id);
}

async function updateContact(id) {
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

  const payload = { encryptedKey: encryptedAESKey, name: encName, phone: encPhone };

  const res = await fetch(`${API_URL}/api/contacts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token"), "x-csrf-token": csrfToken },
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
}

async function removeContact(id) {
  if (!confirm("Deseja realmente excluir este contato?")) return;

  const res = await fetch(`${API_URL}/api/contacts/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + localStorage.getItem("token"), "x-csrf-token": csrfToken },
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
}

// ✅ Verificação para disparar loadContacts()
window.onload = () => {
  const currentPage = window.location.pathname;

  if (currentPage.includes("contatos")) {
    if (!localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }
    loadContacts();
  }

  if (currentPage.includes("login") || currentPage === "/") {
    if (localStorage.getItem("token")) {
      window.location.href = "/contatos";
    }
  }

  if (currentPage.includes("register")) {
    if (localStorage.getItem("token")) {
      window.location.href = "/contatos";
    }
  }
};
