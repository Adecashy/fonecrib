export const getElement = (selector)=>{
    const ele = document.querySelector(selector)
    if(!ele) {
        console.log(`Element nt fund ${selector}`)
        return
    }
    return ele
}