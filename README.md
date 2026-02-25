# OCR Anki Flash Card

Génère des cartes Anki avec audio russe à partir de photos de manuel.

## Flow

1. Photo FR + Photo RU → OCR (Tesseract)
2. LLM local (Ollama + Mistral) → matching des paires FR/RU + correction OCR
3. Silero TTS → génération audio russe
4. AnkiConnect → injection dans Anki

## Prérequis système

```bash
sudo dnf install ffmpeg python3.11 tesseract tesseract-langpack-rus tesseract-langpack-fra
```

## Setup Python (Silero TTS)

```bash
python3.11 -m venv ~/dev/python/tts-env
source ~/dev/python/tts-env/bin/activate
pip install torch torchaudio soundfile requests
```

> Le modèle Silero (~300MB) est téléchargé automatiquement au premier lancement puis mis en cache. 100% offline ensuite.

## Usage TTS

```bash
source ~/dev/python/tts-env/bin/activate
python pythonscript/tts.py "Как ты?" output.wav
ffmpeg -i output.wav output.mp3 -y
```

## Matching FR/RU (en test)

Le script `pythonscript/matching.py` prend le fichier OCR fusionné et produit des paires FR/RU corrigées via Ollama + Mistral.

```bash
python pythonscript/matching.py ~/anki.txt
# Résultat sauvegardé dans result.txt — à relire et corriger manuellement avant import
```

### Ollama (LLM local)

Ollama tourne sur la machine Windows (RTX 3070) pour des performances optimales.

```powershell
# Windows - à lancer avant d'utiliser le script
$env:OLLAMA_HOST = "0.0.0.0"
ollama serve
```

- Modèle : `mistral`
- IP Windows sur le réseau local : `192.168.1.147`
- L'URL est configurée dans `pythonscript/matching.py`

> ⚠️ Script en phase de test — vérifier et corriger `result.txt` manuellement avant tout import dans Anki.

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

- Silero tourne en CPU only sur Intel (pas de GPU dédié requis)
- Ollama/Mistral tourne sur GPU NVIDIA RTX 3070 (Windows) via réseau local
- 64GB RAM → pas de contrainte mémoire
- 100% local après setup
