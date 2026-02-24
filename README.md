# OCR Anki Flash Card

Génère des cartes Anki avec audio russe à partir de photos de manuel.

## Flow

1. Photo FR + Photo RU → OCR (Tesseract)
2. LLM local (Ollama) → correction + matching des paires FR/RU
3. XTTS v2 → génération audio russe
4. AnkiConnect → injection dans Anki

## Prérequis système

```bash
sudo dnf install ffmpeg python3.11 tesseract tesseract-langpack-rus tesseract-langpack-fra
```

## Setup Python (XTTS v2)

```bash
python3.11 -m venv ~/dev/python/tts-env
source ~/dev/python/tts-env/bin/activate
pip install TTS
```

> Premier lancement = téléchargement du modèle XTTS v2 (~2.5GB), ensuite 100% offline.

## Usage TTS

```bash
source ~/dev/python/tts-env/bin/activate
tts --text "Как ты?" \
    --model_name "tts_models/multilingual/multi-dataset/xtts_v2" \
    --language ru \
    --out_path output.wav
ffmpeg -i output.wav output.mp3 -y
```

## AnkiConnect

Addon requis pour injecter les cartes dans Anki (Anki doit être ouvert).

- Code addon : `2055492159`
- Ouvre Anki → Tools → Add-ons → Get Add-ons → colle le code
- API disponible sur `localhost:8765`

> Fonctionne avec Anki installé en Flatpak.

## Dev

```bash
npm run tauri dev
```

## Notes

- XTTS v2 tourne en CPU only sur Intel (pas de GPU dédié requis)
- 64GB RAM → pas de contrainte mémoire
- 100% local après setup
