// -------------------- DATI BASE --------------------
let soggetti = ["ich","du","er/sie/es","wir","ihr","sie/Sie"];
let tempi = ["praesens","praeteritum","perfekt","plusquamperfekt","futur1","futur2","imperativ","partizip1","partizip2"];

let verbiTutti = [];
let verbiAttivi = [];
let verbo = null;
let verboIndex = 0;
let sessionIndex = 1;
let totaleVerbi = 0;
let verbiErrore = [];
let tempiSelezionati = [...tempi];

// -------------------- CARICAMENTO JSON --------------------
fetch("verbi_coniugatiPROVA.json")
  .then(r => r.json())
  .then(data => {
    verbiTutti = data;
    verbiAttivi = [...verbiTutti];
    totaleVerbi = verbiAttivi.length;

    generaListaPopup();
    tempiSelezionati = [...tempi]; // tutti i tempi inizialmente
    generaTabella();
    nuovaDomandaCasuale();
  })
  .catch(err => console.error("Errore JSON:", err));

// -------------------- GENERA TABELLA --------------------
function generaTabella() {
  const tableContainer = document.getElementById("tableContainer");
  let html = "<table><tr><th>Soggetto</th>";
  tempiSelezionati.forEach(t => html += `<th>${t.toUpperCase()}</th>`);
  html += "</tr>";

  // righe per soggetti
  soggetti.forEach(s => {
    html += `<tr><td>${s}</td>`;
    tempiSelezionati.forEach(t => {
      if (t !== "partizip1" && t !== "partizip2") {
        html += `<td><input id="${s}_${t}"></td>`;
      } else {
        html += `<td></td>`; // le celle dei participi saranno in fondo
      }
    });
    html += "</tr>";
  });

  // riga unica per participi
  if (tempiSelezionati.includes("partizip1") || tempiSelezionati.includes("partizip2")) {
    html += `<tr><td>—</td>`;
    tempiSelezionati.forEach(t => {
      if (t === "partizip1") html += `<td><input id="partizip1"></td>`;
      else if (t === "partizip2") html += `<td><input id="partizip2"></td>`;
      else html += `<td></td>`;
    });
    html += "</tr>";
  }

  html += "</table>";
  tableContainer.innerHTML = html;
  aggiornaListenersInput();
}

// -------------------- LISTENER INPUT --------------------
function aggiornaListenersInput() {
  const soggettiValidi = {
    imperativ: ["du", "ihr", "Sie"],
    default: soggetti
  };

  document.querySelectorAll("#tableContainer input").forEach(input => {
    input.addEventListener("keydown", e => {
      if (e.key === "Tab") {
        e.preventDefault();

        let [s, t] = input.id.split("_");
        let sIdx = soggetti.indexOf(s);
        let tIdx = tempiSelezionati.indexOf(t);

        function prossimoInput(sIdx, tIdx) {
          while (true) {
            const nextTempo = tempiSelezionati[tIdx];
            const validi = soggettiValidi[nextTempo] || soggetti;

            // caso participi (senza soggetto)
            if (nextTempo === "partizip1" || nextTempo === "partizip2") {
              return document.getElementById(nextTempo);
            }

            // tempo con soggetti: se il soggetto è valido, ritorna input
            if (validi.includes(soggetti[sIdx])) {
              return document.getElementById(`${soggetti[sIdx]}_${nextTempo}`);
            }

            // soggetto non valido, passa al prossimo
            sIdx++;
            if (sIdx >= soggetti.length) {
              sIdx = 0;
              tIdx++;
              if (tIdx >= tempiSelezionati.length) tIdx = 0; // loop completo
            }
          }
        }

        // incremento soggetto prima di cercare il prossimo input
        sIdx++;
        if (sIdx >= soggetti.length) {
          sIdx = 0;
          tIdx++;
          if (tIdx >= tempiSelezionati.length) tIdx = 0;
        }

        const next = prossimoInput(sIdx, tIdx);
        if (next) next.focus();
      }

      if (e.key === "Enter") {
        e.preventDefault();
        checkAll();
      }
    });
  });
}


