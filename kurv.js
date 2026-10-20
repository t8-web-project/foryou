"use strict";

const kurvListe = document.querySelector(".kurv_liste");
const kasseForm = document.querySelector(".kasse_form");
const fragtGraense = 40;
const fragtPris = 4.99;

// Produkter fra hudpleje-kategorien (bruges til 3 for 2-kampagnen)
const hudplejeURL = "https://dummyjson.com/products/category/skin-care?limit=0&select=id";
let hudplejeIder = [];

function getHudplejeIder() {
  fetch(hudplejeURL)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      hudplejeIder = data.products.map((product) => product.id);
      showKurv();
    })
    .catch(() => {
      showKurv();
    });
}

function showKurv() {
  const kurv = getKurv();
  kurvListe.innerHTML = "";

  if (kurv.length === 0) {
    kurvListe.innerHTML = `
      <li class="tom_kurv">
        <p>Din kurv er tom.</p>
        <a href="productlist.html" class="knap knap_outline">Se alle produkter</a>
      </li>
    `;
    document.querySelector(".kasse").hidden = true;
    document.querySelector(".til_kassen").hidden = true;
  }

  kurv.forEach((vare, index) => {
    kurvListe.innerHTML += `
      <li class="vare">
        <img src="${vare.thumbnail}" alt="" width="120" height="120" loading="lazy">
        <div>
          <p class="label_tekst">${vare.brand || "ForYou"}</p>
          <h3><a href="productdetails.html?id=${vare.id}">${vare.title}</a></h3>
          ${vare.farve ? `<p class="vare_farve">Farve: ${vare.farve}</p>` : ""}
        </div>
        <div class="vare_bund">
          <div class="antal_vaelger">
            <button class="faerre" data-index="${index}" aria-label="Færre af ${vare.title}">${ikoner.minus}</button>
            <span aria-label="Antal">${vare.antal}</span>
            <button class="flere" data-index="${index}" aria-label="Flere af ${vare.title}">${ikoner.plus}</button>
          </div>
          <p class="vare_pris">${formatPris(vare.price * vare.antal)}</p>
          <button class="fjern" data-index="${index}">Fjern</button>
        </div>
      </li>
    `;
  });

  // Knapperne til antal og fjern
  kurvListe.querySelectorAll(".faerre, .flere, .fjern").forEach((knap) => {
    knap.addEventListener("click", () => {
      const nyKurv = getKurv();
      const vare = nyKurv[knap.dataset.index];

      if (knap.classList.contains("flere")) {
        vare.antal++;
      } else if (knap.classList.contains("faerre")) {
        vare.antal--;
      }

      if (knap.classList.contains("fjern") || vare.antal < 1) {
        nyKurv.splice(knap.dataset.index, 1);
      }

      gemKurv(nyKurv);
      showKurv();
    });
  });

  visOpsummering(kurv);
}

// Regn varer, levering, 3 for 2 og total ud
function visOpsummering(kurv) {
  const varer = kurv.reduce((sum, vare) => sum + vare.price * vare.antal, 0);

  // 3 for 2 på hudpleje: for hver 3. hudplejevare er den billigste gratis
  const hudplejePriser = [];
  kurv.forEach((vare) => {
    if (hudplejeIder.includes(vare.id)) {
      for (let i = 0; i < vare.antal; i++) {
        hudplejePriser.push(vare.price);
      }
    }
  });
  hudplejePriser.sort((a, b) => a - b);
  const antalGratis = Math.floor(hudplejePriser.length / 3);
  const rabat = hudplejePriser.slice(0, antalGratis).reduce((sum, pris) => sum + pris, 0);

  const efterRabat = varer - rabat;
  const levering = efterRabat >= fragtGraense || efterRabat === 0 ? 0 : fragtPris;

  document.querySelector(".sum_varer").textContent = formatPris(varer);
  document.querySelector(".sum_levering").textContent = levering === 0 ? "Gratis" : formatPris(levering);
  document.querySelector(".sum_rabat_raekke").hidden = rabat === 0;
  document.querySelector(".sum_rabat").textContent = "-" + formatPris(rabat);
  document.querySelector(".sum_total").textContent = formatPris(efterRabat + levering);

  const mangler = fragtGraense - efterRabat;
  document.querySelector(".fragt_besked").textContent =
    efterRabat > 0 && mangler > 0 ? `Fri fragt over $40 – du mangler ${formatPris(mangler)}` : "Levering 1–3 hverdage · 30 dages gratis returret";
}

// ===== Formularen =====
// Browserens egen validering bruges (required, type="email", pattern).
// Fejlbeskederne vises først, når man prøver at bestille.
kasseForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  kasseForm.classList.add("vist_fejl");

  if (!kasseForm.checkValidity()) {
    kasseForm.querySelector(":invalid").focus();
    return;
  }

  const data = new FormData(kasseForm);
  document.querySelector(".tak_tekst").textContent =
    `Hej ${data.get("fornavn")}. Vi har sendt en ordrebekræftelse til ${data.get("email")}, og din pakke er på vej til ${data.get("adresse")}, ${data.get("postnr")} ${data.get("by")}.`;

  gemKurv([]);
  document.querySelector(".kurv_side").hidden = true;
  document.querySelector(".kasse").hidden = true;
  document.querySelector(".tak").hidden = false;
  window.scrollTo({ top: 0 });
});

getHudplejeIder();
