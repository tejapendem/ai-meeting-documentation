# from fastapi import (
#     APIRouter,
#     UploadFile,
#     File,
#     HTTPException,
#     WebSocket,
#     Depends,
#     Form
# )
# import traceback
# from fastapi.responses import FileResponse
# from fastapi.concurrency import run_in_threadpool
# from pathlib import Path
# from uuid import uuid4

# from app.api.progress import progress_manager
# from app.services.audio import extract_audio
# from app.services.transcription import transcribe_audio
# from app.services.document_generator import generate_docs
# from app.services.export import export_docx, export_pdf_from_markdown

# from app.auth import get_current_user
# from app.db import SessionLocal, Meeting

# from starlette.websockets import WebSocketDisconnect
# router = APIRouter()

# # -------------------------------
# # Directories
# # -------------------------------
# BASE_TEMP_DIR = Path("temp")
# VIDEO_DIR = BASE_TEMP_DIR / "videos"
# AUDIO_DIR = BASE_TEMP_DIR / "audio"

# VIDEO_DIR.mkdir(parents=True, exist_ok=True)
# AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# RECORDINGS_DIR = Path("recordings")
# RECORDINGS_DIR.mkdir(exist_ok=True)

# MAX_FILE_SIZE_MB = 200
# ALLOWED_VIDEO_TYPES = {
#     "video/mp4",
#     "video/mkv",
#     "video/avi",
#     "video/mov",
#     "video/webm"  
# }

# # -------------------------------
# # Helpers
# # -------------------------------
# async def save_upload_file(upload_file: UploadFile, destination: Path) -> Path:
#     if upload_file.content_type not in ALLOWED_VIDEO_TYPES:
#         raise HTTPException(status_code=400, detail="Unsupported file type")

#     contents = await upload_file.read()

#     if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
#         raise HTTPException(status_code=400, detail="File too large")

#     destination.write_bytes(contents)
#     return destination

# # -------------------------------
# # WebSocket: Progress
# # -------------------------------
# @router.websocket("/ws/progress/{job_id}")
# async def progress_ws(websocket: WebSocket, job_id: str):
#     await progress_manager.connect(websocket, job_id)
#     try:
#         # 🟢 KEEP ALIVE LOOP: This keeps the connection open
#         while True:
#             await websocket.receive_text() 
#     except WebSocketDisconnect:
#         progress_manager.disconnect(job_id)

# # -------------------------------
# # MAIN PIPELINE (PER USER)
# # -------------------------------
# # backend/main.py

# import traceback # <--- Add this import

# @router.post("/process-meeting")
# async def process_meeting(
#     file: UploadFile = File(...),
#     job_id: str = Form(...),
#     user_id: str = Depends(get_current_user)
# ):
#     video_path = RECORDINGS_DIR / f"{job_id}_{file.filename}"
#     audio_path = None

#     try: # <--- Start Try Block
#         await save_upload_file(file, video_path)

#         await progress_manager.send(job_id, "Extracting audio", 10)
#         audio_path = await run_in_threadpool(extract_audio, video_path, AUDIO_DIR)

#         await progress_manager.send(job_id, "Transcribing audio", 40)
#         transcript, speakers = await run_in_threadpool(transcribe_audio, audio_path)

#         await progress_manager.send(job_id, "Generating documentation", 70)
#         documentation = await run_in_threadpool(generate_docs, transcript, speakers)

#         await progress_manager.send(job_id, "Exporting files", 90)
#         pdf_path = export_pdf_from_markdown(documentation)
#         docx_path = export_docx(documentation)

#         # Database logic...
#         db = SessionLocal()
#         meeting = Meeting(
#             user_id=user_id,
#             transcript=transcript,
#             documentation=documentation,
#             pdf_path=str(pdf_path),
#             docx_path=str(docx_path)
#         )
#         db.add(meeting)
#         db.commit()
#         db.refresh(meeting)

#         await progress_manager.send(job_id, "Completed", 100)

#         return {
#             "meeting_id": meeting.id,
#             "transcript": transcript,
#             "speakers": speakers,
#             "documentation": documentation
#         }

