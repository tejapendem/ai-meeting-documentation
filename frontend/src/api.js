import axios from "axios";

const API_BASE = "http://localhost:8000";


// 🔐 TEMP USER (replace with real auth later)
const AUTH_HEADERS = {
  "X-User-Id": "teja"
};

// -----------------------------
// Upload Meeting
// -----------------------------
export const uploadMeeting = async (file, jobId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("job_id", jobId);

  const res = await axios.post(
    `${API_BASE}/process-meeting`,
    formData,
    { headers: AUTH_HEADERS }
  );

  return res.data;
};

// -----------------------------
// Get Meeting History
// -----------------------------
export const getMeetings = async () => {
  const res = await axios.get(
    `${API_BASE}/meetings`,
    { headers: AUTH_HEADERS }
  );
  return res.data;
};

// -----------------------------
// Re-download files
// -----------------------------
export const downloadPDF = async (meetingId) => {
  const res = await axios.get(
    `${API_BASE}/meetings/${meetingId}/pdf`,
    {
      headers: AUTH_HEADERS,
      responseType: "blob"
    }
  );
  return res.data;
};

export const downloadDOCX = async (meetingId) => {
  const res = await axios.get(
    `${API_BASE}/meetings/${meetingId}/docx`,
    {
      headers: AUTH_HEADERS,
      responseType: "blob"
    }
  );
  return res.data;
};

// -----------------------------
// Export Selected Sections
// -----------------------------
export const exportSelectedSections = async (sections) => {
  const res = await axios.post(
    `${API_BASE}/export/selected`,
    { sections },
    {
      headers: AUTH_HEADERS,
      responseType: "blob"
    }
  );
  return res.data;
};
