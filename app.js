/* global QRCode */

const elText = document.getElementById("text");
const elSize = document.getElementById("size");
const elEcc = document.getElementById("ecc");
const elAsUrl = document.getElementById("asUrl");

const btnGenerate = document.getElementById("btnGenerate");
const btnClear = document.getElementById("btnClear");
const btnDownload = document.getElementById("btnDownload");

const hint = document.getElementById("hint");
const qrWrap = document.getElementById("qrcode");

let qrInstance = null;

function normalizeInput(value) {
  const raw = (value || "").trim();
  if (!raw) return "";

  if (!elAsUrl.checked) return raw;

  // Si parece URL sin esquema, agregamos https://
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw);
  const looksLikeDomain =
    /^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(raw) || raw.startsWith("www.");
  if (!hasScheme && looksLikeDomain) return "https://" + raw.replace(/^www\./, "www.");

  return raw;
}

function eccLevel(letter) {
  const map = {
    L: QRCode.CorrectLevel.L,
    M: QRCode.CorrectLevel.M,
    Q: QRCode.CorrectLevel.Q,
    H: QRCode.CorrectLevel.H,
  };
  return map[letter] ?? QRCode.CorrectLevel.H;
}

function clearQR() {
  qrWrap.innerHTML = "";
  qrInstance = null;
}

function renderQR() {
  const text = normalizeInput(elText.value);
  const size = Math.max(128, Math.min(1024, Number(elSize.value) || 256));
  const ecc = eccLevel(elEcc.value);

  if (!text) {
    hint.textContent = "Escribe un texto o URL para generar el QR.";
    clearQR();
    return;
  }

  hint.textContent = `Generando QR para: ${text}`;

  clearQR();
  qrInstance = new QRCode(qrWrap, {
    text,
    width: size,
    height: size,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: ecc,
  });
}

function getQrDataUrl() {
  const canvas = qrWrap.querySelector("canvas");
  if (canvas) return canvas.toDataURL("image/png");

  const img = qrWrap.querySelector("img");
  if (img && img.src) return img.src;

  return null;
}

function downloadPNG() {
  const text = normalizeInput(elText.value);
  if (!text) {
    hint.textContent = "No hay nada que descargar: primero genera un QR.";
    return;
  }

  const dataUrl = getQrDataUrl();
  if (!dataUrl) {
    hint.textContent = "No encontré el QR para descargar. Genera de nuevo.";
    return;
  }

  const safeName = text
    .slice(0, 40)
    .replace(/https?:\/\//g, "")
    .replace(/[^\w.-]+/g, "_");

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `qr_${safeName || "code"}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  hint.textContent = "Descarga iniciada ✅";
}

// UX: generar al escribir (con debounce)
let t = null;
function debounceRender() {
  clearTimeout(t);
  t = setTimeout(renderQR, 250);
}

btnGenerate.addEventListener("click", renderQR);
btnClear.addEventListener("click", () => {
  elText.value = "";
  hint.textContent = "";
  clearQR();
  elText.focus();
});
btnDownload.addEventListener("click", downloadPNG);

elText.addEventListener("input", debounceRender);
elSize.addEventListener("input", debounceRender);
elEcc.addEventListener("change", renderQR);
elAsUrl.addEventListener("change", renderQR);

// Genera un QR inicial de ejemplo
elText.value = "https://github.com/";
renderQR();
