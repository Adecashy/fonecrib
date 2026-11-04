import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { app } from "../firebase/config.js";
import { getElement } from "../functions/utils.js";
import { addToCart, getCartNumbers } from "../functions/cartfunctions.js";

// Firebase Setup
const auth = getAuth(app)
const DB = getFirestore(app)
const productsColRef = collection(DB, "products")
const userColRef = collection(DB, "users")

// DOM Elements
const userImageEl = document.getElementById("user-image")
const userNameEl = document.getElementById("user-name")
const logoutBtn = document.getElementById("logout-btn")
const displayEl = document.getElementById("display-products")

let currentUser;
let productsLoaded = false

// Monitor Auth State
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user

        await displayUser()
        await getCartNumbers()

        if (!productsLoaded) {
            await fetchProduct()
            productsLoaded = true
        }
    } else {
        currentUser = null
        window.location.href = "../signin/index.html"
    }
})

// Display Logged-in User Info
const displayUser = async () => {
    try {
        const userRef = doc(DB, "users", currentUser.uid)
        const userSnap = await getDoc(userRef)
        
        if (!userSnap.exists()) {
            userNameEl.textContent = "there"
            return
        }

        const user = userSnap.data()
        
        const fullName = user.name?.trim() || "User"
        const nameParts = fullName.split(/\s+/)

        const firstName = nameParts[0]
        userNameEl.textContent = `${firstName}`

        // Generate initials 
        const initials = nameParts.slice(0, 2).map(name => name[0].toUppercase()).join("")

        userImageEl.innerHTML = ""

        const initialsEl = document.createElement("span")
        initialsEl.className = "user-initials"
        initialsEl.textContent = initials

        userImageEl.appendChild(initialsEl)

        // if (user.image) {
        //     userImageEl.innerHTML = ""
        //     const image = document.createElement("img")
        //     image.src = user.image
        //     image.alt = "User profile"

        //     image.onerror = () => {
        //         image.src = "../images & icons/profile.png"
        //     }

        //     userImageEl.appendChild(image)
        // }
    } catch (error) {
        console.error("Error fetching user:", error)
    }
}

// Logout Button
logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth)
        window.location.href = "../homepage/index.html"
    } catch (error) {
        console.log(error)
        alert("Unable to log out. Please try again")
    }
})

// Fetch and Display Products
const fetchProduct = async () => {
    try {
        displayEl.innerHTML = `
            <p class="products-loading">Loading products...</p>
        `;

        const querySnapshot = await getDocs(productsColRef)
        displayEl.innerHTML = ""
        if (querySnapshot.empty) {
            displayEl.innerHTML = `
                <p class="products-loading">
                    No products available at the moment.
                </p>
            `;
            return
        }

        querySnapshot.forEach((item) => {
            const product = item.data()
            const productId = item.id

            const productCard = document.createElement("div")
            productCard.className = "product-card"

            const image = document.createElement("img")
            image.src = product.image || ""
            image.alt = product.name || "Product"
            image.onerror = () => {
                image.style.visibility = "hidden"
            }

            const productName = document.createElement("h3")
            productName.textContent = product.name || "Unname Product"

            const productPrice = document.createElement("p")
            productPrice.textContent = product.price || "$0.00"

            const cartButton = document.createElement("button")
            cartButton.className = "cart-btn"
            cartButton.type = "button"
            cartButton.textContent = "Add to Cart"
            cartButton.dataset.id = productId
            cartButton.addEventListener("click", async () => {
                try {
                    cartButton.disabled = true
                    cartButton.textContent = "Adding..."

                    await addToCart(productId)
                    await getCartNumbers()

                    cartButton.textContent = "Added ✓"
                    setTimeout(() => {
                        cartButton.textContent = "Add to Cart"
                        cartButton.disabled = false
                    }, 1200)
                } catch (error) {
                    console.error(log)
                    alert("Unable to add this product. Please try again.")
                    cartButton.textContent = "Add to Cart"
                    cartButton.disabled = "false"
                }
            })

            const detailsButton = document.createElement("button")
            detailsButton.className = "details-btn"
            detailsButton.type = "button"
            detailsButton.textContent = "View Details"
            detailsButton.addEventListener("click", () => {
                redirectToSinglePage(productId)
            })

            productCard.append(
                image,
                productName,
                productPrice,
                cartButton,
                detailsButton
            )

            displayEl.appendChild(productCard)
        })
    } catch (error) {
        console.error("Error fetching products:", error)
        displayEl.innerHTML = `
            <p class="products-loading">
                Unable to load products. Please refresh the page.
            </p>
        `;
    } finally {
        console.log("DONE fetching products")
    }
}

// Redirect to Single Product Page
const redirectToSinglePage = (id) => {
    window.location.href = `../Single Product Page/index.html?id=${encodeURIComponent(id)}`
}