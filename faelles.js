"use strict";

// ===== Fælles kode som bruges på alle sider =====
// Filen indlæses før sidens egen script, så funktionerne kan bruges overalt.

// Vores tre kategorier og hvilken kategori de hedder i DummyJSON
const kategorier = {
  makeup: { navn: "Makeup", api: "beauty" },
  hudpleje: { navn: "Hudpleje", api: "skin-care" },
  parfume: { navn: "Parfume", api: "fragrances" },
};

// Danske navne til produkttyperne (det andet tag i DummyJSON)
const typeNavne = {
  lipstick: "Læbestift",
  mascara: "Mascara",
  eyeshadow: "Øjenskygge",
  "face powder": "Pudder",
  "nail polish": "Neglelak",
  perfumes: "Eau de parfum",
  "hand soap": "Håndsæbe",
  "body wash": "Bodywash",
  "body lotion": "Bodylotion",
};

// Finder vores kategori (makeup/hudpleje/parfume) ud fra API'ets kategori
function getKategoriSlug(apiKategori) {
  for (const slug in kategorier) {
    if (kategorier[slug].api === apiKategori) {
      return slug;
    }
  }
  return "makeup";
}

function getTypeNavn(product) {
  const tag = product.tags[1] || product.tags[0];
  return typeNavne[tag] || tag;
}

// ===== Priser =====
// DummyJSON's pris er tilbudsprisen. Førprisen regnes tilbage ud fra rabatten.
function getFoerPris(product) {
  return product.price / (1 - product.discountPercentage / 100);
}

function formatPris(pris) {
  return "$" + pris.toFixed(2);
}

// Rating med dansk komma, fx 4,4
function formatRating(rating) {
  return rating.toFixed(1).replace(".", ",");
}

