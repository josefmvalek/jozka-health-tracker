// --- Globální proměnné a stav ---
let dnesniDatum = "";
let editovaneDatum = "";
let vsechnaData = {};
let aktivniFiltr = "voda";

// Proměnné pro kalendář
let aktualniMesic = new Date().getMonth();
let aktualniRok = new Date().getFullYear();
const nazvyMesicu = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];

// Proměnné pro měření spánku
let meriSpanek = false;
let casUsnuti = null;

// --- HTML Elementy ---
const navDashboard = document.getElementById("nav-dashboard");
const navCalendar = document.getElementById("nav-calendar");
const viewDashboard = document.getElementById("view-dashboard");
const viewCalendar = document.getElementById("view-calendar");
const dashboardTitle = document.getElementById("dashboard-title");

const sleepSlider = document.getElementById("sleep-slider");
const sleepValueDisplay = document.getElementById("sleep-value-display");
const sleepTimerBtn = document.getElementById("sleep-timer-btn");
const timerText = document.getElementById("timer-text");
const timerIcon = sleepTimerBtn.querySelector(".icon");

const waterDropsContainer = document.getElementById("water-drops");
const waterStatus = document.getElementById("water-status");

const moodSlider = document.getElementById("mood-slider");
const moodStatus = document.getElementById("mood-status");

const filterButtons = document.querySelectorAll(".filter-btn");

const calendarGrid = document.getElementById("calendar-grid");
const calendarMonthTitle = document.getElementById("calendar-month-title");
const btnPrevMonth = document.getElementById("prev-month");
const btnNextMonth = document.getElementById("next-month");

// --- Funkce pro Data a LocalStorage ---

function ziskejDnesniDatum() {
    let dnes = new Date();
    let rok = dnes.getFullYear();
    let mesic = dnes.getMonth() + 1;
    let den = dnes.getDate();

    if (mesic < 10) { mesic = `0${mesic}`; }
    if (den < 10) { den = `0${den}`; }

    return `${rok}-${mesic}-${den}`;
}

function nactiData() {
    let ulozenaDataText = localStorage.getItem("healthTrackerData");
    if (ulozenaDataText) {
        vsechnaData = JSON.parse(ulozenaDataText);
    } else {
        vsechnaData = {};
    }

    // Načtení probíhajícího spánku z localStorage
    let ulozenySpanekText = localStorage.getItem("healthTrackerSleepTimer");
    if (ulozenySpanekText) {
        let stavSpanku = JSON.parse(ulozenySpanekText);
        let meriSpanekStr = stavSpanku.aktivni;
        casUsnuti = stavSpanku.casZacatku;

        if (meriSpanekStr) {
            aktivujRezimSpanku();
        }
    }
}

function zajistiDataProDatum(datum) {
    if (!vsechnaData[datum]) {
        vsechnaData[datum] = {
            spanek: "8.0",
            voda: 0,
            nalada: "5"
        };
    }
}

function ulozData() {
    let dataText = JSON.stringify(vsechnaData);
    localStorage.setItem("healthTrackerData", dataText);
}

function ulozStavSpanku() {
    let stav = {
        aktivni: meriSpanek,
        casZacatku: casUsnuti
    };
    localStorage.setItem("healthTrackerSleepTimer", JSON.stringify(stav));
}

// --- Inicializace ---

function vygenerujKapky() {
    let htmlStruktura = "";
    for (let i = 1; i <= 8; i++) {
        htmlStruktura += `<svg viewBox="0 0 24 24" class="drop" data-index="${i}"><path d="M12 21.5c-3.3 0-6-2.7-6-6 0-3.9 6-10.5 6-10.5s6 6.6 6 10.5c0 3.3-2.7 6-6 6z"/></svg>`;
    }
    waterDropsContainer.innerHTML = htmlStruktura;
}

