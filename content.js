/* CODIGO ADICIONAL PARA EXTENSIÓN */
(function () {
  if (window.__redactorIA_inyectado__) return;
  window.__redactorIA_inyectado__ = true;

  const iframe = document.createElement("iframe");
  iframe.src = chrome.runtime.getURL("iframe.html");
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.right = "20px";
  iframe.style.width = "720px";
  iframe.style.height = "580px";
  iframe.style.zIndex = "99999";
  iframe.style.border = "none";
  iframe.style.borderRadius = "16px";
  iframe.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
  iframe.style.backgroundColor = "white";

  document.body.appendChild(iframe);
})();
