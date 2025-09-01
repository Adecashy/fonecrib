import { getAuth, signInWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js"
        import { app } from "../firebase/config.js"
        import { getElement } from "../functions/utils.js"

        const auth = getAuth(app)

        // ELEMENTS
        const signInForm = getElement("#signin-form")
        const signinEmail = getElement("#signin-email")
        const signinPassword = getElement("#signin-password")
        const signinButtonEl = getElement("#signin-btn")
        const errorMessageEl = getElement("#error-message")
        
        // SIGN UP
        const signIn = async () => {
            signinButtonEl.disabled = true
            signinButtonEl.textContent = "Loading..."
            errorMessageEl.textContent = ""
            try {
                const userCredentials = await signInWithEmailAndPassword(auth, signinEmail.value, signinPassword.value)
                console.log(userCredentials.user.emailVerified)
                if(userCredentials.user && userCredentials.user.emailVerified){
                window.location.href = "../dashboard/index.html"
                } else{
                    alert("Kindly verify your email")
                }
            } catch (error) {
                console.log(error)
                if(error.code == "auth/invalid-credential"){
                    errorMessageEl.textContent = "Email or password is incorrect"
                } else {
                    errorMessageEl.textContent = "Something went wrong"
                }
                
            } finally{
                signinButtonEl.disabled = false
                signinButtonEl.textContent = "Login"
            }
        }

        signInForm.addEventListener("submit", (e)=>{
            e.preventDefault()
            signIn()
        })