#     except Exception as e:
#         # This will print the EXACT error to your VS Code terminal
#         print("---------------- ERROR ----------------")
#         traceback.print_exc() 
#         print("---------------------------------------")
#         # Inform the frontend via WebSocket that it failed
#         await progress_manager.send(job_id, f"Error: {str(e)}", 0)
#         raise HTTPException(status_code=500, detail=str(e))

#     finally:
#         # Cleanup code...
#         if audio_path and audio_path.exists():
#             audio_path.unlink()

# # -------------------------------
# # MEETING HISTORY (PER USER)
# # -------------------------------
# @router.get("/meetings")
# def get_meetings(user_id: str = Depends(get_current_user)):
#     db = SessionLocal()
#     meetings = db.query(Meeting).filter(
#         Meeting.user_id == user_id
#     ).all()

#     return [
#         {
#             "id": m.id,
#             "preview": m.documentation[:200] + "...",
#             "has_pdf": bool(m.pdf_path),
#             "has_docx": bool(m.docx_path)
#         }
#         for m in meetings
#     ]

# # -------------------------------
# # RE-DOWNLOAD FILES
# # -------------------------------
# @router.get("/meetings/{meeting_id}/pdf")
# def download_pdf(
#     meeting_id: str,
#     user_id: str = Depends(get_current_user)
# ):
#     db = SessionLocal()
#     meeting = db.query(Meeting).filter_by(
#         id=meeting_id,
#         user_id=user_id
#     ).first()

#     if not meeting or not meeting.pdf_path:
#         raise HTTPException(status_code=404)

#     return FileResponse(meeting.pdf_path, filename="meeting.pdf")

# @router.get("/meetings/{meeting_id}/docx")
# def download_docx(
#     meeting_id: str,
#     user_id: str = Depends(get_current_user)
# ):
#     db = SessionLocal()
#     meeting = db.query(Meeting).filter_by(
#         id=meeting_id,
#         user_id=user_id
#     ).first()

#     if not meeting or not meeting.docx_path:
#         raise HTTPException(status_code=404)

#     return FileResponse(meeting.docx_path, filename="meeting.docx")


# # -------------------------------
# # EXPORT SELECTED SECTIONS ONLY
# # -------------------------------
# @router.post("/export/selected")
# def export_selected_sections(
#     data: dict,
#     user_id: str = Depends(get_current_user)
# ):
#     """
#     data = {
#       "sections": {
#         "Meeting Summary": "...",
#         "Key Decisions": "...",
#         "Action Items": "..."
#       }
#     }
#     """
#     sections = data.get("sections")
#     if not sections:
#         raise HTTPException(status_code=400, detail="No sections provided")

#     # Combine selected sections into markdown
#     content = ""
#     for title, body in sections.items():
#         content += f"# {title}\n{body}\n\n"

#     pdf_path = export_pdf_from_markdown(content)

#     return FileResponse(
#         pdf_path,
#         filename="selected-sections.pdf"
#     )



from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    WebSocket,
    Depends,
    Form
)
import traceback
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool
from pathlib import Path
from uuid import uuid4
from starlette.websockets import WebSocketDisconnect

from app.api.progress import progress_manager
from app.services.audio import extract_audio
from app.services.transcription import transcribe_audio
from app.services.document_generator import generate_docs
from app.services.export import export_docx, export_pdf_from_markdown

from app.auth import get_current_user
from app.db import SessionLocal, Meeting

router = APIRouter()

# -------------------------------
# ✅ FIXED: Directories (Writable Location)
# -------------------------------
# Use the same user folder as the database
USER_DATA_DIR = Path.home() / "ai-meeting-data"

BASE_TEMP_DIR = USER_DATA_DIR / "temp"
VIDEO_DIR = BASE_TEMP_DIR / "videos"
AUDIO_DIR = BASE_TEMP_DIR / "audio"
RECORDINGS_DIR = USER_DATA_DIR / "recordings"

# Ensure directories exist
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE_MB = 200
ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/mkv",
    "video/avi",
    "video/mov",
    "video/webm"  
}

# -------------------------------
# Helpers
# -------------------------------
async def save_upload_file(upload_file: UploadFile, destination: Path) -> Path:
    if upload_file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    contents = await upload_file.read()

    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    destination.write_bytes(contents)
    return destination