// ===== Ikoner =====
const ikoner = {
  pilHoejre: `<svg class="ikon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  chevronNed: `<svg class="ikon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`,
  chevronHoejre: `<svg class="ikon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`,
  chevronVenstre: `<svg class="ikon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>`,
  minus: `<svg class="ikon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>`,
  plus: `<svg class="ikon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  hjerte: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1 7.8 7.7 7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
};

function getStjerner(rating) {
  const fulde = Math.round(rating);
  let html = `<span class="stjerner" aria-hidden="true">`;
  for (let i = 1; i <= 5; i++) {
    html += `<svg viewBox="0 0 24 24" class="${i <= fulde ? "" : "tom"}"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/></svg>`;
  }
  return html + `</span>`;
}

// ===== Kurv (gemmes i localStorage) =====
function getKurv() {
  try {
    return JSON.parse(localStorage.getItem("foryou_kurv")) || [];
  } catch (error) {
    return [];
  }
}

function gemKurv(kurv) {
  try {
    localStorage.setItem("foryou_kurv", JSON.stringify(kurv));
  } catch (error) {
    // Hvis localStorage er slået fra, virker kurven bare kun på siden
  }
  visKurvAntal();
}

function laegIKurv(product, antal = 1, farve = "") {
  const kurv = getKurv();
  const findes = kurv.find((vare) => vare.id === product.id && vare.farve === farve);

  if (findes) {
    findes.antal += antal;
  } else {
    kurv.push({
      id: product.id,
      title: product.title,
      brand: product.brand,
      price: product.price,
      thumbnail: product.thumbnail,
      farve: farve,
      antal: antal,
    });
  }
  gemKurv(kurv);

  // Bump på kurv-ikonet og en besked, så brugeren kan se det virkede
  document.querySelectorAll(".kurv_antal").forEach((tal) => {
    tal.classList.remove("bump");
    void tal.offsetWidth;
    tal.classList.add("bump");
  });
  visToast(`${product.title} er lagt i kurven`);
}

function visKurvAntal() {
  const antal = getKurv().reduce((sum, vare) => sum + vare.antal, 0);
  document.querySelectorAll(".kurv_antal").forEach((tal) => {
    tal.textContent = antal > 0 ? antal : "";
  });
}

// ===== Favoritter (gemmes også i localStorage) =====
function getFavoritter() {
  try {
    return JSON.parse(localStorage.getItem("foryou_favoritter")) || [];
  } catch (error) {
    return [];
  }
}

function skiftFavorit(id) {
  let favoritter = getFavoritter();
  if (favoritter.includes(id)) {
    favoritter = favoritter.filter((favId) => favId !== id);
  } else {
    favoritter.push(id);
  }
  try {
    localStorage.setItem("foryou_favoritter", JSON.stringify(favoritter));
  } catch (error) {}
  return favoritter.includes(id);
}

// ===== Produktkort =====
// Kortene laves her, så de ser ens ud på forsiden, listen og produktsiden
function getProduktkort(product, erNyhed) {
  const erFavorit = getFavoritter().includes(product.id);

  let label = "";
  if (erNyhed) {
    label = `<span class="label">Nyhed</span>`;
  } else if (product.discountPercentage >= 15) {
    label = `<span class="label label_moerk">-${Math.round(product.discountPercentage)}%</span>`;
  }

  return `
    <article class="produktkort">
      <div class="billedomraade">
        <img src="${product.thumbnail}" alt="${product.title}" loading="lazy" width="300" height="300">
        ${label}
        <button class="favorit_knap ${erFavorit ? "valgt" : ""}" data-id="${product.id}" aria-pressed="${erFavorit}" aria-label="Gem ${product.title} som favorit">${ikoner.hjerte}</button>
      </div>
      <div class="info">
        <p class="label_tekst">${product.brand || "ForYou"}</p>
        <h3><a href="productdetails.html?id=${product.id}">${product.title}</a></h3>
        <p class="rating">${getStjerner(product.rating)}<span class="sr_only">Bedømt </span>${formatRating(product.rating)} (${product.reviews.length})</p>
        <p class="pris">
          <span class="ny_pris">${formatPris(product.price)}</span>
          <span class="foer_pris"><span class="sr_only">Før </span>${formatPris(getFoerPris(product))}</span>
        </p>
        <div class="afstand"></div>
        <button class="knap knap_outline laeg_i_kurv" data-id="${product.id}">Læg i kurv</button>
      </div>
    </article>
  `;
}

// Gør hjerter og "Læg i kurv" klikbare i en container med produktkort
function aktiverProduktkort(container, products) {
  container.querySelectorAll(".laeg_i_kurv").forEach((knap) => {
    knap.addEventListener("click", () => {
      const product = products.find((p) => p.id === Number(knap.dataset.id));
      laegIKurv(product);
    });
  });

  container.querySelectorAll(".favorit_knap").forEach((knap) => {
    knap.addEventListener("click", () => {
      const erFavorit = skiftFavorit(Number(knap.dataset.id));
      knap.classList.toggle("valgt", erFavorit);
      knap.setAttribute("aria-pressed", erFavorit);
    });
  });
}

// De nyeste produkter får "Nyhed"-label
function getNyhedsIder(products) {
  const sorteret = [...products].sort((a, b) => new Date(b.meta.createdAt) - new Date(a.meta.createdAt));
  return sorteret.slice(0, 3).map((product) => product.id);
}

// ===== Toast-besked =====
let toastTimer;
function visToast(tekst) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>${tekst}</span><a href="kurv.html">Se kurv</a>`;
  toast.classList.add("vis");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("vis");
  }, 3000);
}

// ===== Mobilmenu =====
const menuKnap = document.querySelector(".menu_knap");
const hovednavigation = document.querySelector(".hovednavigation");
const menuBaggrund = document.querySelector(".menu_baggrund");

function aabnMenu(aaben) {
  hovednavigation.classList.toggle("aaben", aaben);
  menuBaggrund.hidden = !aaben;
  menuKnap.setAttribute("aria-expanded", aaben);
}

menuKnap.addEventListener("click", () => aabnMenu(true));
document.querySelector(".luk_menu").addEventListener("click", () => aabnMenu(false));
menuBaggrund.addEventListener("click", () => aabnMenu(false));

// ===== Footer: kolonnerne er fold-ud på mobil og åbne på desktop =====
const desktop = window.matchMedia("(min-width: 900px)");

function opdaterFooter() {
  document.querySelectorAll(".footer_kolonne").forEach((kolonne) => {
    kolonne.open = desktop.matches;
  });
}

desktop.addEventListener("change", opdaterFooter);
opdaterFooter();
visKurvAntal();
