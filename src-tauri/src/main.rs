#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::fs::File;
use std::io::{Read, Write};
use dirs::{data_dir, home_dir};
use tauri::Manager;

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
    // Directories
    let mut data = data_dir().ok_or("Cannot find data directory")?;
    data.push("ocr_anki");

    let mut file_fr = data.clone();
    file_fr.push("lastOCR_fr.txt");

    let mut file_ru = data.clone();
    file_ru.push("lastOCR.txt");

    // Read both files
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

    // Save into ~/anki.txt
    let mut home = home_dir().ok_or("Cannot find home dir")?;
    home.push("anki.txt");

    let mut output = File::create(&home).map_err(|e| e.to_string())?;
    output.write_all(text.as_bytes()).map_err(|e| e.to_string())?;

    Ok(format!("Merged into {}", home.display()))
}

// -----------------------------
// MAIN TAURI
// -----------------------------
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            run_tesseract,
            run_tesseract_fra,
            merge_ocr_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