function inicializace() {
    dnesniDatum = ziskejDnesniDatum();
    editovaneDatum = dnesniDatum;

    vygenerujKapky();
    nactiData();
    zajistiDataProDatum(dnesniDatum);

    loadDayData(dnesniDatum);
    nastavPosluchaceUdalosti();

    renderCalendar(aktualniMesic, aktualniRok);
}

// --- Funkce Dashboardu ---

function formatujCisloSJednimDesetinnym(cislo) {
    return parseFloat(cislo).toFixed(1);
}

function aktualizujBarvySlideru() {
    let hodnotaSpanku = parseFloat(sleepSlider.value);
    let barvaSpanku = "var(--sleep-color)";
    let procentoSpanku = (hodnotaSpanku / 12) * 100;

    if (hodnotaSpanku >= 7 && hodnotaSpanku <= 9) {
        barvaSpanku = "var(--good-color)"; // Zelená (Nahrazené movement za specializovanou dobrou proměnnou)
        sleepValueDisplay.style.color = "var(--good-color)";
    } else if (hodnotaSpanku < 6 || hodnotaSpanku > 10) {
        barvaSpanku = "var(--mood-color)"; // Červená
        sleepValueDisplay.style.color = "var(--mood-color)";
    } else {
        sleepValueDisplay.style.color = "white";
    }

    sleepSlider.style.background = `linear-gradient(to right, ${barvaSpanku} ${procentoSpanku}%, #4b5563 ${procentoSpanku}%)`;

    let hodnotaNalady = parseInt(moodSlider.value);
    let barvaNalady = "var(--mood-color)";

    if (hodnotaNalady >= 8) barvaNalady = "var(--good-color)"; // Zelená
    else if (hodnotaNalady >= 5) barvaNalady = "#facc15"; // Žlutá

    let procentoNalady = ((hodnotaNalady - 1) / 9) * 100;
    moodSlider.style.background = `linear-gradient(to right, ${barvaNalady} ${procentoNalady}%, #4b5563 ${procentoNalady}%)`;
}

function loadDayData(dateString) {
    editovaneDatum = dateString;
    zajistiDataProDatum(editovaneDatum);

    if (editovaneDatum === dnesniDatum) {
        dashboardTitle.innerText = "Dnešní přehled";
        sleepTimerBtn.style.display = "flex";
    } else {
        let casti = editovaneDatum.split("-");
        let pekneDatum = `${casti[2]}. ${casti[1]}. ${casti[0]}`;
        dashboardTitle.innerText = `Úprava dne: ${pekneDatum}`;
        sleepTimerBtn.style.display = "none";
    }

    let dataDne = vsechnaData[editovaneDatum];

    sleepSlider.value = dataDne.spanek;
    sleepValueDisplay.innerText = formatujCisloSJednimDesetinnym(dataDne.spanek);

    waterStatus.innerText = `${dataDne.voda}/8`;
    let kapkyElenenty = document.querySelectorAll(".drop");
    for (let i = 0; i < kapkyElenenty.length; i++) {
        let kapka = kapkyElenenty[i];
        if (parseInt(kapka.getAttribute("data-index")) <= dataDne.voda) {
            kapka.classList.add("active");
        } else {
            kapka.classList.remove("active");
        }
    }

    moodSlider.value = dataDne.nalada;
    moodStatus.innerText = `${dataDne.nalada}/10`;

    aktualizujBarvySlideru();
}

function aktivujRezimSpanku() {
    meriSpanek = true;
    sleepSlider.disabled = true;
    sleepTimerBtn.classList.add("active");
    timerText.innerText = "Vstávat";
    timerIcon.innerText = "☀️";
}

