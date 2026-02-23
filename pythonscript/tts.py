import sys, torch, soundfile as sf

model, _ = torch.hub.load('snakers4/silero-models', 'silero_tts', language='ru', speaker='v3_1_ru')
audio = model.apply_tts(text=sys.argv[1], speaker='aidar', sample_rate=48000)
sf.write(sys.argv[2], audio.numpy(), 48000)
