import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  let preloadPath;
  if (VITE_DEV_SERVER_URL) {
    preloadPath = path.join(__dirname, "preload.mjs");
  } else {
    const preloadMjs = path.join(__dirname, "preload.mjs");
    const preloadJs = path.join(__dirname, "preload.js");
    if (existsSync(preloadMjs)) {
      preloadPath = preloadMjs;
    } else {
      preloadPath = preloadJs;
    }
  }
  win = new BrowserWindow({
    title: "TradeLog - Trading Journal",
    icon: path.join(process.env.VITE_PUBLIC, "TradeLog.ico"),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      zoomFactor: 1
      // Fattore di zoom iniziale
    }
  });
  win.setMenuBarVisibility(false);
  win.webContents.on("before-input-event", (_, input) => {
    if (input.control && input.key === "=") {
      const currentZoom = (win == null ? void 0 : win.webContents.getZoomFactor()) || 1;
      const newZoom = Math.min(currentZoom + 0.1, 3);
      win == null ? void 0 : win.webContents.setZoomFactor(newZoom);
    } else if (input.control && input.key === "-") {
      const currentZoom = (win == null ? void 0 : win.webContents.getZoomFactor()) || 1;
      const newZoom = Math.max(currentZoom - 0.1, 0.3);
      win == null ? void 0 : win.webContents.setZoomFactor(newZoom);
    } else if (input.control && input.key === "0") {
      win == null ? void 0 : win.webContents.setZoomFactor(1);
    }
  });
  win.webContents.on("zoom-changed", (_, zoomDirection) => {
    const currentZoom = (win == null ? void 0 : win.webContents.getZoomFactor()) || 1;
    let newZoom = currentZoom;
    if (zoomDirection === "in") {
      newZoom = Math.min(currentZoom + 0.1, 3);
    } else if (zoomDirection === "out") {
      newZoom = Math.max(currentZoom - 0.1, 0.3);
    }
    win == null ? void 0 : win.webContents.setZoomFactor(newZoom);
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  return result;
});
ipcMain.handle("save-file", async (_event, data, filePath) => {
  try {
    await fs.writeFile(filePath, data, "utf8");
    return { success: true };
  } catch (error) {
    console.error("Error saving file:", error);
    throw error;
  }
});
ipcMain.handle("read-file", async (_event, filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data;
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
});
const getSettingsPath = () => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "tradelog-settings.json");
};
ipcMain.handle("save-settings", async (_event, settings) => {
  try {
    const settingsPath = getSettingsPath();
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8");
    return { success: true };
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
});
ipcMain.handle("load-settings", async () => {
  try {
    const settingsPath = getSettingsPath();
    const data = await fs.readFile(settingsPath, "utf8");
    if (!data || data.trim() === "") {
      console.log("Settings file is empty, returning default settings");
      return {};
    }
    try {
      return JSON.parse(data);
    } catch (parseError) {
      console.error("Error parsing settings JSON:", parseError);
      console.log("Corrupted settings file, returning default settings");
      return {};
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("Settings file does not exist, returning default settings");
      return {};
    }
    console.error("Error loading settings:", error);
    return {};
  }
});
ipcMain.handle("reset-settings", async () => {
  try {
    const settingsPath = getSettingsPath();
    await fs.writeFile(settingsPath, JSON.stringify({}, null, 2), "utf8");
    console.log("Settings file reset successfully");
    return { success: true };
  } catch (error) {
    console.error("Error resetting settings:", error);
    throw error;
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
