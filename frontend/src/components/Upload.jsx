import { useState, useRef, useEffect } from "react";
import { uploadMeeting } from "../api";

export default function Upload({ onResult }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);

  // 🆕 Electron Source Selection
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // 1️⃣ Load Screens/Windows (Only if in Electron)
  useEffect(() => {
    async function getElectronSources() {
      if (window.electronAPI && window.electronAPI.getSources) {
        try {
          const availableSources = await window.electronAPI.getSources();
          setSources(availableSources);
          if (availableSources.length > 0) {
            setSelectedSourceId(availableSources[0].id);
          }
        } catch (e) {
          console.error("Could not fetch sources", e);
        }
      }
    }
    getElectronSources();
  }, []);

  // 2️⃣ Start Recording
  const startRecording = async () => {
    try {
      let screenStream;

      // 🅰️ ELECTRON MODE (Use getUserMedia with Source ID)
      if (window.electronAPI && selectedSourceId) {
        screenStream = await navigator.mediaDevices.getUserMedia({
          audio: false, // System audio is tricky on Mac, skipping for stability
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: selectedSourceId,
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080
            }
          }
        });
      } 
      // 🅱️ BROWSER MODE (Standard getDisplayMedia)
      else {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
      }

      // 3️⃣ Get Microphone Audio (Works in both)
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // 4️⃣ Combine Screen + Mic
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm; codecs=vp9"
      });

      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        combinedStream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm"
        });
        const recordedFile = new File([blob], "meeting-recording.webm", {
          type: "video/webm"
        });
        setFile(recordedFile);
        setStatus("Recording finished.");
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setStatus("Recording...");
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Recording failed: " + err.message);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(0);
    setStatus("Uploading...");

    const jobId = crypto.randomUUID();
    const ws = new WebSocket(`ws://localhost:8000/ws/progress/${jobId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.progress);
      setStatus(data.message);
    };

    try {
      const result = await uploadMeeting(file, jobId);
      onResult(result);
    } catch (err) {
      console.error(err);
      setError("Failed to process meeting");
    } finally {
      ws.close();
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>🎥 Record Meeting</h3>

      {/* Only show Dropdown if in Electron and sources exist */}
      {sources.length > 0 && !recording && (
        <div style={{ marginBottom: "10px" }}>
          <label>Select Screen/Window: </label>
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!recording ? (
        <button onClick={startRecording}>▶ Start Screen Recording</button>
      ) : (
        <button onClick={stopRecording} style={{ color: "red" }}>
          ⏹ Stop Recording
        </button>
      )}

      <hr />

      <h3>📁 Or Upload Video</h3>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br />
      <br />

      <button onClick={submit} disabled={loading || !file}>
        {loading ? "Processing..." : "Generate Documentation"}
      </button>

      {loading && (
        <div style={{ marginTop: "10px" }}>
          <p>{status}</p>
          <progress value={progress} max="100" style={{ width: "100%" }} />
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}