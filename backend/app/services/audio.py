from pathlib import Path
import ffmpeg

def extract_audio(video_path: Path, output_dir: Path) -> Path:
    audio_path = output_dir / f"{video_path.stem}.mp3"

    (
        ffmpeg
        .input(str(video_path))
        .output(str(audio_path), ac=1, ar=16000)
        .overwrite_output()
        .run(quiet=True)
    )

    return audio_path

