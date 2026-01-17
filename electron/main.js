// const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron");
// const path = require("path");

// function createWindow() {
//   const win = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       preload: path.join(__dirname, "preload.js")
//     }
//   });

//   win.loadFile("../frontend/dist/index.html");
// }

// ipcMain.handle("GET_SOURCES", async () => {
//   const sources = await desktopCapturer.getSources({
//     types: ["screen", "window"]
//   });

//   return sources.map(source => ({
//     id: source.id,
//     name: source.name
//   }));
// });

// app.whenReady().then(createWindow);


const { app, BrowserWindow, ipcMain, desktopCapturer, dialog } = require("electron");
const { autoUpdater } = require("electron-updater"); // 🟢 Import Auto Updater
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

const isDev = !app.isPackaged;
let mainWindow;
let backendProcess = null;

// 🟢 Configure Auto Updater Logging
autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";
autoUpdater.autoDownload = true; // Automatically download updates

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "frontend/dist/index.html"));
  }

  // 🟢 Wait for window to load, then start Backend AND Check for Updates
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    startBackend();
    
    // Check for updates (only in production)
    if (!isDev) {
      logToFrontend("INFO", "🔄 Checking for app updates...");
      autoUpdater.checkForUpdatesAndNotify();
    }
  });
}

function logToFrontend(type, message) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send("backend-log", { type, message });
      console.log(`[${type}] ${message}`);
    } catch (e) {
      console.error("Failed to send log to frontend:", e);
    }
  }
}

// 🟢 AUTO-UPDATER EVENTS
autoUpdater.on('checking-for-update', () => {
  logToFrontend('INFO', 'Checking for updates...');
});

autoUpdater.on('update-available', () => {
  logToFrontend('INFO', '🎉 New version found! Downloading now...');
});

autoUpdater.on('update-not-available', () => {
  logToFrontend('INFO', 'App is up to date.');
});

autoUpdater.on('error', (err) => {
  logToFrontend('ERROR', 'Update error: ' + err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
  const logMessage = `Download speed: ${progressObj.bytesPerSecond} - ${progressObj.percent.toFixed(2)}%`;
  logToFrontend('INFO', logMessage);
});

autoUpdater.on('update-downloaded', () => {
  logToFrontend('INFO', '✅ Update downloaded. Restarting soon...');
  
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'A new version has been downloaded. Restart now to install?',
    buttons: ['Restart', 'Later']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

function startBackend() {
  if (isDev) {
    logToFrontend("INFO", "⚠️ In Dev Mode: Skipping backend spawn.");
    return;
  }

  const executableName = process.platform === "win32" ? "api.exe" : "api";
  const scriptPath = path.join(process.resourcesPath, executableName);

  logToFrontend("INFO", `🔎 Looking for backend at: ${scriptPath}`);

  // 1. Check if file exists
  if (!fs.existsSync(scriptPath)) {
    logToFrontend("ERROR", `❌ Backend file NOT found at: ${scriptPath}`);
    dialog.showErrorBox("Error", "Backend executable not found.");
    return;
  }

  // 2. Force Permissions (Mac/Linux)
  if (process.platform !== "win32") {
    try {
      fs.chmodSync(scriptPath, "755");
      logToFrontend("INFO", "✅ Permissions set to 755");
    } catch (err) {
      logToFrontend("ERROR", `❌ Failed to set permissions: ${err.message}`);
    }
  }

  // 3. Start Backend
  logToFrontend("INFO", "🚀 Spawning backend process...");
  
  try {
    backendProcess = spawn(scriptPath, [], {
      cwd: process.resourcesPath,
      env: { ...process.env, PORT: "8000", PYTHONUNBUFFERED: "1" }
    });

    backendProcess.stdout.on("data", (data) => {
      logToFrontend("PYTHON_LOG", data.toString());
    });

    backendProcess.stderr.on("data", (data) => {
      logToFrontend("PYTHON_ERR", data.toString());
    });

    backendProcess.on("error", (err) => {
      logToFrontend("ERROR", `❌ Failed to spawn: ${err.message}`);
    });

    backendProcess.on("close", (code) => {
      logToFrontend("WARN", `⚠️ Backend exited with code ${code}`);
    });
    
  } catch (err) {
     logToFrontend("ERROR", `❌ Critical Spawn Error: ${err.message}`);
  }
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  stopBackend();
});

// Screen Recording
ipcMain.handle("GET_SOURCES", async () => {
  try {
    const sources = await desktopCapturer.getSources({ types: ["screen", "window"] });
    return sources.map(s => ({ id: s.id, name: s.name }));
  } catch (err) {
    return [];
  }
});