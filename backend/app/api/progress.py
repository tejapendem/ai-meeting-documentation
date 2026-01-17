from fastapi import WebSocket

class ProgressManager:
    def __init__(self):
        self.connections = {}

    async def connect(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        self.connections[job_id] = websocket

    async def send(self, job_id: str, message: str, percent: int):
        ws = self.connections.get(job_id)
        if ws:
            try:
                # 🟢 Wrap in try/except to prevent 500 crashes
                await ws.send_json({
                    "message": message,
                    "progress": percent
                })
            except Exception as e:
                print(f"Warning: Could not send progress to {job_id}: {e}")
                # Optional: self.disconnect(job_id)

    def disconnect(self, job_id: str):
        self.connections.pop(job_id, None)
        
progress_manager = ProgressManager()
