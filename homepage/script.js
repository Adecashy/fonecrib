import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { app } from "../firebase/config.js"
import { getElement } from "../functions/utils.js"
import { addToCart, getCartNumbers } from "../functions/cartfunctions.js";

const auth = getAuth(app)
const DB = getFirestore(app)
const productsColRef = collection(DB, "products")

const displayProductsEl = getElement("#display-products")
const loginBtnEl = getElement("#login-btn")
const getStartedBtnEl = getElement("#get-started-btn")
const cartBtnEl = getElement("#cart-btn")

let currentUser = null

onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    await getCartNumbers()
})

cartBtnEl?.addEventListener("click", () => {
    if (!currentUser) {
        alert("Please login to view cart")
        return
    }
})

loginBtnEl?.addEventListener("click", ()=>{
    window.location.href = "./signin/index.html"
})

getStartedBtnEl?.addEventListener("click", ()=>{
    window.location.href = "./signup/index.html"
})

const displayProducts = async () => {
    if (!displayProductsEl) return;

    try {
        displayProductsEl.innerHTML = `
            <div class="products-message">
                <p>Loading products...</p>
            </div>
        `

        const querySnapshot = await getDocs(productsColRef)
        displayProductsEl.innerHTML = "";

        if (querySnapshot.empty) {
            displayProductsEl.innerHTML = `
                <div class="products-message">
                    <h3>No products available</h3>
                    <p>Please check back later.</p>
                </div>
            `;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const product = docSnap.data()
            // console.log(product);
            const productId = docSnap.id

            const productCard = document.createElement("div")
            productCard.className = "product-card"

            const productImage = document.createElement("img")
            productImage.src = product.image || ""
            productImage.alt = product.name || "Product image"
            productImage.loading = "lazy"

            productImage.addEventListener("error", () => {
                productImage.style.display = "none"
            })

            const productName = document.createElement("h3")
            productName.textContent = product.name || "Unnamed Product"

            const productDetails = document.createElement("p")
            productDetails.className = "product-details"
            productDetails.textContent = product.details || "No product details available."

            const productPrice = document.createElement("h4")
            productPrice.className = "product-price"
            productPrice.textContent = product.price || "Price unavailable"

            const cartButton = document.createElement("button")
            cartButton.className = "cart-btn"
            cartButton.textContent = "Add to Cart"
            cartButton.type = "button"

            cartButton.addEventListener("click", async () => {
                await addToCart(productId);
            });

            const detailsButton = document.createElement("button")
            detailsButton.className = "details-btn"
            detailsButton.textContent = "View Details"
            detailsButton.type = "button"

            detailsButton.addEventListener("click", () => {
                redirectToSinglePage(productId)
            })

            productCard.append(
                productImage,
                productName,
                productDetails,
                productPrice,
                cartButton,
                detailsButton
            )

            displayProductsEl.appendChild(productCard)
        })

    } catch (error) {
        console.error("Error displaying products:", error);
        displayProductsEl.innerHTML = `
            <div class="products-message">
                <h3>Something went wrong</h3>
                <p>We couldn't load the products. Please refresh the page.</p>
            </div>
        `
    }
}

// Redirect to Single Product Page
const redirectToSinglePage = (id) => {
    window.location.href = `./Single Product Page/index.html?id=${id}`
}

displayProducts()
