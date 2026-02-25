#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::fs;
use std::fs::File;
use std::io::{Read, Write};
use dirs::{data_dir, home_dir};
use tauri::Manager;
use base64::{Engine as _, engine::general_purpose};

// -----------------------------
// OCR RUSSE
// -----------------------------
#[tauri::command]
fn run_tesseract(path: String) -> Result<String, String> {
    let mut output_dir = data_dir().ok_or("Cannot find data directory")?;
    output_dir.push("ocr_anki");
    fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;
    let mut output_path = output_dir.clone();
    output_path.push("lastOCR");
    let status = std::process::Command::new("tesseract")
        .arg(&path)
        .arg(&output_path)
        .arg("-l")
        .arg("rus")
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(format!("OCR RU done, output file: {}.txt", output_path.display()))
    } else {
        Err("Tesseract failed".into())
    }
}

// -----------------------------
// OCR FRANÇAIS
// -----------------------------
#[tauri::command]
fn run_tesseract_fra(path: String) -> Result<String, String> {
    let mut output_dir = data_dir().ok_or("Cannot find data directory")?;
    output_dir.push("ocr_anki");
    fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;
    let mut output_path = output_dir.clone();
    output_path.push("lastOCR_fr");
    let status = std::process::Command::new("tesseract")
        .arg(&path)
        .arg(&output_path)
        .arg("-l")
        .arg("fra")
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(format!("OCR FR done, output file: {}.txt", output_path.display()))
    } else {
        Err("Tesseract failed".into())
    }
}

// -----------------------------
// MERGE FILES → ~/anki.txt
// -----------------------------
#[tauri::command]
fn merge_ocr_files() -> Result<String, String> {
    let mut data = data_dir().ok_or("Cannot find data directory")?;
    data.push("ocr_anki");
    let mut file_fr = data.clone();
    file_fr.push("lastOCR_fr.txt");
    let mut file_ru = data.clone();
    file_ru.push("lastOCR.txt");
    let mut text = String::new();
    if let Ok(mut f) = File::open(&file_fr) {
        let mut s = String::new();
        f.read_to_string(&mut s).map_err(|e| e.to_string())?;
        text.push_str(&s);
        text.push('\n');
    }
    if let Ok(mut f) = File::open(&file_ru) {
        let mut s = String::new();
        f.read_to_string(&mut s).map_err(|e| e.to_string())?;
        text.push_str(&s);
        text.push('\n');
    }
    let mut home = home_dir().ok_or("Cannot find home dir")?;
    home.push("anki.txt");
    let mut output = File::create(&home).map_err(|e| e.to_string())?;
    output.write_all(text.as_bytes()).map_err(|e| e.to_string())?;
    Ok(format!("Merged into {}", home.display()))
}

#[tauri::command]
fn read_file_base64(path: String) -> Result<String, String> {
    use std::io::Read;
    let mut f = File::open(&path).map_err(|e| e.to_string())?;
    let mut buf = Vec::new();
    f.read_to_end(&mut buf).map_err(|e| e.to_string())?;
    Ok(general_purpose::STANDARD.encode(&buf))
}

// -----------------------------
// GENERATE AUDIO (XTTS v2)
// -----------------------------
#[tauri::command]
async fn generate_audio(text: String, note_id: i64) -> Result<String, String> {
    let mut output_dir = data_dir().ok_or("Cannot find data directory")?;
    output_dir.push("ocr_anki");
    output_dir.push("audio");
    fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;

    let wav_path = output_dir.join(format!("{}.wav", note_id));
    let mp3_path = output_dir.join(format!("{}.mp3", note_id));

    // 1. Generate WAV with XTTS
    let tts_status = std::process::Command::new("/home/laurent/dev/python/tts-env/bin/python")
    .arg("/home/laurent/dev/ocr-anki-flash-card/pythonscript/tts.py")
    .arg(&text)
    .arg(wav_path.to_str().unwrap())
    .status()
    .map_err(|e| e.to_string())?;
    if !tts_status.success() {
        return Err("TTS failed".into());
    }

    // 2. Convert WAV → MP3 with ffmpeg
    let ffmpeg_status = std::process::Command::new("ffmpeg")
        .arg("-i").arg(&wav_path)
        .arg("-y")
        .arg(&mp3_path)
        .status()
        .map_err(|e| e.to_string())?;

    if !ffmpeg_status.success() {
        return Err("ffmpeg conversion failed".into());
    }

    // 3. Clean up wav
    let _ = fs::remove_file(&wav_path);

    Ok(mp3_path.to_string_lossy().to_string())
}



// -----------------------------
// MAIN TAURI
// -----------------------------
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            run_tesseract,
            run_tesseract_fra,
            merge_ocr_files,
            generate_audio,
            read_file_base64
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