# -------------------------------
# WebSocket: Progress
# -------------------------------
@router.websocket("/ws/progress/{job_id}")
async def progress_ws(websocket: WebSocket, job_id: str):
    await progress_manager.connect(websocket, job_id)
    try:
        # 🟢 KEEP ALIVE LOOP
        while True:
            await websocket.receive_text() 
    except WebSocketDisconnect:
        progress_manager.disconnect(job_id)

# -------------------------------
# MAIN PIPELINE (PER USER)
# -------------------------------
@router.post("/process-meeting")
async def process_meeting(
    file: UploadFile = File(...),
    job_id: str = Form(...),
    user_id: str = Depends(get_current_user)
):
    video_path = RECORDINGS_DIR / f"{job_id}_{file.filename}"
    audio_path = None

    try:
        await save_upload_file(file, video_path)

        await progress_manager.send(job_id, "Extracting audio", 10)
        audio_path = await run_in_threadpool(
            extract_audio, video_path, AUDIO_DIR
        )

        await progress_manager.send(job_id, "Transcribing audio", 40)
        transcript, speakers = await run_in_threadpool(
            transcribe_audio, audio_path
        )

        await progress_manager.send(job_id, "Generating documentation", 70)
        documentation = await run_in_threadpool(
            generate_docs, transcript, speakers
        )

        await progress_manager.send(job_id, "Exporting files", 90)
        pdf_path = export_pdf_from_markdown(documentation)
        docx_path = export_docx(documentation)

        # Database logic
        db = SessionLocal()
        meeting = Meeting(
            user_id=user_id,
            transcript=transcript,
            documentation=documentation,
            pdf_path=str(pdf_path),
            docx_path=str(docx_path)
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        await progress_manager.send(job_id, "Completed", 100)

        return {
            "meeting_id": meeting.id,
            "transcript": transcript,
            "speakers": speakers,
            "documentation": documentation
        }

    except Exception as e:
        print("---------------- ERROR ----------------")
        traceback.print_exc() 
        print("---------------------------------------")
        await progress_manager.send(job_id, f"Error: {str(e)}", 0)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Cleanup audio (keep video in recordings if needed, or delete)
        if audio_path and audio_path.exists():
            audio_path.unlink()

# -------------------------------
# MEETING HISTORY (PER USER)
# -------------------------------
@router.get("/meetings")
def get_meetings(user_id: str = Depends(get_current_user)):
    db = SessionLocal()
    meetings = db.query(Meeting).filter(
        Meeting.user_id == user_id
    ).all()

    return [
        {
            "id": m.id,
            "preview": m.documentation[:200] + "...",
            "has_pdf": bool(m.pdf_path),
            "has_docx": bool(m.docx_path)
        }
        for m in meetings
    ]

# -------------------------------
# RE-DOWNLOAD FILES
# -------------------------------
@router.get("/meetings/{meeting_id}/pdf")
def download_pdf(
    meeting_id: str,
    user_id: str = Depends(get_current_user)
):
    db = SessionLocal()
    meeting = db.query(Meeting).filter_by(
        id=meeting_id,
        user_id=user_id
    ).first()

    if not meeting or not meeting.pdf_path:
        raise HTTPException(status_code=404)

    return FileResponse(meeting.pdf_path, filename="meeting.pdf")

@router.get("/meetings/{meeting_id}/docx")
def download_docx(
    meeting_id: str,
    user_id: str = Depends(get_current_user)
):
    db = SessionLocal()
    meeting = db.query(Meeting).filter_by(
        id=meeting_id,
        user_id=user_id
    ).first()

    if not meeting or not meeting.docx_path:
        raise HTTPException(status_code=404)

    return FileResponse(meeting.docx_path, filename="meeting.docx")


# -------------------------------
# EXPORT SELECTED SECTIONS ONLY
# -------------------------------
@router.post("/export/selected")
def export_selected_sections(
    data: dict,
    user_id: str = Depends(get_current_user)
):
    sections = data.get("sections")
    if not sections:
        raise HTTPException(status_code=400, detail="No sections provided")

    content = ""
    for title, body in sections.items():
        content += f"# {title}\n{body}\n\n"

    pdf_path = export_pdf_from_markdown(content)

    return FileResponse(
        pdf_path,
        filename="selected-sections.pdf"
    )