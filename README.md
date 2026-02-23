npm run tauri dev

# Russian TTS with Silero

Génère des fichiers audio en russe localement via Silero TTS.

## Prérequis

```bash
sudo dnf install ffmpeg python
```

## Setup

```bash
python -m venv ~/dev/python/tts-env
source ~/dev/python/tts-env/bin/activate
pip install torch torchaudio soundfile
```

## Script

Le script se trouve dans `/pythonscript/tts.py`.

## Usage

```bash
source ~/dev/python/tts-env/bin/activate
python pythonscript/tts.py "Как ты?" output.wav
ffmpeg -i output.wav output.mp3 -y
```

## Notes

- Le modèle Silero (~300MB) est téléchargé automatiquement au premier lancement puis mis en cache
- 100% local après le premier téléchargement
- Licence MIT