function deaktivujRezimSpankuAUpravData() {
    meriSpanek = false;
    sleepSlider.disabled = false;
    sleepTimerBtn.classList.remove("active");
    timerText.innerText = "Jdu spát";
    timerIcon.innerText = "🌙";

    let casVzbuzeni = Date.now();
    let rozdilMS = casVzbuzeni - casUsnuti;

    let rozdilHodiny = rozdilMS / (1000 * 60 * 60);

    let zaokrouhleneHodiny = Math.round(rozdilHodiny * 2) / 2;

    if (zaokrouhleneHodiny < 0) zaokrouhleneHodiny = 0;
    if (zaokrouhleneHodiny > 12) zaokrouhleneHodiny = 12;

    let uloznaHodnota = formatujCisloSJednimDesetinnym(zaokrouhleneHodiny);

    vsechnaData[dnesniDatum].spanek = uloznaHodnota;
    casUsnuti = null;

    ulozData();
    ulozStavSpanku();

    loadDayData(dnesniDatum);
}

function nastavPosluchaceUdalosti() {
    navDashboard.addEventListener("click", function () {
        navDashboard.classList.add("active");
        navCalendar.classList.remove("active");
        viewDashboard.style.display = "flex";
        viewCalendar.style.display = "none";
        loadDayData(dnesniDatum);
    });

    navCalendar.addEventListener("click", function () {
        navCalendar.classList.add("active");
        navDashboard.classList.remove("active");
        viewCalendar.style.display = "flex";
        viewDashboard.style.display = "none";
        renderCalendar(aktualniMesic, aktualniRok);
    });

    sleepTimerBtn.addEventListener("click", function () {
        if (!meriSpanek) {
            casUsnuti = Date.now();
            aktivujRezimSpanku();
            ulozStavSpanku();
        } else {
            deaktivujRezimSpankuAUpravData();
        }
    });

    sleepSlider.addEventListener("input", function () {
        let formatovane = formatujCisloSJednimDesetinnym(sleepSlider.value);
        vsechnaData[editovaneDatum].spanek = formatovane;
        sleepValueDisplay.innerText = formatovane;
        aktualizujBarvySlideru();
        ulozData();
    });

    let kapkyElenenty = document.querySelectorAll(".drop");
    for (let i = 0; i < kapkyElenenty.length; i++) {
        kapkyElenenty[i].addEventListener("click", function () {
            let index = parseInt(this.getAttribute("data-index"));
            if (vsechnaData[editovaneDatum].voda === index) {
                vsechnaData[editovaneDatum].voda = index - 1;
            } else {
                vsechnaData[editovaneDatum].voda = index;
            }
            ulozData();
            loadDayData(editovaneDatum);
        });
    }

    moodSlider.addEventListener("input", function () {
        vsechnaData[editovaneDatum].nalada = moodSlider.value;
        moodStatus.innerText = `${moodSlider.value}/10`;
        aktualizujBarvySlideru();
        ulozData();
    });

    for (let i = 0; i < filterButtons.length; i++) {
        filterButtons[i].addEventListener("click", function () {
            for (let j = 0; j < filterButtons.length; j++) {
                filterButtons[j].classList.remove("active");
            }
            this.classList.add("active");
            aktivniFiltr = this.getAttribute("data-filter");
            renderCalendar(aktualniMesic, aktualniRok);
        });
    }

    btnPrevMonth.addEventListener("click", function () {
        aktualniMesic--;
        if (aktualniMesic < 0) {
            aktualniMesic = 11;
            aktualniRok--;
        }
        renderCalendar(aktualniMesic, aktualniRok);
    });

    btnNextMonth.addEventListener("click", function () {
        aktualniMesic++;
        if (aktualniMesic > 11) {
            aktualniMesic = 0;
            aktualniRok++;
        }
        renderCalendar(aktualniMesic, aktualniRok);
    });
}

// --- Funkce Kalendáře ---

function ziskejBarevnyHexNalady(nalada) {
    let cislo = parseInt(nalada);
    if (cislo >= 8) return "var(--good-color)"; // Zelená (Skvělá nálada)
    if (cislo >= 5) return "#eab308"; // Žlutá (Normální)
    return "var(--mood-color)";       // Červená (Špatná)
}

