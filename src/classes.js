/* Prototype classes: distinct weapons, resource profiles and ability effects. */
const HERO_CLASSES = {
    paladin:{name:'Paladín de la Luz',icon:'🛡️',weapon:'Espada de Cruzado',weaponIcon:'⚔️',stats:{maxHp:120,maxMp:60,armor:8,spellPower:18,maxSpeed:300},summary:'Espada cercana, curación e inmunidad. Resistente y fácil de empezar.'},
    mage:{name:'Maga de la Escarcha',icon:'🧙‍♀️',weapon:'Bastón de Escarcha',weaponIcon:'🪄',stats:{maxHp:90,maxMp:100,armor:3,spellPower:22,maxSpeed:300},summary:'Bastón a distancia, hielo que ralentiza y meditación para recuperar maná.',spells:[
        ['Descarga arcana','🪄','Arcano',0,'Proyectil a distancia · alcance 400'],['Lanza de hielo','❄️','Hielo',15,'Proyectil y ralentización durante 4 s'],['Meditación','💧','Meditar',0,'Recupera 35 maná; no se gasta si está completo'],['Barrera arcana','🔮','Barrera',30,'Inmunidad durante 3 s'],['Nova de hielo','🌨️','Nova',40,'Daño de área y ralentización durante 5 s']
    ]},
    ranger:{name:'Exploradora del Bosque',icon:'🏹',weapon:'Arco de Exploradora',weaponIcon:'🏹',stats:{maxHp:105,maxMp:70,armor:5,spellPower:20,maxSpeed:320},summary:'Arco a distancia, disparo doble, vendas y una carrera rápida para escapar.',spells:[
        ['Flecha precisa','🏹','Flecha',0,'Ataque a distancia · alcance 450'],['Disparo doble','🎯','Doble',15,'Dos proyectiles sobre el mismo objetivo'],['Vendas','🩹','Vendas',10,'Recupera vida; no se gasta con vida completa'],['Paso veloz','💨','Correr',20,'Velocidad +50 % durante 6 s'],['Lluvia de flechas','🌧️','Lluvia',40,'Daño de área a enemigos dentro de 400']
    ]}
};
