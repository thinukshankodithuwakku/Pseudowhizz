

let lightMode = localStorage.getItem('lightMode');
window.lightMode = lightMode;
const themeToggle = document.getElementById('theme-toggle');

const changeEditorTheme = (theme) => {

    if(window.editor){
        window.editor.setOption("theme", theme);
    }

}

const enableLightMode = () => {


    
    document.body.classList.add('lightMode');
    localStorage.setItem('lightMode', 'active');



    changeEditorTheme("idea");

    
}

const disableLightMode = () => {
    
    document.body.classList.remove('lightMode');
    localStorage.setItem('lightMode', null);
    changeEditorTheme("darcula");


}


document.addEventListener("DOMContentLoaded", () => {
    if(lightMode === "active") enableLightMode();

    if(themeToggle){
        themeToggle.addEventListener("change", ()=> {

            lightMode = localStorage.getItem('lightMode');
            if(lightMode == null || !themeToggle.checked){
                
                enableLightMode();
            }
            else{

                disableLightMode();
            }
        })
    }

    
})    

