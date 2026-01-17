import { useState } from "react";
import {
  downloadPDF,
  downloadDOCX,
  exportSelectedSections
} from "../api";

export default function Result({ data }) {
  if (!data) return null;

  const [selected, setSelected] = useState({
    summary: true,
    decisions: true,
    actions: true
  });

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // -----------------------------
  // Standard downloads
  // -----------------------------
  const handleDownloadPDF = async () => {
    const blob = await downloadPDF(data.meeting_id);
    downloadFile(blob, "meeting.pdf");
  };

  const handleDownloadDOCX = async () => {
    const blob = await downloadDOCX(data.meeting_id);
    downloadFile(blob, "meeting.docx");
  };

  // -----------------------------
  // Export selected sections
  // -----------------------------
  const handleExportSelected = async () => {
    const sections = {};

    if (selected.summary) {
      sections["Meeting Summary"] =
        extractSection(data.documentation, "Meeting Summary");
    }

    if (selected.decisions) {
      sections["Key Decisions"] =
        extractSection(data.documentation, "Key Decisions");
    }

    if (selected.actions) {
      sections["Action Items"] =
        extractSection(data.documentation, "Action Items");
    }

    const blob = await exportSelectedSections(sections);
    downloadFile(blob, "selected-sections.pdf");
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>📝 Transcript</h2>
      <textarea
        value={data.transcript}
        readOnly
        rows={8}
        style={{ width: "100%" }}
      />

      <h2 style={{ marginTop: "20px" }}>📄 Generated Documentation</h2>
      <textarea
        value={data.documentation}
        readOnly
        rows={12}
        style={{ width: "100%" }}
      />

      {/* Downloads */}
      <div style={{ marginTop: "15px" }}>
        <button onClick={handleDownloadPDF}>⬇ Download PDF</button>
        <button
          onClick={handleDownloadDOCX}
          style={{ marginLeft: "10px" }}
        >
          ⬇ Download DOCX
        </button>
      </div>

      {/* Export selected */}
      <div style={{ marginTop: "25px" }}>
        <h3>📌 Export Selected Sections</h3>

        <label>
          <input
            type="checkbox"
            checked={selected.summary}
            onChange={() =>
              setSelected({ ...selected, summary: !selected.summary })
            }
          />
          Meeting Summary
        </label>
        <br />

        <label>
          <input
            type="checkbox"
            checked={selected.decisions}
            onChange={() =>
              setSelected({ ...selected, decisions: !selected.decisions })
            }
          />
          Key Decisions
        </label>
        <br />

        <label>
          <input
            type="checkbox"
            checked={selected.actions}
            onChange={() =>
              setSelected({ ...selected, actions: !selected.actions })
            }
          />
          Action Items
        </label>
        <br /><br />

        <button onClick={handleExportSelected}>
          ⬇ Export Selected (PDF)
        </button>
      </div>
    </div>
  );
}

// -----------------------------
// Helper: Safe section extraction
// -----------------------------
function extractSection(text, title) {
  if (!text) return "";

  const regex = new RegExp(
    `# ${title}[\\s\\S]*?(?=\\n# |$)`,
    "i"
  );

  const match = text.match(regex);
  return match ? match[0] : "";
}
