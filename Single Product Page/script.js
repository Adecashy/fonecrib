import { getFirestore, collection, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { app } from "../firebase/config.js";
import { getElement } from "../functions/utils.js";
import { addToCart, getCartNumbers } from "../functions/cartfunctions.js";

const auth = getAuth(app);
const DB = getFirestore(app);
const userColRef = collection(DB, "users");
const productsColRef = collection(DB, "products");
const displayProductEl = getElement("#display-product");
const productNameEl = getElement("#product-name");
const userImageEl = getElement("#user-image");
const loginBtnEl = getElement("#login-btn")
const logoutBtnEl = getElement("#logout-btn")

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
let currentUser;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user
        displayUser()
        getCartNumbers()
        loginBtnEl.style.display = "none"
    }
    if (!user) {
        logoutBtnEl.style.display = "none"
    }
})

const displayUser = async () => {
    try {
        const docRef = doc(userColRef, currentUser.uid)
        const docSnap = await getDoc(docRef)
        const user = docSnap.data()

        userImageEl.innerHTML = `<img src="${user.image}" alt="user" width="38px">`
    } catch (error) {
        console.error("Error fetching user:", error)
    }
}

logoutBtnEl.addEventListener("click", () => {
    signOut(auth)
    window.location.href = "../homepage/index.html"
})

loginBtnEl.addEventListener("click", ()=>{
    window.location.href = "../signin/index.html"
})

const getSingleProduct = async (id) => {
    try {
        const docRef = doc(productsColRef, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            displayProductEl.innerHTML = `
                <div>
                    <img src="${data.image}" alt="" width="250px">
                </div>
                <div class="info">
                    <h2>${data.name}</h2>          
                    <p>${data.details}</p>          
                    <h4>${data.price}</h4>
                    <button class="cart-btn" data-id="${productId}">Add to Cart</button>          
                </div>
            `;
            const cartButtons = document.querySelectorAll(".cart-btn")
            cartButtons.forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const productId = e.target.getAttribute("data-id")
                    addToCart(productId)
                })
            });
            productNameEl.textContent = `${data.name}`
        } else {
            displayProductEl.innerHTML = "<p>Product not found.</p>";
        }
    } catch (error) {
        console.log("Error getting product:", error);
        displayProductEl.innerHTML = "<p>Failed to load product.</p>";
    } finally {
        console.log("DONE!");
    }
};

getSingleProduct(productId);