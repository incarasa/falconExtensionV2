const toggle = document.getElementById("toggleSwitch");

// Estado inicial
chrome.storage.local.get("activado", ({ activado }) => {
  if (activado === undefined) {
    chrome.storage.local.set({ activado: true });
    toggle.checked = true;
  } else {
    toggle.checked = activado;
  }
});

// Cambios del usuario
toggle.addEventListener("change", () => {
  const nuevoEstado = toggle.checked;
  chrome.storage.local.set({ activado: nuevoEstado }, () => {
    // Recargar pestaña activa para reflejar el cambio
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id);
    });
  });
});