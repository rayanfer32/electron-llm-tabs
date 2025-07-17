// renderer.js
let currentTab = 0;
let nextCustomTabId = 1000; // Start custom tabs at 1000 to avoid conflicts
let closeButtonsVisible = true;

const llmConfigs = [
  { name: "Claude", url: "https://claude.ai", icon: "🤖" },
  { name: "ChatGPT", url: "https://chatgpt.com", icon: "💬" },
  { name: "Gemini", url: "https://gemini.google.com", icon: "✨" },
  { name: "Perplexity", url: "https://perplexity.ai", icon: "🔍" },
  { name: "Copilot", url: "https://copilot.microsoft.com", icon: "🔷" },
  { name: "HuggingFace", url: "https://huggingface.com/chat", icon: "🤗" },
];

const customTabs = new Map(); // Store custom tab configurations

document.addEventListener("DOMContentLoaded", () => {
  // Dynamically create tabs from llmConfigs
  llmConfigs.forEach((config, index) => {
    createTab(index, config);
  });
  
  setupEventListeners();
  setupCustomTabForm();

  // Add a delay to ensure webviews are properly initialized
  setTimeout(() => {
    reinitializeWebviews();
  }, 1000);
});

function setupCustomTabForm() {
  const form = document.getElementById("customTabForm");
  const dialog = document.getElementById("customTabDialog");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("tabName").value.trim();
    const url = document.getElementById("tabUrl").value.trim();
    const icon = document.getElementById("tabIcon").value.trim() || "🌐";

    if (name && url) {
      // Create custom tab configuration
      const customConfig = { name, url, icon };
      const customId = nextCustomTabId++;

      customTabs.set(customId, customConfig);
      createTab(customId, customConfig);

      closeCustomTabDialog();
    }
  });

  // Close dialog when clicking outside
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      closeCustomTabDialog();
    }
  });

  // Close dialog with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.classList.contains("active")) {
      closeCustomTabDialog();
    }
  });
}

// Add CSS for context menu and error states
const contextMenuStyles = `
    .context-menu .context-item {
        padding: 8px 12px;
        cursor: pointer;
        font-size: 13px;
        color: #ffffff;
    }
    .context-menu .context-item:hover {
        background-color: #404040;
    }
    .error-icon {
        font-size: 24px;
        margin-bottom: 10px;
    }
    .retry-btn {
        background-color: #007acc;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
        font-size: 12px;
    }
    .retry-btn:hover {
        background-color: #005a9e;
    }
`;

const style = document.createElement("style");
style.textContent = contextMenuStyles;
document.head.appendChild(style);

function initializeTabs() {
  const tabs = document.querySelectorAll(".tab");
  const webviews = document.querySelectorAll("webview");

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => switchToTab(index));
  });

  webviews.forEach((webview, index) => {
    // Wait for webview to be ready before setting up event listeners
    webview.addEventListener("dom-ready", () => {
      console.log(`Webview ${index} DOM ready`);
      hideLoadingOverlay(index);
    });

    webview.addEventListener("did-start-loading", () => {
      console.log(`Webview ${index} started loading`);
      showLoadingOverlay(index);
    });

    webview.addEventListener("did-stop-loading", () => {
      console.log(`Webview ${index} stopped loading`);
      hideLoadingOverlay(index);
    });

    webview.addEventListener("did-fail-load", (e) => {
      console.error(`Webview ${index} failed to load:`, e);
      hideLoadingOverlay(index);
      showErrorMessage(index, "Failed to load. Click to retry.");
    });

    webview.addEventListener("did-finish-load", () => {
      console.log(`Webview ${index} finished loading`);
      hideLoadingOverlay(index);
    });

    // Handle new windows
    webview.addEventListener("new-window", (e) => {
      e.preventDefault();
      const { shell } = require("electron");
      shell.openExternal(e.url);
    });

    // Add click handler to retry loading
    webview.addEventListener("click", () => {
      if (webview.src) {
        webview.reload();
      }
    });
  });
}

