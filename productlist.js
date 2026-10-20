"use strict";

const param = new URLSearchParams(window.location.search);

const productURL = "https://dummyjson.com/products/category/beauty";

const listContainer = document.querySelector(".product_list_container");

function getData(url) {
  fetch(url).then((response) => {
    response.json().then((data) => {
      showProducts(data.products);
    });
  });
}

function showProducts(products) {
  listContainer.innerHTML = "";

  products.forEach((product) => {
    listContainer.innerHTML += `
      <article class="product">

        <img src="${product.thumbnail}" alt="${product.title}" />

        <p>${product.brand ?? ""}</p>

        <h3>${product.title}</h3>

        <p>Rating: ${product.rating}</p>

        <div>
          ${product.discountPercentage ? `<p>${getDiscountPrice(product.price, product.discountPercentage)} kr</p>` : ""}

          <p>${product.price} kr</p>
        </div>

          <a href="productdetails.html?id=${product.id}">
            Læg i kurv
          </a>
    
        ${product.stock === 0 ? "<p class='soldout_tag'>Sold Out</p>" : ""}

      </article>
    `;
  });
}

getData(productURL);

function getDiscountPrice(originalPrice, discount) {
  return Math.round(originalPrice * (100 - discount)) / 100;
}
