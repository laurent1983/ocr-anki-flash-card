const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const selectBtn = document.getElementById("select-btn");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("preview-img");

let selectedFilePath = null;

// console.log('Tauri available:', window.__TAURI__);

// Try different event name formats for Tauri v2
listen('tauri://drag-drop', (event) => {
  console.log('File dropped (drag-drop):', event.payload);
  const filePath = event.payload.paths?.[0] || event.payload[0];
  
  if (filePath) {
    console.log(filePath);
    showPreviewFromPath(filePath);
  }
})

listen('tauri://drag-enter', (event) => {
//  console.log('File hovering (drag-enter):', event.payload);
  dropZone.classList.add("dragover");
})

listen('tauri://drag-leave', () => {
  //console.log('Drag leave');
  dropZone.classList.remove("dragover");
})

listen('tauri://drag-over', (event) => {
  //console.log('Drag over:', event.payload);
})

// Handle button click
selectBtn.addEventListener("click", () => fileInput.click());

// Handle file input
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    showPreview(file);
  }
});

// Show image preview from File object
function showPreview(file) {
	console.log('showPreview', file);
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    preview.classList.remove("hidden");
    selectedFilePath = file.path; // <-- store real path for OCR
  };
  reader.readAsDataURL(file);
}

async function showPreviewFromPath(filePath) {
  console.log('Showing preview for path:', filePath);
  const { convertFileSrc } = window.__TAURI__.core;
  const assetUrl = convertFileSrc(filePath);
  console.log('Converted URL:', assetUrl);
  
  previewImg.src = assetUrl;
  preview.classList.remove("hidden");
  selectedFilePath = filePath;
}

const ocrBtn = document.getElementById("ocr-btn");

ocrBtn.addEventListener("click", async () => {
  if (!selectedFilePath) {
    alert("Please select an image first!");
    return;
  }

  try {
    const result = await invoke("run_tesseract", { path: selectedFilePath });
    console.log("OCR result:", result);
  } catch (e) {
    console.error(e);
    alert("OCR failed: " + e.message);
  }
});

const ocrFrBtn = document.getElementById("ocr-fr-btn");

ocrFrBtn.addEventListener("click", async () => {
  if (!selectedFilePath) {
    alert("Please select an image first!");
    return;
  }

  try {
    const result = await invoke("run_tesseract_fra", { path: selectedFilePath });
    console.log("OCR result (FR):", result);
  } catch (e) {
    console.error(e);
    alert("OCR failed: " + e.message);
  }
});


const mergeBtn = document.getElementById("merge-btn");

mergeBtn.addEventListener("click", async () => {

  try {
    const result = await invoke("merge_ocr_files", { });
    console.log("Merge result:", result);
  } catch (e) {
    console.error(e);
    alert("Merge failed: " + e.message);
  }
});

