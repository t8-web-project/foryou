// ===== Forside =====
// JavaScript der KUN gælder denne side.

console.log("index.js er indlæst");

let slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
  showSlides((slideIndex += n));
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides((slideIndex = n));
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {
    slideIndex = 1;
  }
  if (n < 1) {
    slideIndex = slides.length;
  }
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex - 1].style.display = "block";
  dots[slideIndex - 1].className += " active";
}

("use strict");

const productURL = "https://dummyjson.com/products/category/beauty?limit=4&skip=0";

const listContainer = document.querySelector(".product_list_container");

async function getData(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Kunne ikke hente produkterne");
    }

    const data = await response.json();
    showProducts(data.products);
  } catch (error) {
    console.error("Fejl:", error);

    if (listContainer) {
      listContainer.innerHTML = "<p>Produkterne kunne ikke indlæses.</p>";
    }
  }
}

function showProducts(products) {
  if (!listContainer) return;

  listContainer.innerHTML = "";

  products.forEach((product) => {
    const discount = Math.round(product.discountPercentage || 0);
    const discountedPrice = getDiscountPrice(product.price, product.discountPercentage || 0);

    listContainer.innerHTML += `
      <article class="product">

        ${
          discount > 0
            ? `
          <span class="product-badge">-${discount}%</span>
        `
            : ""
        }

        <img src="${product.thumbnail}" alt="${product.title}">

        <div class="product-info">
          <p class="product-brand">
            ${product.brand || "Beauty"}
          </p>

          <h3 class="product-title">${product.title}</h3>

          <p class="product-rating">
            <span class="stars">★★★★★</span>
            ${Number(product.rating || 0).toFixed(1)}
          </p>

          <div class="product-prices">
            <span class="product-price">
              $${discountedPrice.toFixed(2)}
            </span>

            ${
              discount > 0
                ? `
              <span class="product-old-price">
                $${Number(product.price).toFixed(2)}
              </span>
            `
                : ""
            }
          </div>

          <a
            href="productdetails.html?id=${product.id}"
            class="product-button"
          >
            Se produkt
          </a>
        </div>
      </article>
    `;
  });
}

function getDiscountPrice(originalPrice, discount) {
  return originalPrice * (1 - discount / 100);
}

getData(productURL);
