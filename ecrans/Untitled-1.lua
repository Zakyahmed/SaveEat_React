<span id="prix">29€</span>
<button id="monBouton">Appliquer réduction 10%</button>
<button id="monBouton2">Appliquer réduction 20%</button>
<button id="monBouton3">Appliquer réduction 30%</button>

let elbtn = document.getElementbyId("monBouton")
let elbtn2 = document.getElementbyId("monBouton2")
let elbtn3 = document.getElementbyId("monBouton3")

elbtn.addEventListener('click', ChangementPrix);
elbtn2.addEventListener('click', ChangementPrix);
elbtn3.addEventListener('click', ChangementPrix);


function ChangementPrix(evt){
        let monSpan = document.getElementbyId("prix");
        let text = monSpan.innerText
        let textereplace = text.replace("€", "")
        let finaltext = Number(textereplace)
    switch (evt.target.id){
        case "monBouton" :
         newprice = finaltext - (finaltext * 10 / 100)
        break;
        case "monBouton2" : 
        newprice = finaltext - (finaltext * 20 / 100)
        break;
        case "monBouton3": 
        newprice = finaltext - (finaltext * 30 / 100)
        break;

    }
    monSpan.innerText = newprice + "€";
}