"use strict";

const id = new URLSearchParams(window.location.search).get("id") || 4;
const productURL = "https://dummyjson.com/products/" + id;
const kategoriURL = "https://dummyjson.com/products/category/";

const productContainer = document.querySelector(".product_container");
const lignendeContainer = document.querySelector(".lignende_container");

// Farver til læbestift og neglelak (DummyJSON har ingen varianter, så de kommer herfra)
const farveVarianter = [
  { navn: "Klassisk rød", farve: "#991c3a" },
  { navn: "Koral", farve: "#ed7b7c" },
  { navn: "Mørk brun", farve: "#592728" },
  { navn: "Nude", farve: "#c99a7a" },
  { navn: "Rosé", farve: "#d4737f" },
];

// Tekster til fold-ud felterne, som ikke findes i API'et
const ingredienser = {
  makeup: "Vand, glycerin, mica, jernoxider, titaniumdioxid, E-vitamin. Parfumefri og ikke testet på dyr.",
  hudpleje: "Vand, glycerin, sheasmør, aloe vera, panthenol, E-vitamin. Uden parabener.",
  parfume: "Alcohol denat., parfum, aqua. Indeholder naturlige duftstoffer.",
};

const brugsanvisning = {
  makeup: "Påfør direkte eller med en pensel. Byg lag på, til du har den dækning, du ønsker.",
  hudpleje: "Brug morgen og aften på ren hud. Massér ind med blide, cirkulære bevægelser.",
  parfume: "Spray på pulspunkter som håndled og hals på 15 cm afstand. Undgå at gnide.",
};

function getData(url) {
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      showProduct(data);
      getLignende(data);
    })
    .catch(() => {
      productContainer.innerHTML = `<p class="tom_besked">Produktet kunne ikke findes. <a href="productlist.html">Se alle produkter</a></p>`;
    });
}

