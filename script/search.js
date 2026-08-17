// ============================================
// SEARCH – Suchlogik
// Abhängigkeiten: api.js, render.js, State aus script.js
// ============================================

function clearContent() {
    document.getElementById("content").innerHTML = "";
}

function resetSearch() {
    searchResults = [];
    searchDescriptions = [];
    filteredIndices = [];
    isLoading = false;
    isSearchMode = false;
    document.getElementById("loader").classList.add("d_none");
    document.querySelector(".load_more button").disabled = false;
    document.querySelector("input").value = "";
    document.getElementById("search_hint").classList.remove("visible");
    clearContent();
    renderPokemonCard(0);
}

async function searchPokemon() {
    const input = document.querySelector("input").value.toLowerCase();
    clearContent();

    if (input.length === 0) {
        document.getElementById("search_hint").classList.remove("visible");
        resetSearch();
        return;
    }

    const isNumber = !isNaN(input) && input.trim() !== "";
    if (!isNumber && input.length < 3) {
        document.getElementById("search_hint").classList.add("visible");
        isSearchMode = true;
        setMoreBtn(true);
        return;
    }

    document.getElementById("search_hint").classList.remove("visible");
    isSearchMode = true;
    setMoreBtn(true);

    const cardRef = document.getElementById("content");
    if (!searchLocally(input, cardRef)) await searchGlobally(input, cardRef);

    const loader = document.getElementById("loader");
    loader.classList.remove("active");
    loader.classList.add("d_none");
}

function searchLocally(input, cardRef) {
    const filtered = pokemonInfos.filter(
        (p) => p.name.includes(input) || String(p.id) === String(Number(input))
    );
    if (filtered.length === 0) return false;

    filteredIndices = filtered.map((p) => pokemonInfos.indexOf(p));
    filtered.forEach((p) => {
        const index = pokemonInfos.indexOf(p);
        cardRef.innerHTML += getPokemonCardTemplate(index);
        renderCardContent(index);
    });
    return true;
}

async function searchGlobally(input, cardRef) {
    const matches = allPokemonList.filter(
        (p) => p.name.includes(input) || p.url.includes(`/pokemon/${Number(input)}/`)
    );
    if (matches.length === 0) {
        cardRef.innerHTML = `<p>No Pokémon found for "${input}"</p>`;
        return;
    }
    await fetchSearchData(matches);
    renderSearchCards(cardRef);
}

async function fetchSearchData(matches) {
    const results = (
        await Promise.all(
            matches.map(async (match) => {
                const info = await safeFetch(match.url);
                if (!info) return null;
                const description = await getPkmDescriptionByUrl(info.species.url);
                return description ? [info, description] : null;
            })
        )
    ).filter(Boolean);

    searchResults = results.map(([info]) => info);
    searchDescriptions = results.map(([, description]) => description);
    await Promise.all(searchResults.map((info) => getFrontPicture(info.id)));
    isSearchMode = true;
    const loader = document.getElementById("loader");
    loader.classList.remove("active");
    loader.classList.add("d_none");
}

function renderSearchCards(cardRef) {
    cardRef.innerHTML = "";
    searchResults.forEach((_, i) => {
        cardRef.innerHTML += getPokemonCardTemplate(i, true);
        renderCardContent(i, true);
    });
}