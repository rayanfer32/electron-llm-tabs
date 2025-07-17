// main.js
const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      webviewTag: true,
      allowRunningInsecureContent: true,
    },
    icon: path.join(__dirname, "assets/icon.png"),
    titleBarStyle: "default",
    show: false,
  });

  mainWindow.loadFile("index.html");

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Create application menu
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Tab",
          accelerator: "CmdOrCtrl+T",
          click: () => {
            mainWindow.webContents.executeJavaScript("addNewTab()");
          },
        },
        {
          label: "Close Tab",
          accelerator: "CmdOrCtrl+W",
          click: () => {
            mainWindow.webContents.executeJavaScript("closeCurrentTab()");
          },
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            mainWindow.webContents.executeJavaScript("reloadCurrentTab()");
          },
        },
        {
          label: "Toggle Developer Tools",
          accelerator:
            process.platform === "darwin" ? "Alt+Cmd+I" : "Ctrl+Shift+I",
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
        { type: "separator" },
        {
          label: "Actual Size",
          accelerator: "CmdOrCtrl+0",
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          },
        },
        {
          label: "Zoom In",
          accelerator: "CmdOrCtrl+Plus",
          click: () => {
            mainWindow.webContents.setZoomLevel(
              mainWindow.webContents.getZoomLevel() + 0.5
            );
          },
        },
        {
          label: "Zoom Out",
          accelerator: "CmdOrCtrl+-",
          click: () => {
            mainWindow.webContents.setZoomLevel(
              mainWindow.webContents.getZoomLevel() - 0.5
            );
          },
        },
      ],
    },
    {
      label: "LLMs",
      submenu: [
        {
          label: "Claude",
          accelerator: "CmdOrCtrl+1",
          click: () => {
            mainWindow.webContents.executeJavaScript("switchToTab(0)");
          },
        },
        {
          label: "ChatGPT",
          accelerator: "CmdOrCtrl+2",
          click: () => {
            mainWindow.webContents.executeJavaScript("switchToTab(1)");
          },
        },
        {
          label: "Gemini",
          accelerator: "CmdOrCtrl+3",
          click: () => {
            mainWindow.webContents.executeJavaScript("switchToTab(2)");
          },
        },
        {
          label: "Perplexity",
          accelerator: "CmdOrCtrl+4",
          click: () => {
            mainWindow.webContents.executeJavaScript("switchToTab(3)");
          },
        },
        {
          label: "Microsoft Copilot",
          accelerator: "CmdOrCtrl+5",
          click: () => {
            mainWindow.webContents.executeJavaScript("switchToTab(4)");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
