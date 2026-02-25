const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const selectBtn = document.getElementById("select-btn");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("preview-img");

let selectedFilePath = null;
let scannedNotes = [];

// ---- Drag & Drop ----

listen('tauri://drag-drop', (event) => {
  const filePath = event.payload.paths?.[0] || event.payload[0];
  if (filePath) showPreviewFromPath(filePath);
});

listen('tauri://drag-enter', () => dropZone.classList.add("dragover"));
listen('tauri://drag-leave', () => dropZone.classList.remove("dragover"));

// ---- Image selection ----

selectBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) showPreview(file);
});

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    preview.classList.remove("hidden");
    selectedFilePath = file.path;
  };
  reader.readAsDataURL(file);
}

async function showPreviewFromPath(filePath) {
  const { convertFileSrc } = window.__TAURI__.core;
  previewImg.src = convertFileSrc(filePath);
  preview.classList.remove("hidden");
  selectedFilePath = filePath;
}

// ---- OCR ----

document.getElementById("ocr-btn").addEventListener("click", async () => {
  if (!selectedFilePath) return alert("Please select an image first!");
  try {
    await invoke("run_tesseract", { path: selectedFilePath });
  } catch (e) {
    alert("OCR failed: " + e.message);
  }
});

document.getElementById("ocr-fr-btn").addEventListener("click", async () => {
  if (!selectedFilePath) return alert("Please select an image first!");
  try {
    await invoke("run_tesseract_fra", { path: selectedFilePath });
  } catch (e) {
    alert("OCR failed: " + e.message);
  }
});

document.getElementById("merge-btn").addEventListener("click", async () => {
  try {
    await invoke("merge_ocr_files", {});
  } catch (e) {
    alert("Merge failed: " + e.message);
  }
});

// ---- AnkiConnect helpers ----

async function ankiRequest(action, params = {}) {
  const res = await fetch("http://localhost:8765", {
    method: "POST",
    body: JSON.stringify({ action, version: 6, params })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

// ---- Decks ----

document.getElementById("load-decks-btn").addEventListener("click", async () => {
  try {
    const decks = await ankiRequest("deckNames");
    const select = document.getElementById("deck-select");
    select.innerHTML = decks.map(d => `<option value="${d}">${d}</option>`).join("");
    document.getElementById("scan-section").classList.remove("hidden");
  } catch (e) {
    alert("Anki non accessible. Assure-toi qu'Anki est ouvert avec AnkiConnect.");
  }
});

// ---- Scan cards without audio ----

document.getElementById("scan-btn").addEventListener("click", async () => {
  const deckName = document.getElementById("deck-select").value;
  if (!deckName) return alert("Sélectionne un deck d'abord.");

  try {
    // 1. Find all note IDs in deck
    const ids = await ankiRequest("findNotes", { query: `deck:"${deckName}"` });

    // 2. Get note details
    const notes = await ankiRequest("notesInfo", { notes: ids });

    // 3. Filter notes without [sound:
    scannedNotes = notes.filter(note =>
      !Object.values(note.fields).some(f => f.value.includes("[sound:"))
    );

    // 4. Display
    const countEl = document.getElementById("cards-count");
    const listEl = document.getElementById("cards-list");

    countEl.textContent = `${scannedNotes.length} cartes sans audio`;
    listEl.innerHTML = scannedNotes.map(note => {
      const fields = Object.values(note.fields);
      const front = fields[0]?.value || "";
      const back = fields[1]?.value || "";
      return `<li><strong>${front}</strong><br><em>${back}</em></li>`;
    }).join("");

    document.getElementById("cards-section").classList.remove("hidden");
  } catch (e) {
    alert("Erreur scan: " + e.message);
  }
});

// ---- Generate audio (placeholder) ----

document.getElementById("generate-btn").addEventListener("click", async () => {
  if (scannedNotes.length === 0) return;

  const btn = document.getElementById("generate-btn");
  btn.disabled = true;

  for (let i = 0; i < scannedNotes.length; i++) {
    const note = scannedNotes[i];
    const backText = Object.values(note.fields)[1]?.value || "";

    btn.textContent = `Génération ${i + 1}/${scannedNotes.length}...`;

    try {
      const mp3Path = await invoke("generate_audio", {
        text: backText,
        noteId: note.noteId
      });

      const b64 = await invoke("read_file_base64", { path: mp3Path });
      await ankiRequest("storeMediaFile", {
        filename: `${note.noteId}.mp3`,
        data: b64
      });

      const fields = Object.keys(note.fields);
      const backField = fields[1];
      const currentValue = note.fields[backField].value;
      await ankiRequest("updateNoteFields", {
        note: {
          id: note.noteId,
          fields: {
            [backField]: currentValue + ` [sound:${note.noteId}.mp3]`
          }
        }
      });

    } catch (e) {
      btn.textContent = `❌ Erreur carte ${i + 1}`;
      alert("Erreur : " + e);
      btn.disabled = false;
      return;
    }
  }

  btn.textContent = `✅ ${scannedNotes.length} audios générés !`;
  btn.disabled = false;
});
