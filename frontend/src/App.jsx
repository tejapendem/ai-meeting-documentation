
// import { useState, useEffect, useRef } from "react";
// import Upload from "./components/Upload";
// import Result from "./components/Result";
// import History from "./components/History";

// export default function App() {
//   // 1. New State for Backend Status
//   const [isBackendReady, setIsBackendReady] = useState(false);
//   const [bootLogs, setBootLogs] = useState([]); // Stores startup logs
//   const logsEndRef = useRef(null); // For auto-scrolling

//   const [result, setResult] = useState(null);
//   const [page, setPage] = useState("upload");

//   // 2. Listen for Backend Logs
//   useEffect(() => {
//     if (window.electronAPI && window.electronAPI.onBackendLog) {
//       window.electronAPI.onBackendLog((data) => {
//         const message = data.message || "";
        
//         // Add log to our boot screen list
//         setBootLogs((prev) => [...prev, `[${data.type}] ${message}`]);

//         // 3. THE MAGIC CHECK: Look for the success signal
//         // Uvicorn prints this line when it is 100% ready to accept connections
//         if (message.includes("Uvicorn running on")) {
//           setTimeout(() => setIsBackendReady(true), 1000); // Small delay for smoothness
//         }
//       });
//     }
//   }, []);

//   // Auto-scroll logs to bottom
//   useEffect(() => {
//     logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [bootLogs]);

//   // ----------------------------------------------------
//   // RENDER: LOADING SCREEN (If backend is not ready)
//   // ----------------------------------------------------
//   if (!isBackendReady) {
//     return (
//       <div style={styles.container}>
//         <div style={styles.loadingBox}>
//           <h2>🚀 Starting AI Engine...</h2>
//           <p>Please wait while we initialize the backend.</p>
          
//           {/* Log Window */}
//           <div style={styles.logWindow}>
//             {bootLogs.map((log, index) => (
//               <div key={index} style={styles.logLine}>
//                 {log}
//               </div>
//             ))}
//             <div ref={logsEndRef} />
//           </div>

//           <div style={styles.spinner}></div>
//         </div>
//       </div>
//     );
//   }

//   // ----------------------------------------------------
//   // RENDER: MAIN APP (Once backend is ready)
//   // ----------------------------------------------------
//   return (
//     <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
//       <h1>AI Meeting → Documentation</h1>

//       {/* Navigation */}
//       <div style={{ marginBottom: "20px" }}>
//         <button onClick={() => setPage("upload")} style={styles.navBtn}>
//           🆕 New Meeting
//         </button>
//         <button
//           onClick={() => setPage("history")}
//           style={{ ...styles.navBtn, marginLeft: "10px" }}
//         >
//           📚 History
//         </button>
//       </div>

//       {page === "upload" && (
//         <>
//           <Upload onResult={setResult} />
//           <Result data={result} />
//         </>
//       )}

//       {page === "history" && <History />}
//     </div>
//   );
// }

// // Simple Styles for the Loading Screen
// const styles = {
//   container: {
//     height: "100vh",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//     fontFamily: "system-ui, sans-serif",
//   },
//   loadingBox: {
//     background: "white",
//     padding: "30px",
//     borderRadius: "12px",
//     boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
//     textAlign: "center",
//     width: "500px",
//     maxWidth: "90%",
//   },
//   logWindow: {
//     marginTop: "20px",
//     marginBottom: "20px",
//     background: "#1e1e1e",
//     color: "#00ff00",
//     fontFamily: "monospace",
//     fontSize: "12px",
//     padding: "10px",
//     borderRadius: "6px",
//     height: "150px",
//     overflowY: "auto",
//     textAlign: "left",
//     whiteSpace: "pre-wrap",
//   },
//   logLine: {
//     marginBottom: "4px",
//     borderBottom: "1px solid #333",
//   },
//   spinner: {
//     margin: "0 auto",
//     border: "4px solid #f3f3f3",
//     borderTop: "4px solid #3498db",
//     borderRadius: "50%",
//     width: "30px",
//     height: "30px",
//     animation: "spin 1s linear infinite",
//   },
//   navBtn: {
//     padding: "8px 16px",
//     cursor: "pointer",
//   }
// };

// // Add spinner animation style globally
// const styleSheet = document.createElement("style");
// styleSheet.innerText = `
// @keyframes spin {
//   0% { transform: rotate(0deg); }
//   100% { transform: rotate(360deg); }
// }
// `;
// document.head.appendChild(styleSheet);




