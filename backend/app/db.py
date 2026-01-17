# from sqlalchemy import create_engine, Column, String, Text
# from sqlalchemy.orm import declarative_base, sessionmaker
# import uuid

# engine = create_engine("sqlite:///meetings.db", connect_args={"check_same_thread": False})
# SessionLocal = sessionmaker(bind=engine)

# Base = declarative_base()

# class Meeting(Base):
#     __tablename__ = "meetings"

#     id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
#     user_id = Column(String, index=True)
#     transcript = Column(Text)
#     documentation = Column(Text)
#     video_path = Column(String)
#     pdf_path = Column(String)
#     docx_path = Column(String)

# Base.metadata.create_all(bind=engine)


from sqlalchemy import create_engine, Column, String, Text
from sqlalchemy.orm import declarative_base, sessionmaker
import uuid
from pathlib import Path

# -------------------------------
# ✅ FIXED: Use Writable User Directory
# -------------------------------
# 1. Create a folder in the user's home directory (e.g., /Users/name/ai-meeting-data)
USER_DATA_DIR = Path.home() / "ai-meeting-data"
USER_DATA_DIR.mkdir(parents=True, exist_ok=True)

# 2. Define the path for the database file inside that folder
DB_PATH = USER_DATA_DIR / "meetings.db"

# 3. Create engine using this new path
engine = create_engine(
    f"sqlite:///{DB_PATH}", 
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    transcript = Column(Text)
    documentation = Column(Text)
    video_path = Column(String)
    pdf_path = Column(String)
    docx_path = Column(String)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)