// -------------------- CHECKBOX TEMPI --------------------
document.querySelectorAll("#selezionaTempi input[type=checkbox]").forEach(cb => {
  cb.addEventListener("change", () => {
    tempiSelezionati = Array.from(document.querySelectorAll("#selezionaTempi input[type=checkbox]:checked"))
                           .map(c => c.value);
    generaTabella();
    resetVerbo();
  });
});

// -------------------- CONTATORE + BARRA --------------------
function aggiornaCounter() {
  document.getElementById("counter").textContent =
    `Verbo ${sessionIndex} di ${totaleVerbi} (restano ${totaleVerbi - sessionIndex})`;

  let percentuale = (sessionIndex / totaleVerbi) * 100;
  document.getElementById("progressFill").style.width = percentuale + "%";
}

// -------------------- CAMBIO VERBO --------------------
function scegliVerbo(v, resetSession = false) {
  verbo = v;
  verboIndex = verbiAttivi.indexOf(v);

  if (resetSession) sessionIndex = 1;

  document.getElementById("verbDisplay").textContent =
    `Coniuga il verbo "${verbo.infinitiv}"`;

  resetVerbo();
  aggiornaCounter();
}

// -------------------- CASUALE / SUCCESSIVO / PRECEDENTE --------------------
function nuovaDomandaCasuale() {
  if (!verbiAttivi.length) return;
  let idx = Math.floor(Math.random() * verbiAttivi.length);
  scegliVerbo(verbiAttivi[idx], true);
}

function prossimoVerbo() {
  verboIndex = (verboIndex + 1) % totaleVerbi;
  sessionIndex++;
  scegliVerbo(verbiAttivi[verboIndex]);
}

function precedenteVerbo() {
  verboIndex = (verboIndex - 1 + totaleVerbi) % totaleVerbi;
  sessionIndex = Math.max(1, sessionIndex - 1);
  scegliVerbo(verbiAttivi[verboIndex]);
}

// -------------------- RESET --------------------
function resetVerbo() {
  soggetti.forEach(s =>
    tempiSelezionati.forEach(t => {
      const campo = document.getElementById(`${s}_${t}`);
      if (campo) {
        campo.value = "";
        campo.className = "";
      }
    })
  );
  // reset partecipi
  ["partizip1","partizip2"].forEach(t => {
    const campo = document.getElementById(t);
    if(campo){
      campo.value = "";
      campo.className = "";
    }
  });
  document.getElementById("feedback").innerHTML = "";
}

function resetSessione() {
  sessionIndex = 1;
  verboIndex = 0;
  verbiErrore = [];
  nuovaDomandaCasuale();
}

// -------------------- MOSTRA HINT --------------------
function mostraHint() {
  // casi con soggetti
  soggetti.forEach(s =>
    tempiSelezionati.forEach(t => {
      if (t === "partizip1" || t === "partizip2") return;

      const campo = document.getElementById(`${s}_${t}`);
      if (campo && campo.value.trim() === "") {
        let giusta;
        if (t === "imperativ") {
          if (s === "du") giusta = verbo.imperativ.du;
          else if (s === "ihr") giusta = verbo.imperativ.ihr;
          else if (s === "sie") giusta = verbo.imperativ.Sie;
          else return;
        } else {
          giusta = verbo[t][s];
        }
        campo.value = giusta;
        campo.className = "hint";
      }
    })
  );

  // casi senza soggetti
  ["partizip1","partizip2"].forEach(t => {
    if (!tempiSelezionati.includes(t)) return;
    const campo = document.getElementById(t);
    if (campo && campo.value.trim() === "") {
      campo.value = verbo[t]; // qui il verbo è direttamente una stringa
      campo.className = "hint";
    }
  });
}

// -------------------- RIPASSO ERRORI --------------------
function ripassoErrori() {
  if(verbiErrore.length === 0) {
    alert("Non ci sono verbi da ripassare!");
    return;
  }
  let idx = Math.floor(Math.random() * verbiErrore.length);
  scegliVerbo(verbiErrore[idx]);
}

// -------------------- CERCA --------------------
function cercaVerbo() {
  const ricerca = document.getElementById("inputVerbo").value.trim().toLowerCase();
  if (!ricerca) return;

  const trovato = verbiAttivi.find(v => v.infinitiv.toLowerCase() === ricerca);
  if (trovato) scegliVerbo(trovato, true);
  else alert("Verbo non trovato.");
}