import { useState, useEffect, useRef } from "react";
import Upload from "./components/Upload";
import Result from "./components/Result";
import History from "./components/History";

// --- THE TYPING GAME COMPONENT ---
function LoadingGame({ logs }) {
  const [text, setText] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [quote, setQuote] = useState("The quick brown fox jumps over the lazy dog to start the AI engine.");
  const [completed, setCompleted] = useState(false);

  const quotes = [
    "Artificial intelligence is the new electricity for the modern world.",
    "Documentation is a love letter that you write to your future self.",
    "The best way to predict the future is to invent it right now.",
    "Simplicity is the ultimate sophistication in software design."
  ];

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (!startTime) setStartTime(Date.now());
    if (val === quote) {
      setCompleted(true);
      const timeInMinutes = (Date.now() - startTime) / 60000;
      const wordCount = quote.split(" ").length;
      setWpm(Math.round(wordCount / timeInMinutes));
    }
  };

  const resetGame = () => {
    setText("");
    setStartTime(null);
    setCompleted(false);
    setWpm(0);
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : "Initializing...";

  return (
    <div style={styles.gameContainer}>
      <h2 style={{ marginBottom: "10px" }}>🚀 Warming Up AI Engine...</h2>
      <p style={{ color: "#666", marginBottom: "30px" }}>While you wait, test your typing speed!</p>
      <div style={styles.card}>
        <p style={styles.quote}>{quote}</p>
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Type the text above..."
          disabled={completed}
          style={styles.input}
          autoFocus
        />
        {completed && (
          <div style={styles.result}>
            <h3>🎉 {wpm} WPM</h3>
            <button onClick={resetGame} style={styles.retryBtn}>Try Another</button>
          </div>
        )}
      </div>
      <div style={styles.statusBar}>
        <div style={styles.loader}></div>
        <span style={styles.statusText}>{lastLog}</span>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [bootLogs, setBootLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [page, setPage] = useState("upload");

  // Listen for logs
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onBackendLog) {
      window.electronAPI.onBackendLog((data) => {
        const message = data.message || "";
        
        // 🟢 RESTORED: Print to Console so we can debug errors!
        console.log(`[BACKEND ${data.type}]:`, message);

        setBootLogs((prev) => [...prev, message]);

        if (message.includes("Uvicorn running on")) {
          setTimeout(() => setIsBackendReady(true), 1500);
        }
      });
    }
  }, []);

  if (!isBackendReady) {
    return <LoadingGame logs={bootLogs} />;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <h1>AI Meeting → Documentation</h1>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setPage("upload")} style={styles.navBtn}>🆕 New Meeting</button>
        <button onClick={() => setPage("history")} style={{ ...styles.navBtn, marginLeft: "10px" }}>📚 History</button>
      </div>
      {page === "upload" && <><Upload onResult={setResult} /><Result data={result} /></>}
      {page === "history" && <History />}
    </div>
  );
}

// ... (Styles remain the same) ...
const styles = {
  gameContainer: { height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "#f0f2f5", fontFamily: "sans-serif", padding: "20px" },
  card: { background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", width: "500px", maxWidth: "100%", textAlign: "center" },
  quote: { fontSize: "18px", fontWeight: "500", color: "#333", marginBottom: "20px", lineHeight: "1.5", userSelect: "none" },
  input: { width: "100%", padding: "15px", fontSize: "16px", borderRadius: "8px", border: "2px solid #e1e4e8", outline: "none", resize: "none", height: "80px", fontFamily: "inherit" },
  result: { marginTop: "20px", animation: "fadeIn 0.5s ease" },
  retryBtn: { padding: "8px 16px", background: "#007AFF", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", marginTop: "10px" },
  statusBar: { marginTop: "40px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.05)", padding: "8px 16px", borderRadius: "20px", maxWidth: "400px" },
  statusText: { fontSize: "12px", color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "300px" },
  loader: { width: "14px", height: "14px", border: "2px solid #ccc", borderTop: "2px solid #007AFF", borderRadius: "50%", animation: "spin 1s linear infinite" },
  navBtn: { padding: "10px 20px", cursor: "pointer", background: "#eee", border: "none", borderRadius: "5px", fontSize: "14px" }
};