function showProduct(product) {
  const kategoriSlug = getKategoriSlug(product.category);
  const kategoriNavn = kategorier[kategoriSlug].navn;
  const typeNavn = getTypeNavn(product);
  const foerPris = getFoerPris(product);
  const erFavorit = getFavoritter().includes(product.id);
  const harFarver = product.tags.includes("lipstick") || product.tags.includes("nail polish");

  document.title = product.title + " – ForYou";

  document.querySelector(".broedkrumme ol").innerHTML = `
    <li class="kun_mobil"><a href="productlist.html?kategori=${kategoriSlug}">${ikoner.chevronVenstre}${kategoriNavn} / ${typeNavn}</a></li>
    <li class="kun_desktop"><a href="index.html">Forside</a>${ikoner.chevronHoejre}</li>
    <li class="kun_desktop"><a href="productlist.html?kategori=${kategoriSlug}">${kategoriNavn}</a>${ikoner.chevronHoejre}</li>
    <li class="kun_desktop">${typeNavn}${ikoner.chevronHoejre}</li>
    <li class="kun_desktop" aria-current="page">${product.title}</li>
  `;

  // Billeder til galleriet
  let billeder = "";
  let miniaturer = "";
  let prikker = "";
  product.images.forEach((billede, index) => {
    billeder += `<img src="${billede}" alt="${product.title} – billede ${index + 1}" width="620" height="620" ${index > 0 ? `loading="lazy"` : ""}>`;
    miniaturer += `<button class="miniature ${index === 0 ? "valgt" : ""}" data-index="${index}" aria-label="Vis billede ${index + 1}"><img src="${billede}" alt="" loading="lazy"></button>`;
    prikker += `<span class="${index === 0 ? "aktiv" : ""}"></span>`;
  });

  let farveValg = "";
  if (harFarver) {
    farveVarianter.forEach((variant, index) => {
      farveValg += `
        <label class="farve" title="${variant.navn}">
          <input type="radio" name="farve" value="${variant.navn}" ${index === 0 ? "checked" : ""}>
          <span style="background-color: ${variant.farve}"></span>
          <span class="sr_only">${variant.navn}</span>
        </label>
      `;
    });
  }

  let anmeldelser = "";
  product.reviews.forEach((review) => {
    anmeldelser += `
      <li class="anmeldelse">
        <p class="anmeldelse_top">${getStjerner(review.rating)}<span class="sr_only">${review.rating} ud af 5 stjerner</span> <strong>${review.reviewerName}</strong></p>
        <p>${review.comment}</p>
        <p class="anmeldelse_dato">${new Date(review.date).toLocaleDateString("da-DK")}</p>
      </li>
    `;
  });

  productContainer.innerHTML = `
    <div class="galleri">
      <div class="hovedbillede">
        <div class="billede_spor" tabindex="0" aria-label="Produktbilleder">${billeder}</div>
        <span class="label">-${Math.round(product.discountPercentage)}%</span>
        <button class="favorit_knap favorit_mobil ${erFavorit ? "valgt" : ""}" aria-pressed="${erFavorit}" aria-label="Gem som favorit">${ikoner.hjerte}</button>
        ${product.images.length > 1 ? `
          <button class="pil pil_venstre" aria-label="Forrige billede">${ikoner.chevronVenstre}</button>
          <button class="pil pil_hoejre" aria-label="Næste billede">${ikoner.chevronHoejre}</button>
          <div class="galleri_prikker" aria-hidden="true">${prikker}</div>
        ` : ""}
      </div>
      ${product.images.length > 1 ? `<div class="miniaturer">${miniaturer}</div>` : ""}
    </div>

    <div class="produktinfo">
      <div class="produkt_top">
        <div>
          <a href="productlist.html?kategori=${kategoriSlug}&maerke=${encodeURIComponent(product.brand || "")}" class="label_tekst brand_link">${product.brand || "ForYou"}</a>
          <h1>${product.title}</h1>
          <p class="produkt_rating">
            ${getStjerner(product.rating)}
            <span class="ui_tekst"><span class="sr_only">Bedømt </span>${formatRating(product.rating)}</span>
            <a href="#anmeldelser" class="laes_anmeldelser">Læs ${product.reviews.length} anmeldelser</a>
          </p>
        </div>

        <p class="produkt_pris">
          <span class="stor_pris">${formatPris(product.price)}</span>
          <span class="foer">Før ${formatPris(foerPris)}</span>
          <span class="label">Spar ${formatPris(foerPris - product.price)}</span>
        </p>
      </div>

      <hr>

      <form class="koeb_form">
        ${harFarver ? `
          <fieldset class="variant">
            <legend><span class="ui_tekst">Farve:</span> <span class="farve_navn">${farveVarianter[0].navn}</span></legend>
            <div class="farvevalg">${farveValg}</div>
          </fieldset>
        ` : ""}

        <div class="koeb_bar">
          <p class="bar_pris">
            <span class="ny_pris">${formatPris(product.price)}</span>
            <span class="foer_pris">Før ${formatPris(foerPris)}</span>
          </p>
          <div class="antal_vaelger">
            <button type="button" class="faerre" aria-label="Færre">${ikoner.minus}</button>
            <label><span class="sr_only">Antal</span><input type="number" name="antal" value="1" min="1" max="${product.stock}" inputmode="numeric"></label>
            <button type="button" class="flere" aria-label="Flere">${ikoner.plus}</button>
          </div>
          <button type="submit" class="knap cta">Læg i kurv</button>
          <button type="button" class="favorit_stor ${erFavorit ? "valgt" : ""}" aria-pressed="${erFavorit}" aria-label="Gem som favorit">${ikoner.hjerte}</button>
        </div>
      </form>

      <div class="fold_ud">
        <details open>
          <summary>Om produktet <span class="plus_minus"></span></summary>
          <p>${product.description}</p>
        </details>
        <details>
          <summary>Ingredienser <span class="plus_minus"></span></summary>
          <p>${ingredienser[kategoriSlug]}</p>
        </details>
        <details>
          <summary>Sådan bruger du den <span class="plus_minus"></span></summary>
          <p>${brugsanvisning[kategoriSlug]}</p>
        </details>
        <details>
          <summary>Levering &amp; retur <span class="plus_minus"></span></summary>
          <ul class="levering">
            <li>Levering 1–3 hverdage · Fri fragt over $40</li>
            <li>30 dages gratis returret</li>
            <li>Sikker betaling med MobilePay, kort og Apple Pay</li>
          </ul>
        </details>
        <details id="anmeldelser">
          <summary>Anmeldelser (${product.reviews.length}) <span class="plus_minus"></span></summary>
          <ul class="anmeldelser">${anmeldelser}</ul>
        </details>
      </div>
    </div>
  `;

  aktiverGalleri();
  aktiverKoeb(product);
}

