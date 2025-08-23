import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { app } from "../firebase/config.js";
import { getElement } from "../functions/utils.js";
import { addToCart, getCartNumbers } from "../functions/cartfunctions.js";

// Firebase Setup
const auth = getAuth(app)
const DB = getFirestore(app)
const productsColRef = collection(DB, "products")
const userColRef = collection(DB, "users")

// DOM Elements
const userImageEl = getElement("#user-image")
const userNameEl = getElement("#user-name")
const logoutBtn = getElement("#logout-btn")
const displayEl = getElement("#display-products")

let currentUser;

// Monitor Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user
        displayUser()
        fetchProduct()
        getCartNumbers()
    }
})

// Display Logged-in User Info
const displayUser = async () => {
    try {
        const docRef = doc(userColRef, currentUser.uid)
        const docSnap = await getDoc(docRef)
        const user = docSnap.data()

        userNameEl.textContent = `${user.name.split(" ")[1]}!`
        userImageEl.innerHTML = `<img src="${user.image}" alt="user" width="38px">`
    } catch (error) {
        console.error("Error fetching user:", error)
    }
}

// Logout Button
logoutBtn.addEventListener("click", () => {
    signOut(auth)
    window.location.href = "../homepage/index.html"
})

// Fetch and Display Products
const fetchProduct = async () => {
    try {
        const querySnapshot = await getDocs(productsColRef)
        querySnapshot.forEach((ele) => {
            const product = ele.data()
            const productId = ele.id

            displayEl.innerHTML += `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.name}" width="100px"> 
                    <p>${product.name}</p>                                      
                    <h5>${product.price}</h5>  
                    <button class="cart-btn" data-id="${productId}">Add to Cart</button>
                    <button class="details-btn" data-id="${productId}">View Details</button>                               
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
        console.error("Error fetching products:", error)
    } finally {
        console.log("DONE fetching products")
    }
}

// Redirect to Single Product Page
const redirectToSinglePage = (id) => {
    window.location.href = `../Single Product Page/index.html?id=${id}`
}