function setupEventListeners() {
  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "1":
          e.preventDefault();
          switchToTab(0);
          break;
        case "2":
          e.preventDefault();
          switchToTab(1);
          break;
        case "3":
          e.preventDefault();
          switchToTab(2);
          break;
        case "4":
          e.preventDefault();
          switchToTab(3);
          break;
        case "5":
          e.preventDefault();
          switchToTab(4);
          break;
        case "t":
          e.preventDefault();
          addNewTab();
          break;
        case "w":
          e.preventDefault();
          closeCurrentTab();
          break;
        case "r":
          e.preventDefault();
          reloadCurrentTab();
          break;
      }
    }
  });
}

function switchToTab(index) {
  if (index < 0 || index >= llmConfigs.length) return;

  // Update active tab
  document
    .querySelectorAll(".tab")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".webview-container")
    .forEach((container) => container.classList.remove("active"));

  const targetTab = document.querySelector(`[data-tab="${index}"]`);
  const targetContainer = document.querySelector(`[data-content="${index}"]`);

  if (targetTab && targetContainer) {
    targetTab.classList.add("active");
    targetContainer.classList.add("active");
    currentTab = index;
  }
}

function closeTab(index) {
  const tabs = document.querySelectorAll(".tab");
  const containers = document.querySelectorAll(".webview-container");

  if (tabs.length <= 1) return; // Don't close the last tab

  const tabToClose = tabs[index];
  const containerToClose = containers[index];

  if (tabToClose && containerToClose) {
    tabToClose.remove();
    containerToClose.remove();

    // If closed tab was active, switch to the first available tab
    if (index === currentTab) {
      switchToTab(0);
    }
  }
}

function addNewTab() {
  const availableLLMs = llmConfigs.filter(
    (_, index) => !document.querySelector(`[data-tab="${index}"]`)
  );

  if (availableLLMs.length === 0) {
    // No more default LLMs available, open custom tab dialog
    openNewTabDialog();
    return;
  }

  const newLLM = availableLLMs[0];
  const newIndex = llmConfigs.indexOf(newLLM);

  createTab(newIndex, newLLM);
}

function createTab(index, config) {
  // Create new tab
  const tabList = document.querySelector(".tab-list");
  const newTab = document.createElement("div");
  newTab.className = "tab";
  newTab.dataset.tab = index;
  newTab.innerHTML = `
        <span class="tab-icon">${config.icon}</span>
        <span class="tab-title">${config.name}</span>
        <button class="tab-close ${
          closeButtonsVisible ? "" : "hidden"
        }" onclick="closeTab(${index})">×</button>
    `;
  newTab.addEventListener("click", () => switchToTab(index));

  tabList.appendChild(newTab);

  // Create new webview container
  const contentArea = document.querySelector(".content-area");
  const newContainer = document.createElement("div");
  newContainer.className = "webview-container";
  newContainer.dataset.content = index;
  newContainer.innerHTML = `
        <webview 
            src="${config.url}" 
            partition="persist:${config.name
              .toLowerCase()
              .replace(/\s+/g, "_")}"
            allowpopups
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36">
        </webview>
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p>Loading ${config.name}...</p>
        </div>
    `;

  contentArea.appendChild(newContainer);

  // Initialize the new webview
  const newWebview = newContainer.querySelector("webview");
  setupWebviewEvents(newWebview, index);

  // Switch to the new tab
  switchToTab(index);
}

function setupWebviewEvents(webview, index) {
  webview.addEventListener("dom-ready", () => {
    console.log(`Webview ${index} DOM ready`);
    hideLoadingOverlay(index);
  });

  webview.addEventListener("did-start-loading", () => {
    console.log(`Webview ${index} started loading`);
    showLoadingOverlay(index);
  });

  webview.addEventListener("did-stop-loading", () => {
    console.log(`Webview ${index} stopped loading`);
    hideLoadingOverlay(index);
  });

  webview.addEventListener("did-fail-load", (e) => {
    console.error(`Webview ${index} failed to load:`, e);
    hideLoadingOverlay(index);
    showErrorMessage(index, "Failed to load. Click to retry.");
  });

  webview.addEventListener("did-finish-load", () => {
    console.log(`Webview ${index} finished loading`);
    hideLoadingOverlay(index);
  });

  webview.addEventListener("new-window", (e) => {
    e.preventDefault();
    const { shell } = require("electron");
    shell.openExternal(e.url);
  });

  webview.addEventListener("click", () => {
    if (webview.src) {
      webview.reload();
    }
  });
}

