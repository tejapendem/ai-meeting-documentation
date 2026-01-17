const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getSources: () => ipcRenderer.invoke("GET_SOURCES"),
  onBackendLog: (callback) => ipcRenderer.on("backend-log", (_event, value) => callback(value))
});
