import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { app } from "../firebase/config.js";
import { getElement } from "../functions/utils.js";
import { getCartNumbers, getCartItems, removeCartItem } from "../functions/cartfunctions.js";

const auth = getAuth(app);
const DB = getFirestore(app);
const userColRef = collection(DB, "users");
let currentUser;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        getCartNumbers();
        fetchCartItems();
        displayUser()
    }
    if (!user) {
        alert("kindly login.");
        return;
    }
});

const displayCartItemEl = getElement("#display-cart-items");
const noOfCartEl = getElement("#no-of-cart")
const userImageEl = getElement("#user-image")

// Elements for totals breakdown
let subtotalEl = getElement("#subtotal");
let taxEl = getElement("#tax");
let shippingEl = getElement("#shipping");
const cartTotalEl = getElement("#cart-total");

// Constants for tax and shipping
const TAX_RATE = 0.01; // 10%
const SHIPPING_FEE = 0.02; // fixed fee, adjust as needed

// Display Logged-in User Info
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

const updateCartTotal = () => {
    let subtotal = 0;
    const cartItems = document.querySelectorAll(".cart-item");

    cartItems.forEach(item => {
        let price = item.dataset.price || "0";
        price = parseFloat(price.replace(/[^0-9.]/g, ""));

        const quantityEl = item.querySelector(".quantity");
        const quantity = parseInt(quantityEl.textContent.trim() || "0", 10);

        if (!isNaN(price) && !isNaN(quantity)) {
            subtotal += price * quantity;
        }
    });

    const tax = subtotal * TAX_RATE;
    const shipping = subtotal * SHIPPING_FEE;
    const grandTotal = subtotal + tax + shipping;

    // Create totals elements if they don't exist
    if (!subtotalEl) {
        subtotalEl = document.createElement("p");
        subtotalEl.id = "subtotal";
        cartTotalEl.parentNode.insertBefore(subtotalEl, cartTotalEl);
    }
    if (!taxEl) {
        taxEl = document.createElement("p");
        taxEl.id = "tax";
        cartTotalEl.parentNode.insertBefore(taxEl, cartTotalEl);
    }
    if (!shippingEl) {
        shippingEl = document.createElement("p");
        shippingEl.id = "shipping";
        cartTotalEl.parentNode.insertBefore(shippingEl, cartTotalEl);
    }

    subtotalEl.textContent = ` $${subtotal.toFixed(2)}`;
    taxEl.textContent = ` $${tax.toFixed(2)}`;
    shippingEl.textContent = ` $${shipping.toFixed(2)}`;
    cartTotalEl.textContent = ` $${grandTotal.toFixed(2)}`;
};

const attachCartEventListeners = () => {
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const cartId = e.target.getAttribute("btnId");
            await removeCartItem(cartId);
            fetchCartItems();
            getCartNumbers();
        });
    });

    document.querySelectorAll(".inc-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("btnId");
            const quantityEl = document.querySelector(`.quantity[btnId="${id}"]`);
            let newQuantity = parseInt(quantityEl.textContent) + 1;
            quantityEl.textContent = newQuantity;

            await updateDoc(doc(DB, "users", currentUser.uid, "cart", id), {
                quantity: newQuantity
            });

            getCartNumbers();
            updateCartTotal();
        });
    });

    document.querySelectorAll(".dec-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("btnId");
            const quantityEl = document.querySelector(`.quantity[btnId="${id}"]`);
            let newQuantity = parseInt(quantityEl.textContent);

            if (newQuantity > 1) {
                newQuantity--;
                quantityEl.textContent = newQuantity;

                await updateDoc(doc(DB, "users", currentUser.uid, "cart", id), {
                    quantity: newQuantity
                });

                getCartNumbers();
                updateCartTotal();
            }
        });
    });
};

const fetchCartItems = async () => {
    try {
        const cartItems = await getCartItems(currentUser.uid);
        noOfCartEl.textContent = cartItems.size

        if (!cartItems || cartItems.size === 0) {
            displayCartItemEl.innerHTML = `
                <div class="empty-cart">
                    <h3>Oops! Your cart is empty</h3>
                    <a href="../dashboard/index.html"><button>Start Shopping</button></a>
                </div>
            `;
            if (subtotalEl) subtotalEl.textContent = "$0.00";
            if (taxEl) taxEl.textContent = "$0.00";
            if (shippingEl) shippingEl.textContent = "$0.00";
            cartTotalEl.textContent = "$0.00";
            return;
        }

        displayCartItemEl.innerHTML = "";

        cartItems.forEach(item => {
            const cartItem = item.data();
            displayCartItemEl.innerHTML += `
                <div class="cart-item" btnId="${item.id}" data-price="${cartItem.price}">
                    <div class="left">
                        <img src="${cartItem.image}" alt="" width="80px">
                        <div>
                            <p>${cartItem.name}</p>          
                            <p>${cartItem.price}</p> 
                        </div>
                    </div>
                    <div class="right">
                        <div class="math">
                            <button class="dec-btn" btnId="${item.id}">-</button>
                            <span class="quantity" btnId="${item.id}">${cartItem.quantity || 1}</span>
                            <button class="inc-btn" btnId="${item.id}">+</button>
                        </div>
                        <button class="delete-btn" btnId="${item.id}">Remove</button>          
                    </div>
                </div>
            `;
        });

        attachCartEventListeners();
        updateCartTotal();

    } catch (error) {
        console.error(error);
    }
};