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
const cartBtnEl = getElement("#cart-btn")

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
let currentUser;

onAuthStateChanged(auth, async (user) => {
    currentUser = user

    if (user) {
        loginBtnEl.style.display = "none"
        logoutBtnEl.style.display = "block"

        await displayUser()
    } else {
        loginBtnEl.style.display = "block"
        logoutBtnEl.style.display = "none"

        userImageEl.innerHTML = `
            <img src="../images & icons/profile.png" alt="Profile" >
        `
    }

    await getCartNumbers()
})

const displayUser = async () => {
    try {
        if (!currentUser) return

        const docRef = doc(userColRef, currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            const userData = docSnap.data()
        }
        userImageEl.innerHTML = `
            <img
                src="${userData.image || "../images & icons/profile.png"}"
                alt="User profile"
            >
        `
    } catch (error) {
        console.error("Error fetching user:", error)
    }
}

loginBtnEl.addEventListener("click", ()=>{
    window.location.href = "../signin/index.html"
})

logoutBtnEl.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "../homepage/index.html";
    } catch (error) {
        console.error("Error logging out:", error);
        alert("Unable to logout. Please try again.");
    }
});

cartBtnEl.addEventListener("click", () => {
    if (!currentUser) {
        alert("Please login to view your cart.");
        return;
    }

    // Add your existing cart page navigation here
});

const getSingleProduct = async (id) => {
    if (!id) {
        displayProductEl.innerHTML = `
            <div class="product-message">
                <h2>Product not found</h2>
                <p>No product ID was provided.</p>
                <a href="../homepage/index.html">Return to homepage</a>
            </div>
        `;
        return;
    }

    try {
        const docRef = doc(productsColRef, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            displayProductEl.innerHTML = `
                <div class="product-message">
                    <h2>Product not found</h2>
                    <p>This product may have been removed or is no longer available.</p>
                    <a href="../homepage/index.html">Continue shopping</a>
                </div>
            `;
            return
        }

        const data = docSnap.data()

        productNameEl.textcontent = data.name || "Product"

        document.title = `${data.name || "Product"} | FoneCrib`

        const imageWrapper = document.createElement("div")
        imageWrapper.className = "product-image-wrapper"

        const productImage = document.createElement("img")
        productImage.src = data.image || ""
        productImage.alt = data.name || "Product image"

        productImage.addEventListener("error", () => {
            productImage.alt = "Product image unavailable"
            productImage.src = ""
        })

        imageWrapper.appendChild(productImage)

        const productInfo = document.createElement("div")
        productInfo.className = "product-info"

        const tag = document.createElement("span")
        tag.className = "product-tag"
        tag.textContent = "FONECRIB PRODUCT"

        const name = document.createElement("h1")
        name.textContent = data.name || "Unamed Product"

        const description = document.createElement("p")
        description.className = "product-description"
        description.textContent = data.details || "No product description available."

        const price = document.createElement("h2")
        price.className = "product-price"
        price.textContent = data.price || "Price unavailable"

        const divider = document.createElement("div")
        divider.className = "product-divider"

        const benefits = document.createElement("div")
        benefits.className = "product-benefits"

        benefits.innerHTML = `
            <p><span>✓</span> Quality products</p>
            <p><span>✓</span> Easy and secure shopping</p>
            <p><span>✓</span> Customer support available</p>
        `;

        const addButton = document.createElement("button")
        addButton.className = "cart-btn"
        addButton.type = "button"
        addButton.textContent = "Add to Cart"

        addButton.addEventListener("click", async () => {
            if (!currentUser) {
                alert("Please login to add this product to your cart.")
                return
            }

            await addToCart(id)
        })

        productInfo.append(
            tag,
            name,
            description,
            price,
            divider,
            benefits,
            addButton
        )

        displayProductEl.innerHTML = ""
        displayProductEl.append(imageWrapper, productInfo)

    } catch (error) {
        console.log("Error getting product:", error);
        
        displayProductEl.innerHTML = `
            <div class="product-message">
                <h2>Something went wrong</h2>
                <p>We couldn't load this product. Please refresh the page.</p>
                <a href="../homepage/index.html">Return to homepage</a>
            </div>
        `
    } finally {
        console.log("DONE!");
    }
};

getSingleProduct(productId);