// ===== Galleri: pile, miniaturer og swipe =====
function aktiverGalleri() {
  const spor = document.querySelector(".billede_spor");
  const miniaturer = document.querySelectorAll(".miniature");
  const prikker = document.querySelectorAll(".galleri_prikker span");
  const antal = spor.children.length;
  let aktivt = 0;

  function visBillede(index) {
    aktivt = (index + antal) % antal;
    spor.scrollTo({ left: aktivt * spor.clientWidth, behavior: "smooth" });
  }

  // Når der swipes, opdateres miniaturer og prikker
  spor.addEventListener("scroll", () => {
    aktivt = Math.round(spor.scrollLeft / spor.clientWidth);
    miniaturer.forEach((mini, index) => mini.classList.toggle("valgt", index === aktivt));
    prikker.forEach((prik, index) => prik.classList.toggle("aktiv", index === aktivt));
  });

  miniaturer.forEach((mini) => {
    mini.addEventListener("click", () => visBillede(Number(mini.dataset.index)));
  });

  if (antal > 1) {
    document.querySelector(".pil_venstre").addEventListener("click", () => visBillede(aktivt - 1));
    document.querySelector(".pil_hoejre").addEventListener("click", () => visBillede(aktivt + 1));
  }
}

// ===== Antal, farve, favorit og læg i kurv =====
function aktiverKoeb(product) {
  const form = document.querySelector(".koeb_form");
  const antalFelt = form.antal;

  form.querySelector(".faerre").addEventListener("click", () => {
    antalFelt.value = Math.max(1, Number(antalFelt.value) - 1);
  });

  form.querySelector(".flere").addEventListener("click", () => {
    antalFelt.value = Math.min(product.stock, Number(antalFelt.value) + 1);
  });

  form.querySelectorAll("[name=farve]").forEach((radio) => {
    radio.addEventListener("change", () => {
      form.querySelector(".farve_navn").textContent = radio.value;
    });
  });

  form.addEventListener("submit", (evt) => {
    evt.preventDefault();
    const antal = Math.max(1, Number(antalFelt.value) || 1);
    const farve = form.farve ? form.farve.value : "";
    laegIKurv(product, antal, farve);
  });

  document.querySelectorAll(".favorit_mobil, .favorit_stor").forEach((knap) => {
    knap.addEventListener("click", () => {
      const erFavorit = skiftFavorit(product.id);
      document.querySelectorAll(".favorit_mobil, .favorit_stor").forEach((hjerte) => {
        hjerte.classList.toggle("valgt", erFavorit);
        hjerte.setAttribute("aria-pressed", erFavorit);
      });
    });
  });

  // "Læs anmeldelser" åbner fold-ud feltet
  document.querySelector(".laes_anmeldelser").addEventListener("click", () => {
    document.querySelector("#anmeldelser").open = true;
  });
}

// ===== Lignende produkter fra samme kategori =====
function getLignende(product) {
  fetch(kategoriURL + product.category + "?limit=0")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      const lignende = data.products.filter((p) => p.id !== product.id).slice(0, 4);
      const nyhedsIder = getNyhedsIder(data.products);

      lignendeContainer.innerHTML = "";
      lignende.forEach((p) => {
        lignendeContainer.innerHTML += getProduktkort(p, nyhedsIder.includes(p.id));
      });
      aktiverProduktkort(lignendeContainer, lignende);
    });
}

getData(productURL);
