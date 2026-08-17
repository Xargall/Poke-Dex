// ============================================
// RENDER – Alle Render-Funktionen
// Abhängigkeiten: utils.js, api.js, State aus script.js
// ============================================

// -- Karten-Rendering --

function renderPokemonCard(startIndex = 0) {
    const cardRef = document.getElementById("content");
    for (let i = startIndex; i < pokemonInfos.length; i++) {
        cardRef.innerHTML += getPokemonCardTemplate(i);
        renderCardContent(i);
    }
}

function renderCardContent(i, fromSearch = false) {
    const source = fromSearch ? searchResults : pokemonInfos;
    renderName(i, source, "pkm_");
    renderTypes(i, source);
    renderPicture(i, source);

    // Holo-Farben auf die Card anwenden
    const card = document.querySelectorAll(".card_section")[i];
    if (card) applyHoloColors(card, source[i].types);
}

function renderName(i, source = pokemonInfos, idPrefix = "") {
    const ref = document.getElementById(`${idPrefix}name${i}`);
    if (!ref) return;
    const word = source[i].name;
    ref.innerHTML = formatPokemonName(word);
    applyNameSizing(ref, word);
}

function renderTypes(i, source = pokemonInfos, idPrefix = "") {
    const typeRef = document.getElementById(`${idPrefix}types${i}`);
    if (!typeRef) return;
    source[i].types.forEach((_, idx) => {
        typeRef.innerHTML += getTypesTemplate(i, idx, source);
    });
}

function renderPicture(i, source = pokemonInfos, idPrefix = "") {
    const pokeID = source[i].id;
    const container = document.getElementById(`${idPrefix}pokemonImg${i}`);
    if (!container) return;

    const img = new Image();
    img.alt = "";
    img.src =
        imageCache[pokeID] ??
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeID}.png`;

    img.onerror = () => {
        img.onerror = null;
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeID}.png`;
    };

    container.appendChild(img);
}

// -- Dialog-Rendering --

function renderDialogContent(i, fromSearch = false) {
    const source = fromSearch ? searchResults : pokemonInfos;
    const sourceDesc = fromSearch ? searchDescriptions : pokemonCharacteristics;
    renderPicture(i, source, "dialog_");
    renderName(i, source, "dialog_");
    renderTypes(i, source, "dialog_");
    renderDialogDescription(i, sourceDesc);
    renderMeasure("height", source[i].height, "m");
    renderMeasure("weight", source[i].weight, "Kg");
    renderStatChart(i, source);
    renderEvolutionChain(i, source);
}

function renderDialogDescription(i, source = pokemonCharacteristics) {
    const descRef = document.getElementById(`dialog_description${i}`);
    if (!descRef) return;
    const entries = source[i]?.flavor_text_entries;
    if (!entries) { descRef.innerHTML = "No description available."; return; }
    const entry = entries.find((e) => e.language.name === "en");
    descRef.innerHTML = entry
        ? entry.flavor_text.replace(/[\f\r\n\t]/g, " ")
        : "No English description available.";
}

function renderMeasure(id, value, unit) {
    const ref = document.getElementById(id);
    if (!ref) return;
    ref.innerHTML = (value / 10).toFixed(1) + unit;
}

// -- Stat Chart --

function renderStatChart(i, source = pokemonInfos) {
    const ctx = document.querySelector(".stat_canvas");
    if (!ctx) return;
    Chart.getChart(ctx)?.destroy();

    const stats = source[i].stats;
    const names = stats.map((s) =>
        s.stat.name
            .replace("special-attack", "S.Attack")
            .replace("special-defense", "S.Defense")
            .toUpperCase()
    );
    const values = stats.map((s) => s.base_stat);

    new Chart(ctx, {
        type: "radar",
        data: { labels: names, datasets: [{ label: "", data: values, borderWidth: 1, borderColor: "rgba(164,18,28,0.8)", backgroundColor: "rgba(164,18,28,0.15)", pointBackgroundColor: "rgba(164,18,28,0.9)" }] },
        options: {
            layout: { padding: { left: 35, right: 35, top: 10, bottom: 10 } },
            maintainAspectRatio: true,
            responsive: false,
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: { stepSize: 50, backdropColor: "transparent", color: "transparent", display: false },
                    grid: { color: "rgba(255,255,255,0.08)" },
                    angleLines: { color: "rgba(255,255,255,0.08)" },
                    pointLabels: { color: "#8a90a8", font: { size: 9, weight: "bold", family: "Pixelify Sans" } },
                },
            },
            plugins: { legend: { display: false } },
        },
    });
}

// -- Evolution Chain --

async function renderEvolutionChain(i, source = pokemonInfos) {
    const pokeId = source[i].id;
    const chain = await fetchEvoChain(pokeId);
    const evoRef = document.getElementById("evoChain");
    if (!evoRef) return;
    evoRef.innerHTML = "";
    if (!chain) { evoRef.innerHTML = "No Evolution data"; return; }

    const wrapper = document.createElement("div");
    wrapper.classList.add("evo_chain");

    let level = [{ species: chain.species, details: null, evolves_to: chain.evolves_to }];
    let first = true;

    while (level.length > 0) {
        if (!first) wrapper.appendChild(createConnector());
        first = false;

        const row = document.createElement("div");
        row.classList.add("evo_level");
        level.forEach((node) => row.appendChild(evoCard(node.species, node.details, pokeId)));
        wrapper.appendChild(row);

        level = level.flatMap((node) =>
            (node.evolves_to || []).map((evo) => ({
                species: evo.species,
                details: evo.evolution_details,
                evolves_to: evo.evolves_to,
            }))
        );
    }

    evoRef.appendChild(wrapper);
}

function evoCard(species, details, currentId) {
    const id = species.url.split("/").filter(Boolean).pop();
    const card = document.createElement("div");
    card.classList.add("evo_stage");
    if (String(id) === String(currentId)) card.classList.add("evo_current");

    const label = getEvoMethodLabel(details);
    if (label) {
        const method = document.createElement("span");
        method.classList.add("evo_method");
        method.textContent = label;
        card.appendChild(method);
    }

    card.appendChild(evoImg(species.url));

    const name = document.createElement("span");
    name.classList.add("evo_stage_name");
    name.textContent = formatPokemonName(species.name);
    card.appendChild(name);

    return card;
}

function createConnector() {
    const div = document.createElement("div");
    div.classList.add("evo_connector");
    div.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
    return div;
}

function getEvoMethodLabel(details) {
    if (!details || details.length === 0) return "";
    const d = details[0];
    if (d.min_level) return `Lv. ${d.min_level}`;
    if (d.item) return d.item.name.replace(/-/g, " ");
    if (d.trigger?.name === "trade") return "Trade";
    if (d.min_happiness) return "Friendship";
    return d.trigger?.name ? d.trigger.name.replace(/-/g, " ") : "";
}

function evoImg(url) {
    const id = url.split("/").filter(Boolean).pop();
    const img = new Image();
    img.src =
        imageCache[id] ??
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    return img;
}