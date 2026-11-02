import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, updateDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { app } from "../firebase/config.js";
import { getElement } from "../functions/utils.js";
import { getCartNumbers, getCartItems, removeCartItem } from "../functions/cartfunctions.js";

const auth = getAuth(app);
const DB = getFirestore(app);
const userColRef = collection(DB, "users");
let currentUser;

const displayCartItemEl = document.getElementById("display-cart-items");
const noOfCartEl = document.getElementById("no-of-cart");
const cartNumberEl = document.getElementById("cart-no");
const userImageEl = document.getElementById("user-image");
const logoutBtnEl = document.getElementById("logout-btn");
const proceedBtnEl = document.getElementById("proceed-btn");

const cardForm = document.getElementById("card-payment-form");
const formBtnEl = document.getElementById("form-btn");
const amountToPayInput = document.getElementById("amount-to-pay");

const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const shippingEl = document.getElementById("shipping");
const cartTotalEl = document.getElementById("cart-total");

// Constants for tax and shipping

const TAX_RATE = 0.10; // 10%
const SHIPPING_FEE = 0;

// Format all prices in USD
const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(amount)
}

// Convert product price strings like "$899.00" to numbers
const parsePrice = (price) => {
    return parseFloat(
        String(price || "0").replace(/[^0-9.]/g, "")
    ) || 0
}

// Display Logged-in User Info
const displayUser = async () => {
    try {
        const userRef = doc(DB, "users", currentUser.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
            const user = userSnap.data()

            if (user.image) {
                userImageEl.innerHTML = ""

                const image = document.createElement("img")
                image.src = user.image
                image.alt = "User profile"
                image.width = 38
                image.height = 38

                userImageEl.appendChild(image)
            }
        }
    } catch (error) {
        console.error("Error fetching user:", error)
    }
}

const updateCartBadge = async (cartItems) => {
    let totalQuantity = 0

    cartItems.forEach((item) => {
        const data = item.data()
        totalQuantity += Number(data.quantity) || 1
    })

    noOfCartEl.textContent = totalQuantity
    cartNumberEl.textContent = totalQuantity
}

const updateCartTotal = () => {
    let subtotal = 0;
    const cartItems = document.querySelectorAll(".cart-item");

    cartItems.forEach((item) => {
       const price = parsePrice(item.dataset.price)

        const quantityEl = item.querySelector(".quantity");
        const quantity = Number(quantityEl.textContent) || 1;

        subtotal += price * quantity
    });

    const tax = subtotal * TAX_RATE;
    const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
    const grandTotal = subtotal + tax + shipping;

    subtotalEl.textContent = formatPrice(subtotal);
    taxEl.textContent = formatPrice(tax);
    shippingEl.textContent = formatPrice(shipping)
    cartTotalEl.textContent = formatPrice(grandTotal)

    amountToPayInput.value = formatPrice(grandTotal)

    proceedBtnEl.disabled = subtotal <= 0
};

const createCartItem = (item) => {
    const cartItem = item.data()
    const cartId = item.id

    const wrapper = document.createElement("div")
    wrapper.className = "cart-item"
    wrapper.dataset.price = cartItem.price || "0"

    const left = document.createElement("div")
    left.className = "left"

    const image = document.createElement("img")
    image.src = cartItem.image || ""
    image.alt = cartItem.name || "Product image"
    image.onerror = () => {
        image.style.visibility = "hidden"
    }

    const productInfo = document.createElement("div")

    const name = document.createElement("p")
    name.textContent = cartItem.name || "Unnamed product"

    const price = document.createElement("p")
    price.textContent = formatPrice(parsePrice(cartItem.price))

    productInfo.append(name, price)
    left.append(image, productInfo)

    const right = document.createElement("div")
    right.className = "right"

    const math = document.createElement("div")
    math.className = "math"

    const decreaseBtn = document.createElement("button")
    decreaseBtn.className = "dec-btn"
    decreaseBtn.type = "button"
    decreaseBtn.textContent = "-"
    decreaseBtn.setAttribute("btnId", cartId)
    decreaseBtn.setAttribute("aria-label", "Decrease quantity")

    const quantity = document.createElement("span")
    quantity.className = "quantity"
    quantity.textContent = Number(cartItem.quantity) || 1
    quantity.setAttribute("btnId", cartId)

    const increaseBtn = document.createElement("button")
    increaseBtn.className = "inc-btn"
    increaseBtn.type = "button"
    increaseBtn.textContent = "+"
    increaseBtn.setAttribute("btnId", cartId)
    increaseBtn.setAttribute("aria-label", "Increase quantity")

    math.append(decreaseBtn, quantity, increaseBtn)

    const removeBtn = document.createElement("button")
    removeBtn.className = "delete-btn"
    removeBtn.type = "button"
    removeBtn.textContent = "Remove"
    removeBtn.setAttribute("btnId", cartId)

    right.append(math, removeBtn)
    wrapper.append(left, right)

    return wrapper
}

