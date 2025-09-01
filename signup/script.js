import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { app } from "../firebase/config.js";
import { getElement } from "../functions/utils.js";

const auth = getAuth(app);
const DB = getFirestore(app);
const usersColRef = collection(DB, "users");

// ELEMENTS
const nameEl = getElement("#signup-name");
const genderEl = getElement("#signup-gender");
const emailEl = getElement("#signup-email");
const passwordEl = getElement("#signup-password");
const confirmPasswordEl = getElement("#confirm-signup-password");
const signupButtonEl = getElement("#signup-btn");
const signupFormEl = getElement("#signup-form");
const errorMessageEl = getElement("#error-message");

// SIGN UP FUNCTION
const signup = async () => {
    if (passwordEl.value !== confirmPasswordEl.value) {
        errorMessageEl.textContent = "Passwords do not match";
        return;
    }

    if (!nameEl.value || !emailEl.value || !passwordEl.value) {
        errorMessageEl.textContent = "Please fill all fields";
        return;
    }

    signupButtonEl.textContent = 'Authenticating...';
    signupButtonEl.disabled = true;
    errorMessageEl.textContent = ""

    try {
        const userCredentials = await createUserWithEmailAndPassword(auth, emailEl.value, passwordEl.value);
        const user = userCredentials.user;

        const newUser = {
            name: nameEl.value,
            gender: genderEl.value,
            email: emailEl.value,
            image: `https://avatar.iran.liara.run/username?username=${nameEl.value}`
        };

        await sendEmailVerification(user);
        const docRef = doc(usersColRef, user.uid);
        await setDoc(docRef, newUser);

        window.location.href = "../signin/index.html";

    } catch (error) {
        console.error(error);

        if (error.code === "auth/email-already-in-use") {
            errorMessageEl.textContent = "Email already exists.";
        } else if (error.code === "auth/weak-password") {
            errorMessageEl.textContent = "Password must be at least 6 characters.";
        } else {
            errorMessageEl.textContent = "Something went wrong. Please try again.";
        }
    } finally {
        signupButtonEl.textContent = 'Sign Up';
        signupButtonEl.disabled = false;
    }
};

signupFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    signup();
});
