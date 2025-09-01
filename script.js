import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { app } from "./firebase/config.js"
import { getElement } from "./functions/utils.js"
import { addToCart } from "./functions/cartfunctions.js";

const auth = getAuth(app)
const DB = getFirestore(app)
const recipeColRef = collection(DB, "products")
let currentUser;

const displayProductsEl = getElement("#display-products")
const loginBtnEl = getElement("#login-btn")
const getStartedBtnEl = getElement("#get-started-btn")
const cartBtnEl = getElement("#cart-btn")

onAuthStateChanged(auth, (user) => {
    if (!user) {
        cartBtnEl.addEventListener("click", ()=>{
            alert("Please login")
        })
    }
})

loginBtnEl.addEventListener("click", ()=>{
    window.location.href = "./signin/index.html"
})

getStartedBtnEl.addEventListener("click", ()=>{
    window.location.href = "./signup/index.html"
})

const displayProducts = async () => {
    try {
        const querySnapshot = await getDocs(recipeColRef)
        displayProductsEl.innerHTML = "";

        querySnapshot.forEach(docSnap => {
            const product = docSnap.data()
            console.log(product);
            const productId = docSnap.id
            
            displayProductsEl.innerHTML += `
                 <div class="product-card">
                    <img src="${product.image}" alt="" width="120px">
                    <p>${product.name}</p>
                    <h5>${product.price}</h5>
                    <button class="cart-btn" data-id="${productId}">Add to Cart</button>
                    <button class="details-btn" data-id="${productId}">View details</button>
                 </div>
            `
        })

        // Event: Add to Cart
        const cartButtons = document.querySelectorAll(".cart-btn")
        cartButtons.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const productId = e.target.getAttribute("data-id")
                addToCart(productId)
            })
        })

        // Event: View Details
        const viewButtons = document.querySelectorAll(".details-btn")
        viewButtons.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const productId = e.target.getAttribute("data-id")
                redirectToSinglePage(productId)
            })
        })
    } catch (error) {
        console.log(error)
    }
}

displayProducts()

// Redirect to Single Product Page
const redirectToSinglePage = (id) => {
    window.location.href = `./Single Product Page/index.html?id=${id}`
}