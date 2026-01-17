import { useEffect, useState } from "react";
import { getMeetings, downloadPDF, downloadDOCX } from "../api";

export default function History() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getMeetings();
    setMeetings(data);
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePDF = async (id) => {
    const blob = await downloadPDF(id);
    downloadFile(blob, `meeting-${id}.pdf`);
  };

  const handleDOCX = async (id) => {
    const blob = await downloadDOCX(id);
    downloadFile(blob, `meeting-${id}.docx`);
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>📚 Meeting History</h2>

      {meetings.length === 0 && <p>No meetings yet</p>}

      {meetings.map(m => (
        <div
          key={m.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px"
          }}
        >
          <p><b>Preview:</b> {m.preview}</p>

          <button onClick={() => handlePDF(m.id)}>
            ⬇ PDF
          </button>

          <button
            onClick={() => handleDOCX(m.id)}
            style={{ marginLeft: "10px" }}
          >
            ⬇ DOCX
          </button>
        </div>
      ))}
    </div>
  );
}
