import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, getDocs, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { app } from "../firebase/config.js";
import { getElement } from "../functions/utils.js";

const auth = getAuth(app);
const DB = getFirestore(app);
const productsColRef = collection(DB, "products");
let currentUser;

export const addToCart = async (productId) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert("Please log in to add to cart.");
            return;
        }

        const productDocRef = doc(DB, "products", productId);
        const docSnap = await getDoc(productDocRef);

        if (!docSnap.exists()) {
            console.error("Product not found");
            alert("Product not found.");
            return;
        }

        const product = docSnap.data();
        const userCartRef = collection(DB, `users/${user.uid}/cart`);
        await addDoc(userCartRef, product);

        alert(`${product.name} added to cart!`);
        await getCartNumbers(); // Await ensures update after adding
    } catch (error) {
        console.error("Error adding to cart:", error);
    }
};

export const getCartNumbers = async () => {
    try {
        const cartEl = getElement("#cart-no");
        const user = auth.currentUser;

        if (!user) {
            cartEl.textContent = "0";
            return;
        }

        const cartItems = await getCartItems(user.uid);
        cartEl.textContent = cartItems?.size || 0;
    } catch (error) {
        console.error("Error getting cart numbers:", error);
    }
};

export const getCartItems = async (uid) => {
    try {
        if (uid) {
            const userCartRef = collection(DB, `users/${uid}/cart`);
            const docSnap = await getDocs(userCartRef);
            return docSnap;
        }
        return null;
    } catch (error) {
        console.error("Error fetching cart items:", error);
        return null;
    }
};

export const removeCartItem = async (id) => {
    try {
        const user = auth.currentUser;

        if (!user) {
            alert("User not authenticated");
            return;
        }

        const docRef = doc(DB, `users/${user.uid}/cart/${id}`);
        await deleteDoc(docRef);

        await getCartNumbers();
        alert("Item deleted");
    } catch (error) {
        console.error("Error removing item:", error);
    }
};