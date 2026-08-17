// ============================================
// STATE
// ============================================
let START = 1, STOP = START + 20;
let isLoading = false;
let isSearchMode = false;
let currentIndex = 0;
let lastFocusedElement = null;

let allPokemonList = [];
let pokemonInfos = [];
let pokemonCharacteristics = [];
let filteredIndices = [];
let imageCache = {};
let searchResults = [];
let searchDescriptions = [];

// ============================================
// INIT
// ============================================
async function init() {
  const ok = await fetchAllPokemonNames();
  if (!ok && allPokemonList.length === 0) {
    showApiError("PokéAPI ist nicht erreichbar. Es sind keine gecachten Daten vorhanden.");
    return;
  }
  if (!ok) showApiError("PokéAPI nicht erreichbar – zeige gecachte Daten.");
  await bulkLoadPokemon();
}

async function retryInit() {
  hideApiError();
  // localStorage Cache leeren damit frische Daten geholt werden
  try { localStorage.clear(); } catch (e) { }
  allPokemonList = [];
  pokemonInfos = [];
  pokemonCharacteristics = [];
  imageCache = {};
  document.getElementById("content").innerHTML = "";
  START = 1;
  STOP = 21;
  await init();
}

// -- Fehler UI --
function showApiError(msg) {
  const banner = document.getElementById("api_error");
  const msgEl = document.getElementById("api_error_msg");
  if (msgEl) msgEl.textContent = msg;
  banner?.classList.remove("d_none");
}

function hideApiError() {
  document.getElementById("api_error")?.classList.add("d_none");
}

// ============================================
// BATCH LOADING
// ============================================
async function loadPokemonBatch(start, end) {
  if (isLoading) return;
  setMoreBtn(true);
  const renderFrom = pokemonInfos.length;
  const promises = [];

  for (let id = start; id < end; id++) {
    promises.push(Promise.all([loadPokemonInfo(id), getPkmDescription(id), getFrontPicture(id)]));
  }

  await fetchAndStore(promises);
  START += 20;
  STOP += 20;
  renderPokemonCard(renderFrom);
  if (!isSearchMode) setMoreBtn(false);
}

async function bulkLoadPokemon() {
  await loadPokemonBatch(1, 21);
}

async function bulkLoadNextPokemon() {
  await loadPokemonBatch(START, STOP);
}

async function fetchAndStore(promises) {
  const results = await Promise.all(promises);
  let anyFailed = false;

  for (const [info, description] of results) {
    if (!info) {
      anyFailed = true;
      continue; // fehlgeschlagene überspringen
    }
    pokemonInfos.push(info);
    pokemonCharacteristics.push(description);
  }

  if (anyFailed) showApiError("Einige Pokémon konnten nicht geladen werden – API möglicherweise nicht erreichbar.");
  return results;
}

// ============================================
// LOADING STATE
// ============================================
function setMoreBtn(loading) {
  isLoading = loading;
  document.querySelector(".load_more button").disabled = loading;
  const loader = document.getElementById("loader");
  loader.classList.toggle("active", loading);
  loader.classList.toggle("d_none", !loading);

  // Screen Reader informieren
  const live = document.getElementById("sr_live");
  if (!live) return;
  live.textContent = loading
    ? "Pokémon werden geladen..."
    : `${pokemonInfos.length} Pokémon geladen.`;
}

// ============================================
// MODAL
// ============================================
function openDetails(i, fromSearch = false) {
  document.body.classList.add("no_scroll");
  currentIndex = i;
  isSearchMode = fromSearch;
  lastFocusedElement = document.activeElement;
  const detailRef = document.getElementById("details");
  detailRef.showModal();
  detailRef.classList.add("opened");
  detailRef.innerHTML = getDialogTemplate(i, fromSearch);
  renderDialogContent(i, fromSearch);
  requestAnimationFrame(() => {
    detailRef.querySelector(".close_btn")?.focus();
  });
}

function switchPokemon(i, fromSearch = false) {
  currentIndex = i;
  const detailRef = document.getElementById("details");
  detailRef.innerHTML = getDialogTemplate(i, fromSearch);
  renderDialogContent(i, fromSearch);
}

function closeDetails() {
  const detailRef = document.getElementById("details");
  detailRef.close();
  detailRef.classList.remove("opened");
  document.body.classList.remove("no_scroll");
  lastFocusedElement?.focus();
}

function bubbleProtection(event) {
  event.stopPropagation();
}

function showTab(tab, i, fromSearch = false) {
  const isFromSearch = fromSearch === true || fromSearch === "true";
  const source = isFromSearch ? searchResults : pokemonInfos;

  document.getElementById("tab_content_info").classList.toggle("d_none", tab !== "info");
  document.getElementById("tab_content_evo").classList.toggle("d_none", tab !== "evo");
  document.getElementById("evoChain").classList.toggle("d_none", tab !== "evo");
  document.getElementById("tab_info").classList.toggle("active", tab === "info");
  document.getElementById("tab_evo").classList.toggle("active", tab === "evo");
  document.getElementById("evoChain").classList.toggle("active", tab === "evo");

  if (tab === "evo") renderEvolutionChain(i, source);
}

function playPokemonCry(i, fromSearch = false) {
  const source = fromSearch === true || fromSearch === "true" ? searchResults : pokemonInfos;
  const url = source[i].cries?.latest;
  if (!url) return;
  const audio = new Audio(url);
  audio.volume = 0.2;
  audio.play();
}