// 3. Dynamický kalendář
function renderCalendar(mesic, rok) {
    calendarMonthTitle.innerText = `${nazvyMesicu[mesic]} ${rok}`;

    let htmlKalendar = "";

    // 1. Zjištění počtu dnů
    let pocetDnuVMesici = new Date(rok, mesic + 1, 0).getDate();

    // 2. Zjištění začátku měsíce (Jaký je den v týdnu pro 1. políčko)
    let prvniDenDate = new Date(rok, mesic, 1).getDay();
    // Odchylka pro české (evropské) počítání kalendáře
    let pocetPrazdnychZacatkem = (prvniDenDate + 6) % 7;

    // 3. Vygenerování prázdných "odstazených" políček na začátek měsíce
    for (let i = 0; i < pocetPrazdnychZacatkem; i++) {
        htmlKalendar += `<div class="day-cell empty-day"></div>`;
    }

    let mesicProData = mesic + 1;
    if (mesicProData < 10) { mesicProData = `0${mesicProData}`; }

    for (let den = 1; den <= pocetDnuVMesici; den++) {
        let denText = den;
        if (den < 10) { denText = `0${den}`; }

        let klicData = `${rok}-${mesicProData}-${denText}`;
        let denniData = vsechnaData[klicData];

        // Výchozí hodnoty - malá estetická pomlčka pro prázdná data
        let zobrazenoVkalendari = `<span class="empty-val">-</span>`;
        let inlineStyly = "";

        if (denniData) {
            if (aktivniFiltr === "spanek") {
                if (parseFloat(denniData.spanek) > 0) zobrazenoVkalendari = `${formatujCisloSJednimDesetinnym(denniData.spanek)}h`;
            } else if (aktivniFiltr === "voda") {
                let pocetSklenic = denniData.voda || 0;
                if (pocetSklenic > 0) {
                    zobrazenoVkalendari = pocetSklenic;
                    let procenta = (pocetSklenic / 8) * 100;
                    inlineStyly = `background-image: linear-gradient(to top, #00d2ff ${procenta}%, transparent ${procenta}%);`;
                }
            } else if (aktivniFiltr === "nalada") {
                if (denniData.nalada !== "") {
                    zobrazenoVkalendari = denniData.nalada;
                    inlineStyly = `background-color: ${ziskejBarevnyHexNalady(denniData.nalada)}; border-color: transparent; color: black;`;
                }
            }
        }

        let cssTrida = "day-cell";
        if (klicData === dnesniDatum) cssTrida += " dnes";
        if (klicData === editovaneDatum) cssTrida += " vybrano";

        let dayNumberStyle = (aktivniFiltr === "nalada" && denniData && denniData.nalada) ? `style="color: rgba(0,0,0,0.6);"` : "";
        let dayValueStyle = (aktivniFiltr === "nalada" && denniData && denniData.nalada) ? `style="text-shadow: none;"` : "";

        htmlKalendar += `
            <div class="${cssTrida}" data-datum="${klicData}" style="${inlineStyly}">
                <div class="day-number" ${dayNumberStyle}>${den}.</div>
                <div class="day-value" ${dayValueStyle}>${zobrazenoVkalendari}</div>
            </div>`;
    }

    calendarGrid.innerHTML = htmlKalendar;

    let dny = document.querySelectorAll(".day-cell:not(.empty-day)");
    for (let i = 0; i < dny.length; i++) {
        dny[i].addEventListener("click", function () {
            let vybraneDatum = this.getAttribute("data-datum");
            loadDayData(vybraneDatum);

            navDashboard.classList.add("active");
            navCalendar.classList.remove("active");
            viewDashboard.style.display = "flex";
            viewCalendar.style.display = "none";
        });
    }
}

// Start aplikace
window.onload = function () { inicializace(); };