// -------------------- CHECK RISPOSTE --------------------
function checkAll() {
  let corretto = 0;
  let totale = 0;
  let erroriPerTempo = {};
  tempiSelezionati.forEach(t => erroriPerTempo[t] = []);

  // con soggetti
  soggetti.forEach(s => {
    tempiSelezionati.forEach(t => {
      if (t === "partizip1" || t === "partizip2") return;

      const campo = document.getElementById(`${s}_${t}`);
      if (!campo) return;

      let giusta;
      if (t === "imperativ") {
        if (s === "du") giusta = verbo.imperativ.du;
        else if (s === "ihr") giusta = verbo.imperativ.ihr;
        else if (s === "sie") giusta = verbo.imperativ.Sie;
        else return;
      } else {
        giusta = verbo[t][s];
      }

      totale++;
      if (campo.value.trim() === giusta) {
        campo.className = "correct";
        corretto++;
      } else {
        campo.className = "wrong";
        erroriPerTempo[t].push(`• ${s}: ${giusta}`);
      }
    });
  });

  // senza soggetti (partizip)
  ["partizip1","partizip2"].forEach(t => {
    if (!tempiSelezionati.includes(t)) return;
    const campo = document.getElementById(t);
    if (!campo) return;

    totale++;
    if (campo.value.trim() === verbo[t]) {
      campo.className = "correct";
      corretto++;
    } else {
      campo.className = "wrong";
      erroriPerTempo[t].push(`• ${verbo[t]}`);
    }
  });

  if(corretto < totale && !verbiErrore.includes(verbo)) verbiErrore.push(verbo);

  let html = `<strong style="color:#f0f0f0">Hai corretto ${corretto}/${totale} forme.</strong><br><br>`;
  const colori = {
    praesens: "#3a3b4a",
    praeteritum: "#3a443a",
    perfekt: "#3a3a44",
    plusquamperfekt: "#443a3a",
    futur1: "#443a3f",
    futur2: "#3a4444",
    imperativ: "#3a3a3a",
    partizip1: "#3a3a44",
    partizip2: "#44443a"
  };

  tempiSelezionati.forEach(t => {
    if (erroriPerTempo[t].length) {
      html += `<div style="
        margin-bottom:6px;
        padding:8px;
        border-radius:6px;
        background-color:${colori[t]};
        color:#f0f0f0;
        box-shadow: inset 0 0 4px rgba(0,0,0,0.3);
      ">
        <strong>${t.toUpperCase()}</strong><br>
        ${erroriPerTempo[t].join("<br>")}
      </div>`;
    }
  });

  document.getElementById("feedback").innerHTML = html;
}

// -------------------- POPUP SELEZIONE VERBI --------------------
function generaListaPopup() {
  const lista = document.getElementById("listaVerbi");
  lista.innerHTML = "";

  verbiTutti.forEach(v => {
    const label = document.createElement("label");
    label.className = "voce-verbo";

    label.innerHTML = `
      <input type="checkbox" value="${v.infinitiv}" checked>
      <span>${v.infinitiv}</span>
    `;
    lista.appendChild(label);
  });
}

function apriPopupVerbi() {
  document.getElementById("popupVerbi").style.display = "flex";
}

function chiudiPopupVerbi() {
  document.getElementById("popupVerbi").style.display = "none";
}

function selezionaTuttiVerbi() {
  document.querySelectorAll("#listaVerbi input").forEach(cb => cb.checked = true);
}

function deselezionaTuttiVerbi() {
  document.querySelectorAll("#listaVerbi input").forEach(cb => cb.checked = false);
}

function confermaVerbi() {
  const selezionati = Array.from(document.querySelectorAll("#listaVerbi input:checked"))
                           .map(cb => cb.value);
  if (selezionati.length === 0) {
    alert("Selezioni almeno un verbo.");
    return;
  }

  verbiAttivi = verbiTutti.filter(v => selezionati.includes(v.infinitiv));
  totaleVerbi = verbiAttivi.length;
  resetSessione();
  chiudiPopupVerbi();
}

