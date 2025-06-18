import { app as n, BrowserWindow as d, ipcMain as a, dialog as m } from "electron";
import { fileURLToPath as _ } from "node:url";
import r from "node:path";
import p from "node:fs/promises";
const i = r.dirname(_(import.meta.url));
process.env.APP_ROOT = r.join(i, "..");
const s = process.env.VITE_DEV_SERVER_URL, T = r.join(process.env.APP_ROOT, "dist-electron"), f = r.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = s ? r.join(process.env.APP_ROOT, "public") : f;
let e;
function w() {
  e = new d({
    title: "TradeLog - Trading Journal",
    icon: r.join(i + "/src/assets/TradeLog.png"),
    webPreferences: {
      preload: r.join(i, "preload.mjs")
    }
  }), e.setMenuBarVisibility(!1), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), s ? e.loadURL(s) : e.loadFile(r.join(f, "index.html"));
}
n.on("window-all-closed", () => {
  process.platform !== "darwin" && (n.quit(), e = null);
});
n.on("activate", () => {
  d.getAllWindows().length === 0 && w();
});
n.whenReady().then(w);
a.handle("select-folder", async () => await m.showOpenDialog({
  properties: ["openDirectory"]
}));
a.handle("save-file", async (l, t, o) => {
  try {
    return await p.writeFile(o, t, "utf8"), { success: !0 };
  } catch (c) {
    throw console.error("Error saving file:", c), c;
  }
});
a.handle("read-file", async (l, t) => {
  try {
    return await p.readFile(t, "utf8");
  } catch (o) {
    throw console.error("Error reading file:", o), o;
  }
});
export {
  T as MAIN_DIST,
  f as RENDERER_DIST,
  s as VITE_DEV_SERVER_URL
};
