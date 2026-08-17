// ============================================
// HOLO – Typ-spezifische Shine-Farben
// ============================================

const TYPE_HOLO_COLORS = {
    normal: ["#c8c8a0", "#a8a878", "#d0d0b0"],
    fire: ["#ff9900", "#ff4400", "#ffcc00"],
    water: ["#44aaff", "#0066cc", "#88ddff"],
    electric: ["#ffee00", "#ffaa00", "#fff176"],
    grass: ["#66cc44", "#228800", "#aaee66"],
    ice: ["#aaeeff", "#55ccee", "#ddf6ff"],
    fighting: ["#cc2200", "#881100", "#ff6644"],
    poison: ["#aa44cc", "#772299", "#dd88ff"],
    ground: ["#ddbb55", "#aa8833", "#eedd99"],
    flying: ["#8899ff", "#5566dd", "#bbccff"],
    psychic: ["#ff4488", "#cc1166", "#ff99bb"],
    bug: ["#99bb11", "#667700", "#ccdd44"],
    rock: ["#bbaa44", "#887722", "#ddcc77"],
    ghost: ["#6655aa", "#443388", "#9988dd"],
    dragon: ["#7722ff", "#4400cc", "#aa66ff"],
    dark: ["#775544", "#443322", "#aa8866"],
    steel: ["#aaaacc", "#7788aa", "#ccddee"],
    fairy: ["#ee88cc", "#cc44aa", "#ffbbee"],
};

function getHoloColors(types) {
    const type1 = types[0]?.type?.name;
    const type2 = types[1]?.type?.name;

    const colors1 = TYPE_HOLO_COLORS[type1] || TYPE_HOLO_COLORS.normal;

    if (!type2) return colors1;

    // Dual-Typ: Farben beider Typen mischen
    const colors2 = TYPE_HOLO_COLORS[type2] || TYPE_HOLO_COLORS.normal;
    return [colors1[0], colors2[1], colors1[2]];
}

// Typ-Glow: c1 als Basis, aber mit niedrigem Alpha für subtilen Ambient-Glow
function hexToGlow(hex, alpha = 0.22) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyHoloColors(card, types) {
    const [c1, c2, c3] = getHoloColors(types);
    card.style.setProperty("--holo-c1", c1);
    card.style.setProperty("--holo-c2", c2);
    card.style.setProperty("--holo-c3", c3);
    // Typ-farbiger Glow – subtil, immer sichtbar (nicht nur beim Hover)
    card.style.setProperty("--glow-color", hexToGlow(c1));
}

// ============================================
// HOLO – Maussteuerung
// ============================================

function initHoloEffect() {
    const content = document.getElementById("content");
    let rafId = null;

    content.addEventListener("mousemove", (e) => {
        const card = e.target.closest(".card_section");
        if (!card) return;

        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            card.style.setProperty("--rx", `${(x - 0.5) * 12}deg`);
            card.style.setProperty("--ry", `${-(y - 0.5) * 8}deg`);
            card.style.setProperty("--mx", `${x * 100}%`);
            card.style.setProperty("--my", `${y * 100}%`);
            card.style.setProperty("--posx", `${x * 100}%`);
            card.style.setProperty("--posy", `${y * 100}%`);
            card.style.setProperty("--o", "1");
        });
    });

    content.addEventListener("mouseout", (e) => {
        const card = e.target.closest(".card_section");
        if (card && !card.contains(e.relatedTarget)) {
            if (rafId) cancelAnimationFrame(rafId);
            resetCard(card);
        }
    });
}

function resetCard(card) {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "50%");
    card.style.setProperty("--posx", "50%");
    card.style.setProperty("--posy", "50%");
    card.style.setProperty("--o", "0");
}

document.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver(() => {
        if (document.querySelector(".card_section")) {
            initHoloEffect();
            observer.disconnect();
        }
    });
    observer.observe(document.getElementById("content"), { childList: true });
});