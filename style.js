document.documentElement.classList.add("scroll-locked");
document.body.classList.add("scroll-locked");

const toast = document.getElementById("toast");
let toastTimer;

function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        toast.hidden = true;
    }, 3000);
}

const guestNameFromUrl = new URLSearchParams(window.location.search).get("to");
const guestName = guestNameFromUrl ? guestNameFromUrl.trim() : "";

document.getElementById("nama-tamu").textContent =
    guestName || "Bapak, Ibu, dan Teman-teman";

const cover = document.getElementById("cover");
const openInviteButton = document.getElementById("buka-undangan");
const backgroundMusic = document.getElementById("background-music");
const musicToggle = document.getElementById("music-toggle");

function updateMusicToggle() {
    const isPlaying = !backgroundMusic.paused;
    musicToggle.textContent = isPlaying ? "Jeda Musik" : "Putar Musik";
    musicToggle.setAttribute("aria-label", isPlaying ? "Jeda musik latar" : "Putar musik latar");
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
}

async function playBackgroundMusic() {
    try {
        await backgroundMusic.play();
        updateMusicToggle();
    } catch (error) {
        if (error.name === "AbortError" && backgroundMusic.paused) {
            updateMusicToggle();
            return;
        }

        console.error("Musik latar gagal diputar.", error);
        showToast("Musik belum bisa diputar. Coba tekan tombol Putar Musik.");
    }
}

let invitationOpened = false;

openInviteButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (invitationOpened) {
        return;
    }

    invitationOpened = true;
    openInviteButton.setAttribute("aria-disabled", "true");
    cover.classList.add("is-open");
    void playBackgroundMusic();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
        cover.hidden = true;
        document.documentElement.classList.remove("scroll-locked");
        document.body.classList.remove("scroll-locked");
        document.getElementById("undangan").scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth"
        });
    }, reducedMotion ? 0 : 750);
});

musicToggle.addEventListener("click", async () => {
    if (backgroundMusic.paused) {
        await playBackgroundMusic();
    } else {
        backgroundMusic.pause();
        updateMusicToggle();
    }
});

backgroundMusic.addEventListener("play", updateMusicToggle);
backgroundMusic.addEventListener("pause", updateMusicToggle);

const countdownElement = document.getElementById("countdown");
const eventStart = new Date("2026-12-26T10:00:00+07:00");
const eventEnd = new Date("2026-12-26T17:00:00+07:00");

function updateCountdown() {
    const now = new Date();

    if (now >= eventEnd) {
        countdownElement.textContent = "Acara telah selesai.";
        return;
    }

    if (now >= eventStart) {
        countdownElement.textContent = "Acara sedang berlangsung.";
        return;
    }

    const totalSeconds = Math.floor((eventStart.getTime() - now.getTime()) / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownElement.textContent =
        `${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik lagi`;
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

async function copyTextFromElement(elementId, label) {
    const text = document.getElementById(elementId).textContent.trim();
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const temporaryInput = document.createElement("textarea");
            temporaryInput.value = text;
            temporaryInput.setAttribute("readonly", "");
            temporaryInput.style.position = "fixed";
            temporaryInput.style.opacity = "0";
            document.body.appendChild(temporaryInput);
            temporaryInput.select();
            const copied = document.execCommand("copy");
            temporaryInput.remove();

            if (!copied) {
                throw new Error("Browser menolak akses ke clipboard.");
            }
        }

        showToast(`${label} berhasil disalin.`);
    } catch (error) {
        console.error(`Gagal menyalin ${label.toLowerCase()}.`, error);
        showToast(`Gagal menyalin ${label.toLowerCase()}. Salin secara manual.`);
    }
}

document.getElementById("salin-gopay").addEventListener("click", () => {
    void copyTextFromElement("gopay-number", "Nomor GoPay");
});

document.getElementById("salin-alamat").addEventListener("click", () => {
    void copyTextFromElement("alamat-kado", "Alamat kado");
});

const galleryFigures = document.querySelectorAll("#galeri figure");

if ("IntersectionObserver" in window) {
    const galleryObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    galleryFigures.forEach((figure) => {
        figure.classList.add("reveal");
        galleryObserver.observe(figure);
    });
}

const rsvpForm = document.getElementById("rsvp-form");
const rsvpStatus = document.getElementById("rsvp-status");
const guestbook = document.getElementById("daftar-ucapan");
const rsvpStorageKey = "wedding-rsvp-entries";

function loadRsvpEntries() {
    const savedEntries = localStorage.getItem(rsvpStorageKey);

    if (savedEntries === null) {
        return [];
    }

    const entries = JSON.parse(savedEntries);
    const validEntries = Array.isArray(entries) && entries.every((entry) =>
        entry &&
        typeof entry.name === "string" &&
        (entry.attendance === "hadir" || entry.attendance === "tidak-hadir") &&
        typeof entry.message === "string"
    );

    if (!validEntries) {
        throw new Error("Data RSVP tersimpan memiliki format yang tidak valid.");
    }

    return entries;
}

function renderGuestbook() {
    try {
        const entries = loadRsvpEntries();
        guestbook.replaceChildren();

        if (entries.length === 0) {
            const emptyMessage = document.createElement("li");
            emptyMessage.textContent = "Belum ada ucapan.";
            guestbook.appendChild(emptyMessage);
            return;
        }

        entries.forEach((entry) => {
            const item = document.createElement("li");
            const name = document.createElement("strong");
            const attendance = entry.attendance === "hadir" ? "Hadir" : "Tidak hadir";
            name.textContent = `${entry.name} — ${attendance}`;
            item.appendChild(name);

            if (entry.message) {
                const message = document.createElement("p");
                message.textContent = entry.message;
                item.appendChild(message);
            }

            guestbook.appendChild(item);
        });
    } catch (error) {
        console.error("Gagal memuat buku tamu.", error);
        guestbook.replaceChildren();
        const errorMessage = document.createElement("li");
        errorMessage.textContent = "Buku tamu gagal dimuat dari penyimpanan browser.";
        guestbook.appendChild(errorMessage);
    }
}

rsvpForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("nama-rsvp").value.trim();
    const attendance = document.getElementById("status-kehadiran").value;
    const message = document.getElementById("ucapan").value.trim();

    if (!name || (attendance !== "hadir" && attendance !== "tidak-hadir")) {
        rsvpStatus.textContent = "Isi nama dan pilih status kehadiran.";
        return;
    }

    try {
        const entries = loadRsvpEntries();
        entries.push({ name, attendance, message });
        localStorage.setItem(rsvpStorageKey, JSON.stringify(entries));
        renderGuestbook();
        rsvpForm.reset();
        rsvpStatus.textContent = "RSVP berhasil disimpan di browser ini.";
    } catch (error) {
        console.error("Gagal menyimpan RSVP.", error);
        rsvpStatus.textContent = "RSVP gagal disimpan. Coba lagi atau gunakan browser lain.";
    }
});

renderGuestbook();