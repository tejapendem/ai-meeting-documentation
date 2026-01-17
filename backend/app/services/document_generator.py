from app.services.llm import call_llm

def generate_docs(transcript: str, speakers: dict | None = None) -> str:
    speaker_block = ""
    if speakers:
        speaker_block = f"\n\nSpeakers:\n{speakers}"

    prompt = f"""
You are an AI assistant that converts meeting transcripts into clear documentation.

Transcript:
{transcript}

{speaker_block}

Generate:
- Meeting summary
- Key decisions
- Action items
- Follow-ups
"""

    return call_llm(prompt)
