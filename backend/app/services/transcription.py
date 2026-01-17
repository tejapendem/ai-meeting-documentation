# from faster_whisper import WhisperModel
# from pathlib import Path

# # Load model ONCE
# model = WhisperModel(
#     "base",
#     device="cpu",
#     compute_type="float32"
# )

# def transcribe_audio(audio_path: Path):
#     """
#     Returns:
#     - full transcript
#     - speaker-wise segments
#     """
#     segments, info = model.transcribe(str(audio_path))

#     transcript_parts = []
#     speakers = []

#     speaker_id = 1

#     for segment in segments:
#         text = segment.text.strip()
#         transcript_parts.append(text)

#         speakers.append({
#             "speaker": f"Speaker {speaker_id}",
#             "start": segment.start,
#             "end": segment.end,
#             "text": text
#         })

#         speaker_id += 1

#     return " ".join(transcript_parts), speakers


from faster_whisper import WhisperModel
from pathlib import Path

# 🔴 BAD: model = WhisperModel(...) <-- DELETE THIS IF YOU HAVE IT

# 🟢 GOOD: Initialize as None
model = None

def get_model():
    global model
    if model is None:
        print("⏳ Downloading/Loading Whisper Model... (This happens only once)", flush=True)
        model = WhisperModel("base", device="cpu", compute_type="float32")
        print("✅ Whisper Model Ready!", flush=True)
    return model

def transcribe_audio(audio_path: Path):
    # Load model ONLY when this function is called
    whisper = get_model()
    
    segments, info = whisper.transcribe(str(audio_path))

    transcript_parts = []
    speakers = []
    speaker_id = 1

    for segment in segments:
        text = segment.text.strip()
        transcript_parts.append(text)
        speakers.append({
            "speaker": f"Speaker {speaker_id}",
            "start": segment.start,
            "end": segment.end,
            "text": text
        })
        speaker_id += 1

    return " ".join(transcript_parts), speakers