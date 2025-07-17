const { app, BrowserWindow, BrowserView, ipcMain } = require('electron');
const path = require('path');

const LLM_TABS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com' },
  { name: 'Gemini', url: 'https://gemini.google.com' },
  { name: 'Claude', url: 'https://claude.ai' },
  { name: 'Perplexity', url: 'https://www.perplexity.ai' },
  { name: 'Mistral', url: 'https://chat.mistral.ai' },
];

let mainWindow;
let views = [];
let currentViewIndex = 0;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });

  // Create a BrowserView for each LLM tab
  for (const tab of LLM_TABS) {
    const view = new BrowserView();
    view.webContents.loadURL(tab.url);
    views.push(view);
  }

  // Show first view by default
  switchToView(0);

  // Load UI with tab buttons
  mainWindow.loadFile('index.html');

  // Listen for tab switch events from renderer
  ipcMain.on('switch-tab', (event, index) => {
    switchToView(index);
  });
}

function switchToView(index) {
  if (views[index]) {
    if (mainWindow.getBrowserView()) {
      mainWindow.removeBrowserView(mainWindow.getBrowserView());
    }
    const view = views[index];
    mainWindow.setBrowserView(view);
    view.setBounds({ x: 0, y: 40, width: 1280, height: 860 });
    view.setAutoResize({ width: true, height: true });
    currentViewIndex = index;
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