function openNewTabDialog() {
  const dialog = document.getElementById("customTabDialog");
  dialog.classList.add("active");

  // Clear form
  document.getElementById("tabName").value = "";
  document.getElementById("tabUrl").value = "";
  document.getElementById("tabIcon").value = "🌐";

  // Focus on name field
  document.getElementById("tabName").focus();
}

function closeCustomTabDialog() {
  const dialog = document.getElementById("customTabDialog");
  dialog.classList.remove("active");
}

function toggleCloseBtns() {
  closeButtonsVisible = !closeButtonsVisible;
  const closeButtons = document.querySelectorAll(".tab-close");
  const toggleBtn = document.querySelector(".toggle-close-btn");

  closeButtons.forEach((btn) => {
    if (closeButtonsVisible) {
      btn.classList.remove("hidden");
    } else {
      btn.classList.add("hidden");
    }
  });

  // Update toggle button appearance
  if (closeButtonsVisible) {
    toggleBtn.classList.remove("active");
    toggleBtn.title = "Hide close buttons";
  } else {
    toggleBtn.classList.add("active");
    toggleBtn.title = "Show close buttons";
  }
}

function closeCurrentTab() {
  closeTab(currentTab);
}

function reloadCurrentTab() {
  const activeContainer = document.querySelector(".webview-container.active");
  if (activeContainer) {
    const webview = activeContainer.querySelector("webview");
    if (webview) {
      webview.reload();
    }
  }
}

function showLoadingOverlay(index) {
  const container = document.querySelector(`[data-content="${index}"]`);
  if (container) {
    const overlay = container.querySelector(".loading-overlay");
    if (overlay) {
      overlay.classList.remove("hidden");
    }
  }
}

function hideLoadingOverlay(index) {
  const container = document.querySelector(`[data-content="${index}"]`);
  if (container) {
    const overlay = container.querySelector(".loading-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }
}

// Context menu for tabs
document.addEventListener("contextmenu", (e) => {
  if (e.target.closest(".tab")) {
    e.preventDefault();
    const tab = e.target.closest(".tab");
    const tabIndex = parseInt(tab.dataset.tab);

    // Simple context menu actions
    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.cssText = `
            position: fixed;
            top: ${e.clientY}px;
            left: ${e.clientX}px;
            background: #2d2d2d;
            border: 1px solid #404040;
            border-radius: 4px;
            padding: 4px 0;
            z-index: 1000;
            min-width: 120px;
        `;

    menu.innerHTML = `
            <div class="context-item" onclick="reloadTab(${tabIndex})">Reload</div>
            <div class="context-item" onclick="closeTab(${tabIndex})">Close</div>
        `;

    document.body.appendChild(menu);

    // Remove menu on click outside
    setTimeout(() => {
      document.addEventListener(
        "click",
        () => {
          if (document.body.contains(menu)) {
            document.body.removeChild(menu);
          }
        },
        { once: true }
      );
    }, 100);
  }
});

function reloadTab(index) {
  const container = document.querySelector(`[data-content="${index}"]`);
  if (container) {
    const webview = container.querySelector("webview");
    if (webview) {
      webview.reload();
    }
  }
}

function showErrorMessage(index, message) {
  const container = document.querySelector(`[data-content="${index}"]`);
  if (container) {
    const overlay = container.querySelector(".loading-overlay");
    if (overlay) {
      overlay.innerHTML = `
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
                <button onclick="retryLoad(${index})" class="retry-btn">Retry</button>
            `;
      overlay.classList.remove("hidden");
    }
  }
}

function retryLoad(index) {
  const container = document.querySelector(`[data-content="${index}"]`);
  if (container) {
    const webview = container.querySelector("webview");
    const overlay = container.querySelector(".loading-overlay");

    if (webview && overlay) {
      // Reset overlay to loading state
      overlay.innerHTML = `
                <div class="spinner"></div>
                <p>Loading ${llmConfigs[index].name}...</p>
            `;

      // Reload the webview
      webview.reload();
    }
  }
}

// Add this function to handle webview initialization issues
function reinitializeWebviews() {
  const webviews = document.querySelectorAll("webview");
  webviews.forEach((webview, index) => {
    if (!webview.src) {
      webview.src = llmConfigs[index].url;
    }
  });
}
