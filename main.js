
const jsConfetti = new JSConfetti();

function getPokemonData(q, cb){
    $.get(`https://pokeapi.co/api/v2/pokemon/${q}`, cb);
}

const getEvolution = d => {
    let chain = []
    let data = d.chain;
    do {
        chain.push(data.species.name);
        data = data['evolves_to'][0];
      } while (!!data && data.hasOwnProperty('evolves_to'));
    return chain;
}

const arraySame = (array1, array2) => { return (array1.length == array2.length) && array1.every(function(element, index) {
    return element === array2[index]; 
})};

let pokeData = {};
let guesses = 0;

function loadPokemon(today){
    pokeData = {};
    guesses = 0;
    $("table").empty();
    $("#guesser").off("autocompleteselect");
    $("#hint").removeClass("show");
    $("#q").removeClass("show");
    $("#guesser").attr("placeholder", "loading...").prop("disabled", true);
    let seeded = Math.random();
    if(today)
        seeded = new Math.seedrandom(Math.floor(new Date()/8.64e7))();
    let num = Math.floor(seeded * (905) + 1);
    getPokemonData(num, data => {
        pokeData['name'] = data.name;
        pokeData['types'] = data.types.map(x => x.type.name).sort();
        let src = data.sprites.other['official-artwork']['front_default'];
        $("#hint").attr('src', src);
        $.get(data.species.url, data2 => {
            pokeData['generation'] = data2.generation.url.split('generation/')[1].replace('/','');
            $.get(data2['evolution_chain'].url, data3 => {
                pokeData['evolution'] =  getEvolution(data3);
                loadAutocomplete();
            });
        });
    });
}

function win(){
    $("#winDialog").html(`You guessed <span class="name">${pokeData['name']}</span> in ${guesses} ${(guesses===1 ? "guess!" : "guesses.")} <br/><br/>Come back tomorrow, or click "try another" in the bottom to guess a new Pokemon.`);
    $("#guesser").prop('disabled', true);
    $("#hint").toggleClass("show");
    $("#q").toggleClass("show");
    setTimeout(() => {jsConfetti.addConfetti()}, 250);
    $("#winDialog").dialog("open");
}

function lose(){
    $("#winDialog").attr("title", "You Lost");
    $("#winDialog").html(`The Pokemon was: <b class="name">${pokeData['name']}</b>.<br/><br/>Come back tomorrow, or click "try another" in the bottom to guess a new Pokemon.`);
    $("#guesser").prop('disabled', true);
    $("#hint").toggleClass("show");
    $("#q").toggleClass("show");
    $("#winDialog").dialog("open");
}

function findPokemon(_e, ui){
    getPokemonData(ui.item.label.toLowerCase(), data => {
        let d = {};
        d['name'] = data.name;
        d['types'] = data.types.map(x => x.type.name).sort();
        d['src'] = data.sprites.other['official-artwork']['front_default'];
        $.get(data.species.url, data2 => {
            d['generation'] = data2.generation.url.split('generation/')[1].replace('/','');
            $("#guesser").val("");
            console.log(pokeData.species, d.species);
            addPokemonToList(d);
            if(data.name === pokeData.name){ win(); }
        })
    });
}

function addPokemonToList(data){
    guesses++;
    let str = `<tr>
    <td class="num">${guesses}.</td>
    <td class="pokeimg" ><img src="${data.src}"></td>
    <td class="name ${(data.name === pokeData.name ? 'correct' : (pokeData.evolution.includes(data.name) ? "almost" : "incorrect"))}"><b>${data.name}</b></td>
    <td class="poketype ${(arraySame(data.types, pokeData.types) ? "correct" : (data.types.some(r=> pokeData.types.includes(r)) ? "almost" : "incorrect"))}"><b>${data.types.join(', ')}</b></td>
    <td class="${(data.generation === pokeData.generation ? "correct" : "incorrect")}">GEN ${data.generation}</td>
    </tr>`

    $("table").append(str);
    if(guesses===6){lose();}
}

function loadAutocomplete(){
    $.get("https://raw.githubusercontent.com/sindresorhus/pokemon/main/data/en.json", data => {
        $("#guesser").autocomplete({ source: JSON.parse(data) });
        $("#guesser").attr("placeholder", "guess a pokemon...").prop("disabled", false);
        $("#guesser").on("autocompleteselect", findPokemon);
    })
}

$( "#winDialog" ).dialog({ autoOpen: false, resizable: false, modal:true, draggable: false });
$( "#help" ).dialog({ autoOpen: false, resizable: false, modal:true, draggable: false });

$(".help").click(function(){$("#help").dialog("open")})

loadPokemon(true);

$(".another").on('click', e => {
    loadPokemon(false);
})