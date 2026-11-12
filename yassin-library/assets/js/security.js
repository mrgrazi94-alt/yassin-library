const STORE_CONFIG = {
    whatsapp: "9647752742334",
    freeShippingThreshold: 50000,
    adminHash: "6051fc84a7a0d74c225fb18a496b09952da5642e60723ecae543298edd7d82d6"
};

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = String(str ?? '');
    return temp.innerHTML;
}

function isValidIraqiPhone(phone) {
    return /^07[3-9][0-9]{8}$/.test(phone);
}
