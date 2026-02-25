import requests
import sys

OLLAMA_URL = "http://192.168.1.147:11434/api/generate"

def ollama(prompt):
    response = requests.post(OLLAMA_URL, json={
        "model": "mistral",
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 2000
        }
    })
    return response.json()["response"]

with open(sys.argv[1], "r") as f:
    content = f.read()

# ---- PASSE 1 : Matching FR/RU ----
prompt1 = f"""Tu reçois un texte OCR. Il contient des phrases françaises numérotées et leurs traductions russes numérotées.

INSTRUCTIONS STRICTES :
- Associe chaque phrase française à sa traduction russe via leur numéro commun
- Les numéros peuvent être mal reconnus par l'OCR, utilise le contexte
- Commence IMMÉDIATEMENT par "CARD 1", zero introduction
- Format OBLIGATOIRE et EXCLUSIF :

CARD 1
front: [phrase française]
back: [phrase russe]

CARD 2
front: [phrase française]
back: [phrase russe]

Texte OCR :
{content}"""

print("Passe 1 : matching...", flush=True)
result1 = ollama(prompt1)

print(result1)
# ---- PASSE 2 : Correction OCR ----
prompt2 = f"""Corrige ces erreurs précises dans les cartes Anki :
- "БОЮСЬ" → "Боюсь" (tout en majuscules = erreur OCR)
- "Яищу" → "Я ищу" (espace manquant)
- "понимаю'!'." → "понимаю!.." (ponctuation bizarre)
- "IL" en début de phrase → "Il"

Applique ces types de corrections sur toutes les cartes.
Ne commente pas. Commence par "CARD 1".

{result1}"""

print("Passe 2 : correction OCR...", flush=True)
result2 = ollama(prompt2)

print(result2)

# À la fin du script, remplace print(result2) par :
with open("anki2.txt", "w") as f:
    f.write(result2)
print("Résultat sauvegardé dans anki2.txt")
