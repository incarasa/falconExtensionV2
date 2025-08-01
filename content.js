(function () {
  if (window.__redactorIA_inyectado__) return;
  window.__redactorIA_inyectado__ = true;

  // ────────────────────────────────────
  // 1)  Inyectar CSS global (solo 1 vez)
  // ────────────────────────────────────
  const css = `
    .falcon-btn      { padding:6px 12px; border:none; border-radius:20px;
                       cursor:pointer; font-weight:600; font-size:14px}
    .falcon-verde    { background:linear-gradient(135deg,#00c853,#64dd17); color:#fff; }
    .falcon-gris     { background:linear-gradient(135deg,#455a64,#607d8b); color:#fff; }
    .falcon-azul     { background:linear-gradient(135deg,#2196f3,#00bcd4); color:#fff; cursor:wait; }
    .falcon-spinner  { border:2px solid #fff; border-top:2px solid transparent;
                       border-radius:50%; width:14px; height:14px;
                       display:inline-block; margin-right:6px;
                       animation:falcon-spin 1s linear infinite; }
    @keyframes falcon-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  `;
  if (!document.getElementById("falcon-style")) {
    const style = document.createElement("style");
    style.id = "falcon-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ────────────────────────────────────
  // 2)  Solo inyectar si está activado
  // ────────────────────────────────────
  chrome.storage?.local.get("activado", ({ activado }) => {
    if (activado === false) return;
    iniciarInyeccion();
  });

  function iniciarInyeccion() {
    const BACKEND_URL =
      "https://backend-falcon-extension.vercel.app/api/redactarManualGemini";

    function crearBotonesParaTextarea(textarea) {
      if (textarea.dataset.iaProcesado) return;
      textarea.dataset.iaProcesado = "true";

      // ── contenedor relativo
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.width = "100%";
      textarea.parentNode.insertBefore(wrapper, textarea);
      wrapper.appendChild(textarea);

      // ── contenedor de botones
      const cont = document.createElement("div");
      Object.assign(cont.style, {
        position: "absolute",
        bottom: "15px",
        right: "8px",
        display: "flex",
        gap: "8px",
      });
      wrapper.appendChild(cont);

      // ── botón Hablar
      const btnHablar = document.createElement("button");
      btnHablar.textContent = "🎤 Hablar";
      btnHablar.className = "falcon-btn";
      btnHablar.style.background = "#e0f0ff";
      btnHablar.style.color = "#1e3a8a";
      cont.appendChild(btnHablar);

      // ── botón Mejorar
      const btnMejorar = document.createElement("button");
      btnMejorar.textContent = "Mejorar con IA";
      btnMejorar.className = "falcon-btn falcon-verde";
      cont.appendChild(btnMejorar);

      // Estado local
      let recognition,
        escuchando = false,
        textoOriginal = "",
        mejorado = false;

      // ─────────────  Voz a texto
      if ("webkitSpeechRecognition" in window) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = "es-ES";
        recognition.continuous = true;
        recognition.interimResults = true;

        let textoAcumulado = "";
        recognition.onresult = (e) => {
          let finalT = "",
            interimT = "";
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            const t = e.results[i][0].transcript.trim();
            e.results[i].isFinal ? (finalT += t + " ") : (interimT += t + " ");
          }
          if (finalT.trim()) textoAcumulado += finalT;
          textarea.value = `${textoOriginal}\n${textoAcumulado}${interimT}`.trim();
        };
        recognition.onend = () => escuchando && recognition.start();
      }

      btnHablar.addEventListener("click", () => {
        if (!recognition) return alert("Tu navegador no soporta reconocimiento de voz.");
        if (!escuchando) {
          textoOriginal = textarea.value.trim();
          recognition.start();
          escuchando = true;
          btnHablar.textContent = "Escuchando…";
          btnHablar.style.background = "#3b82f6";
          btnHablar.style.color = "#fff";
        } else {
          recognition.stop();
          escuchando = false;
          btnHablar.textContent = "🎤 Hablar";
          btnHablar.style.background = "#e0f0ff";
          btnHablar.style.color = "#1e3a8a";
        }
      });

      // ─────────────  Mejorar / Deshacer
      btnMejorar.addEventListener("click", async () => {
        // Si ya está mejorado, deshacer
        if (mejorado) {
          textarea.value = textoOriginal;
          mejorado = false;
          btnMejorar.textContent = "Mejorar con IA";
          btnMejorar.className = "falcon-btn falcon-verde";
          return;
        }

        const texto = textarea.value.trim();
        if (!texto) return alert("Por favor escribe algo.");

        textoOriginal = texto; // guardar backup
        btnMejorar.disabled = true;
        btnMejorar.innerHTML = `<span class="falcon-spinner"></span>Procesando…`;
        btnMejorar.className = "falcon-btn falcon-azul";

        try {
          const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texto_usuario: texto, requisitos: "" }),
          });
          const data = await res.json();

          if (data.texto_mejorado) {
            textarea.value = data.texto_mejorado;
            mejorado = true;
            btnMejorar.textContent = "Deshacer";
            btnMejorar.className = "falcon-btn falcon-gris";
          } else {
            btnMejorar.textContent = "Error";
            btnMejorar.className = "falcon-btn falcon-gris";
          }
        } catch (e) {
          console.error(e);
          btnMejorar.textContent = "Error";
          btnMejorar.className = "falcon-btn falcon-gris";
        }
        btnMejorar.disabled = false;
      });
    }

    // Inyectar en todos los <textarea>
    const procesar = () =>
      document.querySelectorAll("textarea").forEach(crearBotonesParaTextarea);

    procesar();
    new MutationObserver(procesar).observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
})();