const attachCartEventListeners = () => {
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const id = button.getAttribute("btnId");

            button.disabled = true

            await removeCartItem(id);
            await fetchCartItems();
        });
    });

    document.querySelectorAll(".inc-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const id = button.getAttribute("btnId");
            const quantityEl = document.querySelector(`.quantity[btnId="${id}"]`);

            const newQuantity = Number(quantityEl.textContent) + 1;
            quantityEl.textContent = newQuantity;
            updateCartTotal();

            button.disabled = true
            try {
                await updateDoc(doc(DB, "users", currentUser.uid, "cart", id), {
                    quantity: newQuantity
                });
                await fetchCartItems()
            } catch (error) {
                console.error("Error updating quantity:", error)
                alert("Unable to update quantity. Please try again")
                await fetchCartItems()
            } finally {
                button.disabled = false
            }
        });
    });

    document.querySelectorAll(".dec-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const id = button.getAttribute("btnId");
            const quantityEl = document.querySelector(`.quantity[btnId="${id}"]`);

            let newQuantity = Number(quantityEl.textContent);

            if (newQuantity <= 1) return
            newQuantity--

            quantityEl.textContent = newQuantity
            updateCartTotal()

            button.disabled = true

            try {
                await updateDoc(doc(DB, "users", currentUser.uid, "cart", id), {
                    quantity: newQuantity
                });
                await fetchCartItems()
            } catch (error) {
                console.error("Error updating quantity:", error)
                alert("unable to update quantity. Please try again")
                await fetchCartItems()
            } finally {
                button.disabled = false
            }
        });
    });
};

// Display empty cart
const displayEmptyCart = (message = "Your shopping cart is empty") => {
    displayCartItemEl.innerHTML = `
        <div class="empty-cart">
            <h3>${message}</h3>
            <p>Discover something you will love.</p>
            <a href="../dashboard/index.html">
                <button type="button">Start Shopping</button>
            </a>
        </div>
    `;

    noOfCartEl.textContent = "0"
    cartNumberEl.textContent = "0"

    subtotalEl.textContent = formatPrice(0)
    taxEl.textContent = formatPrice(0)
    shippingEl.textContent = formatPrice(0)
    cartTotalEl.textContent = formatPrice(0)
    amountToPayInput.value = formatPrice(0)

    proceedBtnEl.disabled = true
}

// Fetch and display cart items
const fetchCartItems = async () => {
    if (!currentUser) return

    try {
        const cartItems = await getCartItems(currentUser.uid);
        if (!cartItems || cartItems.size === 0) {
            displayEmptyCart()
            return
        }

        displayCartItemEl.innerHTML = "";

        cartItems.forEach((item) => {
            displayCartItemEl.appendChild(createCartItem(item))
        });

        await updateCartBadge(cartItems)

        attachCartEventListeners();
        updateCartTotal();

    } catch (error) {
        console.error(error);
        displayCartItemEl.innerHTML = `
            <div class="empty-cart">
                <h3>Unable to load your cart</h3>
                <p>Please refresh the page and try again.</p>
            </div>
        `;
    }
};

// Proceed to Checkout
proceedBtnEl.addEventListener("click", ()=>{
    if (proceedBtnEl.disabled) return

    document.getElementById("section-three").scrollIntoView({
        behavior: "smooth",
        block: "start"
    })
})

const clearCart = async () => {
    try {
        const cartRef = collection(DB, "users", currentUser.uid, "cart");
        const cartSnapshot = await getDocs(cartRef);

        const deletePromises = cartSnapshot.docs.map((item) => 
            deleteDoc(doc(DB, "users", currentUser.uid, "cart", item.id))
        );

        await Promise.all(deletePromises);
        getCartNumbers()

        // Reset UI
        displayCartItemEl.innerHTML = `
            <div class="empty-cart">
                <h3>Thank you! 🎉</h3>
                <p>Your demo checkout has been completed.</p>
                <a href="../dashboard/index.html"><button>Continue Shopping</button></a>
            </div>
        `;
        noOfCartEl.textContent = "0";
        cartNumberEl.textContent = "0"

        subtotalEl.textContent = formatPrice(0)
        taxEl.textContent = formatPrice(0)
        shippingEl.textContent = formatPrice(0)
        cartTotalEl.textContent = formatPrice(0)
        amountToPayInput.value = formatPrice(0)

        await getCartNumbers()

        displayCartItemEl.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        console.error("Error clearing cart:", error);
        alert("There was a problem clearing your cart")
    }
};

// Existing simulated payment flow
const payment = async () => {
    if (!currentUser) {
        alert("Please sign in before checking out.")
        return
    }

    if (document.querySelectorAll(".cart-item").length === 0) {
        alert("Your cart is empty.")
        return
    }

    formBtnEl.disabled = true
    formBtnEl.textContent = "PROCESSING..."

    try {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        alert("Demo checkout completed successfully")
        await clearCart()
        cardForm.reset()
    } catch (error) {
        console.log(error)
        alert("Something went wrong. Please try again")
    } finally {
        formBtnEl.disabled = false
        formBtnEl.textContent = "Pay Now"
    }
};

cardForm.addEventListener("submit", (e) => {
    e.preventDefault()

    if (!cardForm.reportValidity()) return

    payment()
})

logoutBtnEl.addEventListener("click", async () => {
    try {
        await signOut(auth)
        window.location.href = "../homepage/index.html"
    } catch (error) {
        console.log(error)
        alert("Unable to log out. Please try again")
    }
})

// Authentication state
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;

        await displayUser();
        await fetchCartItems();
    } else {
        currentUser = null;
        displayEmptyCart("Please sign in to view your cart");
    }
});


