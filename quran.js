/* ═════════════════════════════════════════════════════
   NOOR QURAN APP v2 
═════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─── STATE ─── */
  const S = {
    surahs: [],
    surah: 1,
    ayah: 1,
    total: 7,
    lang: "en.asad",
    autoNext: true,
    repeat: false,
    fontSize: 2.6,
    fontIdx: 2,
    night: false,
    sepia: false,
    focus: false,
    translit: false,
    memorize: false,
    dhikrIdx: 0,
    dhikrCount: 0,
    dhikrList: [
      { ar: "سُبْحَانَ اللَّه", en: "SubhanAllah", n: 33 },
      { ar: "الْحَمْدُ لِلَّه", en: "Alhamdulillah", n: 33 },
      { ar: "اللَّهُ أَكْبَر", en: "Allahu Akbar", n: 34 },
      { ar: "لَا إِلٰهَ إِلَّا اللَّه", en: "La ilaha illAllah", n: 100 },
      { ar: "أَسْتَغْفِرُ اللَّه", en: "Astaghfirullah", n: 100 },
      { ar: "اللَّهُمَّ صَلِّ", en: "Allahumma Salli", n: 100 },
    ],
    duaIdx: 0,
    duas: [
      {
        ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        tr: '"Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire." (2:201)',
      },
      {
        ar: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي",
        tr: '"My Lord, expand for me my breast and ease for me my task, and untie the knot from my tongue." (20:25-27)',
      },
      {
        ar: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً",
        tr: '"Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy." (3:8)',
      },
      {
        ar: "رَبِّ زِدْنِي عِلْمًا",
        tr: '"My Lord, increase me in knowledge." (20:114)',
      },
      {
        ar: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
        tr: '"Allah is sufficient for us, and He is the best disposer of affairs." (3:173)',
      },
      {
        ar: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
        tr: '"Our Lord, forgive me and my parents and the believers the Day the account is established." (14:41)',
      },
      {
        ar: "اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
        tr: '"O Allah, You are Pardoning and Generous; You love to pardon, so pardon me." (Tirmidhi)',
      },
      {
        ar: "رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
        tr: '"My Lord, indeed I am in need of whatever good You would send down to me." (28:24)',
      },
    ],
    bookmarks: JSON.parse(localStorage.getItem("n_bm") || "[]"),
    notes: JSON.parse(localStorage.getItem("n_notes") || "{}"),
    stats: JSON.parse(
      localStorage.getItem("n_stats") ||
        '{"ayahs":0,"streak":0,"lastDate":"","surahs":[],"bm":0}',
    ),
    speeds: [0.75, 1, 1.25, 1.5, 2],
    speedIdx: 1,
    votd: null,
    playedSurahs: new Set(),
  };

  const $ = (id) => document.getElementById(id);

  /* ─── DOM REFS ─── */
  const elArabic = $("arabicArea");
  const elTrans = $("transArea");
  const elTranslit = $("translitArea");
  const elSurahList = $("surahList");
  const audio = $("audioEl");

  /* ─── INIT ─── */
  window.addEventListener("load", () => {
    generateStars();
    setTimeout(() => $("splash").classList.add("out"), 2400);
    loadSurahs();
    initHijri();
    initPrayer();
    initQibla();
    renderDua();
    renderBm();
    renderStats();
    loadLastRead();
    loadVotd();
    setInterval(updatePrayerCountdown, 1000);

    audio.addEventListener("timeupdate", onProgress);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener(
      "loadedmetadata",
      () => ($("timeTot").textContent = fmt(audio.duration)),
    );

    // Touch swipe
    let tx = 0;
    elArabic.addEventListener(
      "touchstart",
      (e) => {
        tx = e.changedTouches[0].screenX;
      },
      { passive: true },
    );
    elArabic.addEventListener(
      "touchend",
      (e) => {
        const d = e.changedTouches[0].screenX - tx;
        if (Math.abs(d) > 55) {
          d > 0 ? prevAyah() : nextAyah();
        }
      },
      { passive: true },
    );

    // Keyboard shortcuts
    document.addEventListener("keydown", onKey);
  });

  /* ─── SPLASH STARS ─── */
  function generateStars() {
    const sf = $("starField");
    for (let i = 0; i < 80; i++) {
      const s = document.createElement("div");
      const sz = Math.random() * 2.5 + 0.5;
      s.className = "splash-star";
      s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random() * 100}%;left:${Math.random() * 100}%;--d:${2 + Math.random() * 4}s;animation-delay:${Math.random() * 4}s`;
      sf.appendChild(s);
    }
  }

  /* ─── KEYBOARD ─── */
  function onKey(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const k = e.key.toLowerCase();
    if (k === "arrowright" || k === ".") nextAyah();
    else if (k === "arrowleft" || k === ",") prevAyah();
    else if (k === " ") {
      e.preventDefault();
      togglePlay();
    } else if (k === "b") bookmarkAyah();
    else if (k === "c") copyAyah();
    else if (k === "t") openTafsir();
    else if (k === "n") toggleNight();
    else if (k === "f") toggleFocus();
    else if (k === "m") toggleMemorize();
    else if (k === "r") randomAyah();
  }

  /* ─── SURAHS ─── */
  async function loadSurahs() {
    try {
      const r = await fetch("https://api.alquran.cloud/v1/surah");
      const j = await r.json();
      if (j.code === 200) {
        S.surahs = j.data;
        renderSurahList(S.surahs);
        goTo(1, 1);
        initVotd();
      }
    } catch (e) {
      elSurahList.innerHTML =
        '<div style="padding:20px;text-align:center;color:#a04040">⚠️ Network error. Check your connection.</div>';
    }
  }

  function renderSurahList(list) {
    elSurahList.innerHTML = "";
    list.forEach((s) => {
      const d = document.createElement("div");
      d.className = "si" + (s.number === S.surah ? " active" : "");
      d.dataset.n = s.number;
      d.innerHTML = `
      <span class="si-num">${s.number}</span>
      <div class="si-info"><h4>${s.englishName}</h4><p>${s.englishNameTranslation} · ${s.numberOfAyahs}v</p></div>
      <span class="si-ar">${s.name}</span>`;
      d.onclick = () => goTo(s.number, 1);
      elSurahList.appendChild(d);
    });
  }

  window.filterSurahs = function () {
    const q = $("surahSearch").value.toLowerCase();
    const f = S.surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        String(s.number).includes(q),
    );
    renderSurahList(f);
  };

  /* ─── NAVIGATION ─── */
  async function goTo(surah, ayah) {
    S.surah = surah;
    S.ayah = ayah;
    const info = S.surahs.find((s) => s.number === surah);
    if (info) S.total = info.numberOfAyahs;
    updateActiveItem();
    updateHero();
    await loadContent();
    loadAudio();
    saveLastRead();
  }

  window.nextAyah = function (flip) {
    if (S.ayah < S.total) S.ayah++;
    else if (S.surah < 114) {
      S.surah++;
      const ns = S.surahs.find((s) => s.number === S.surah);
      if (ns) {
        S.total = ns.numberOfAyahs;
        S.ayah = 1;
      }
    }
    animFlip("next");
    updateActiveItem();
    updateHero();
    loadContent();
    loadAudio();
    saveLastRead();
    bumpStats();
  };

  window.prevAyah = function () {
    if (S.ayah > 1) S.ayah--;
    else if (S.surah > 1) {
      S.surah--;
      const ps = S.surahs.find((s) => s.number === S.surah);
      if (ps) {
        S.total = ps.numberOfAyahs;
        S.ayah = ps.numberOfAyahs;
      }
    }
    animFlip("prev");
    updateActiveItem();
    updateHero();
    loadContent();
    loadAudio();
    saveLastRead();
  };

  function animFlip(dir) {
    const el = $("readerPanel");
    el.classList.remove("flip-next", "flip-prev");
    void el.offsetWidth;
    el.classList.add(dir === "next" ? "flip-next" : "flip-prev");
  }

  function updateActiveItem() {
    document
      .querySelectorAll(".si")
      .forEach((el) =>
        el.classList.toggle("active", Number(el.dataset.n) === S.surah),
      );
    const a = elSurahList.querySelector(".si.active");
    if (a) a.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function updateHero() {
    const info = S.surahs.find((s) => s.number === S.surah);
    if (!info) return;
    $("heroAr").textContent = info.name;
    $("heroEn").textContent =
      info.englishName + " · " + info.englishNameTranslation;
    $("heroType").textContent = info.revelationType;
    $("heroTotal").textContent = S.total;
    $("heroN").textContent = S.ayah;
    $("heroFill").style.width = (S.ayah / S.total) * 100 + "%";
    $("heroJuz").textContent = "Juz " + getJuz(S.surah);
    $("heroPage").textContent = "Page " + getPage(S.surah);
    $("rbAyah").textContent = "Ayah " + S.ayah + " / " + S.total;
    $("rbSurah").textContent = info.englishName;
    $("bismillahRow").style.display =
      S.surah === 9 || S.ayah !== 1 ? "none" : "block";
    updateNote();
  }

  /* ─── CONTENT ─── */
  async function loadContent() {
    elArabic.innerHTML = '<span style="opacity:.35;font-size:1.2rem">…</span>';
    elTrans.textContent = "Loading…";
    try {
      const [arR, trR] = await Promise.all([
        fetch(
          `https://api.alquran.cloud/v1/ayah/${S.surah}:${S.ayah}/ar.alafasy`,
        ),
        fetch(
          `https://api.alquran.cloud/v1/ayah/${S.surah}:${S.ayah}/${S.lang}`,
        ),
      ]);
      const arJ = await arR.json();
      const trJ = await trR.json();
      if (arJ.code === 200) {
        const arabic = arJ.data.text;
        elArabic.innerHTML = `<div class="memorize-overlay" id="memorizeOverlay" onclick="revealMemorize()"${S.memorize ? "" : ' style="display:none"'}>اضغط للكشف · Tap to reveal</div><span class="ayah-badge" id="ayahBadge">${toAr(S.ayah)}</span> ${arabic}`;
      }
      if (trJ.code === 200) elTrans.textContent = trJ.data.text;
      else
        elTrans.textContent = "Translation not available for this selection.";
      elArabic.classList.add("fade-ayah");
      elTrans.classList.add("fade-ayah");
      setTimeout(() => {
        elArabic.classList.remove("fade-ayah");
        elTrans.classList.remove("fade-ayah");
      }, 500);
      // translit (surah 1 only for now)
      const tlMap = {
        "1:1": "Bismillāhi r-raḥmāni r-raḥīm",
        "1:2": "Al-ḥamdu lillāhi rabbi l-ʿālamīn",
        "1:3": "Ar-raḥmāni r-raḥīm",
        "1:4": "Māliki yawmi d-dīn",
        "1:5": "Iyyāka naʿbudu wa-iyyāka nastaʿīn",
        "1:6": "Ihdinā ṣ-ṣirāṭ al-mustaqīm",
        "1:7": "Ṣirāṭ alladhīna anʿamta ʿalayhim",
      };
      elTranslit.textContent =
        tlMap[`${S.surah}:${S.ayah}`] ||
        "[transliteration not available for this ayah]";
    } catch (e) {
      elTrans.textContent = "⚠️ Could not load. Check connection.";
    }
  }

  /* ─── AUDIO ─── */
  window.loadAudio = async function () {
    try {
      const rec = $("reciterSel").value;
      const r = await fetch(
        `https://api.alquran.cloud/v1/ayah/${S.surah}:${S.ayah}/${rec}`,
      );
      const j = await r.json();
      if (j.code === 200 && j.data.audio) {
        audio.src = j.data.audio;
        audio.load();
        $("playIcon").className = "fa-solid fa-play";
      }
    } catch (e) {}
  };

  window.togglePlay = function () {
    if (audio.paused) {
      audio.play().catch(() => {});
      $("playIcon").className = "fa-solid fa-pause";
    } else {
      audio.pause();
      $("playIcon").className = "fa-solid fa-play";
    }
  };

  function onProgress() {
    if (!audio.duration) return;
    $("audioScrub").value = (audio.currentTime / audio.duration) * 100;
    $("timeCur").textContent = fmt(audio.currentTime);
  }

  window.seekAudio = function () {
    if (audio.duration)
      audio.currentTime = ($("audioScrub").value / 100) * audio.duration;
  };

  function onEnded() {
    $("playIcon").className = "fa-solid fa-play";
    if (S.repeat) {
      audio.currentTime = 0;
      audio.play();
      return;
    }
    if (S.autoNext) {
      nextAyah();
      setTimeout(() => audio.play().catch(() => {}), 700);
    }
  }

  window.toggleAuto = function () {
    S.autoNext = !S.autoNext;
    $("btnAuto").classList.toggle("on", S.autoNext);
    toast(S.autoNext ? "Auto-next ON" : "Auto-next OFF");
  };
  window.toggleRepeat = function () {
    S.repeat = !S.repeat;
    $("btnRepeat").classList.toggle("on", S.repeat);
    toast(S.repeat ? "Repeat ON" : "Repeat OFF");
  };

  window.cycleSpeed = function () {
    S.speedIdx = (S.speedIdx + 1) % S.speeds.length;
    const sp = S.speeds[S.speedIdx];
    audio.playbackRate = sp;
    $("speedBadge").textContent = sp + "×";
    toast("Speed: " + sp + "×");
  };

  /* ─── SETTINGS ─── */
  window.toggleNight = function () {
    S.night = !S.night;
    if (S.night) ((S.sepia = false), document.body.classList.remove("sepia"));
    document.body.classList.toggle("night", S.night);
    $("btnNight").classList.toggle("on", S.night);
    toast(S.night ? "Night mode ON" : "Day mode restored");
  };
  window.toggleSepia = function () {
    S.sepia = !S.sepia;
    if (S.sepia) ((S.night = false), document.body.classList.remove("night"));
    document.body.classList.toggle("sepia", S.sepia);
    $("btnSepia").classList.toggle("on", S.sepia);
  };
  window.toggleFocus = function () {
    S.focus = !S.focus;
    document.body.classList.toggle("focus", S.focus);
    $("btnFocus").classList.toggle("on", S.focus);
    toast(S.focus ? "Focus mode ON — sidebar hidden" : "Focus mode OFF");
  };
  window.toggleTranslit = function () {
    S.translit = !S.translit;
    elTranslit.classList.toggle("show", S.translit);
    $("btnTranslit").classList.toggle("on", S.translit);
  };
  window.toggleMemorize = function () {
    S.memorize = !S.memorize;
    $("btnMemorize").classList.toggle("on", S.memorize);
    const ov = document.getElementById("memorizeOverlay");
    if (ov) ov.style.display = S.memorize ? "flex" : "none";
    toast(
      S.memorize ? "Memorize mode ON — tap to reveal" : "Memorize mode OFF",
    );
  };
  window.revealMemorize = function () {
    const ov = document.getElementById("memorizeOverlay");
    if (ov) {
      ov.style.opacity = "0";
      setTimeout(() => (ov.style.display = "none"), 300);
    }
  };

  const fontSizes = [1.7, 2.0, 2.4, 2.8, 3.4, 4.0];
  window.cycleFontSize = function () {
    S.fontIdx = (S.fontIdx + 1) % fontSizes.length;
    elArabic.style.fontSize = fontSizes[S.fontIdx] + "rem";
    toast("Font: " + fontSizes[S.fontIdx] + "rem");
  };

  /* ─── SEARCH ─── */
  window.onGlobalSearch = function () {
    const q = $("globalSearch").value.toLowerCase();
    $("searchClear").style.display = q ? "block" : "none";
    const f = S.surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(q),
    );
    renderSurahList(f);
  };
  window.clearSearch = function () {
    $("globalSearch").value = "";
    $("searchClear").style.display = "none";
    renderSurahList(S.surahs);
  };

  /* ─── ACTIONS ─── */
  window.copyAyah = function () {
    const txt = `${elArabic.textContent.replace(/[٠-٩]/g, "").trim()}\n\n${elTrans.textContent}\n\n— Quran ${S.surah}:${S.ayah}`;
    navigator.clipboard?.writeText(txt);
    toast("Ayah copied ✓");
  };
  window.bookmarkAyah = function () {
    const info = S.surahs.find((s) => s.number === S.surah);
    const key = `${S.surah}:${S.ayah}`;
    const exists = S.bookmarks.find((b) => b.key === key);
    if (exists) {
      S.bookmarks = S.bookmarks.filter((b) => b.key !== key);
      toast("Bookmark removed");
    } else {
      S.bookmarks.unshift({
        key,
        surah: S.surah,
        ayah: S.ayah,
        name: info?.englishName || "",
        saved: Date.now(),
      });
      toast("Bookmarked " + key + " ✓");
    }
    localStorage.setItem("n_bm", JSON.stringify(S.bookmarks));
    renderBm();
    updateStats();
  };
  window.shareWA = function () {
    const txt = encodeURIComponent(
      `${elArabic.textContent.replace(/[٠-٩]/g, "").trim()}\n\n${elTrans.textContent}\n\n— Quran ${S.surah}:${S.ayah}\n\nRead Quran at: noor-quran`,
    );
    window.open("https://wa.me/?text=" + txt, "_blank");
  };
  window.randomAyah = function () {
    const rs = Math.floor(Math.random() * 114) + 1;
    const inf = S.surahs.find((s) => s.number === rs);
    if (inf) goTo(rs, Math.floor(Math.random() * inf.numberOfAyahs) + 1);
  };

  /* ─── NOTES ─── */
  window.toggleNote = function () {
    const el = $("inlineNotes");
    el.classList.toggle("show");
    if (el.classList.contains("show")) updateNote();
  };
  function updateNote() {
    const key = `${S.surah}:${S.ayah}`;
    $("noteTextarea").value = S.notes[key] || "";
  }
  window.saveNote = function () {
    const key = `${S.surah}:${S.ayah}`;
    const val = $("noteTextarea").value.trim();
    if (val) S.notes[key] = val;
    else delete S.notes[key];
    localStorage.setItem("n_notes", JSON.stringify(S.notes));
  };

  /* ─── TAFSIR ─── */
  window.openTafsir = async function () {
    openModal("tafsirModal");
    $("tafsirBody").innerHTML = '<p style="opacity:.5">Loading commentary…</p>';
    try {
      const [r1, r2] = await Promise.all([
        fetch(
          `https://api.alquran.cloud/v1/ayah/${S.surah}:${S.ayah}/en.pickthall`,
        ),
        fetch(
          `https://api.alquran.cloud/v1/ayah/${S.surah}:${S.ayah}/en.sahih`,
        ),
      ]);
      const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
      const info = S.surahs.find((s) => s.number === S.surah);
      $("tafsirBody").innerHTML = `
      <h4>${info?.englishName || ""} ${S.surah}:${S.ayah} — ${info?.englishNameTranslation || ""}</h4>
      <div style="font-family:Scheherazade New,serif;font-size:2rem;direction:rtl;text-align:right;line-height:2;padding:18px;background:rgba(201,168,76,.07);border-radius:12px;margin-bottom:16px">
        ${j1.code === 200 ? j1.data.text : ""}
      </div>
      <div class="meta-row">
        <div class="meta-item"><strong>Juz</strong><br>${j1.data?.juz || "—"}</div>
        <div class="meta-item"><strong>Manzil</strong><br>${j1.data?.manzil || "—"}</div>
        <div class="meta-item"><strong>Page</strong><br>${j1.data?.page || "—"}</div>
        <div class="meta-item"><strong>Ruku</strong><br>${j1.data?.ruku || "—"}</div>
        <div class="meta-item"><strong>Sajda</strong><br>${j1.data?.sajda ? "Yes ★" : "No"}</div>
        <div class="meta-item"><strong>Type</strong><br>${info?.revelationType || "—"}</div>
      </div>
      <h4 style="margin-bottom:8px">Pickthall Translation</h4>
      <p><em>${j1.code === 200 ? '"' + j1.data.text + '"' : "Not available"}</em></p>
      <h4 style="margin-bottom:8px;margin-top:14px">Sahih International</h4>
      <p><em>${j2.code === 200 ? '"' + j2.data.text + '"' : "Not available"}</em></p>
      <p style="font-size:.82rem;color:var(--muted);margin-top:14px;padding-top:12px;border-top:1px solid var(--border2)">For deep tafsir (Ibn Kathir, Al-Tabari, Al-Qurtubi), please visit a dedicated Islamic reference library.</p>`;
    } catch (e) {
      $("tafsirBody").innerHTML =
        '<p style="color:#a04040">Could not load tafsir. Check connection.</p>';
    }
  };

  /* ─── DHIKR ─── */
  window.dhikrTap = function () {
    S.dhikrCount++;
    const el = $("dhikrNum");
    el.textContent = S.dhikrCount;
    el.classList.add("bump");
    setTimeout(() => el.classList.remove("bump"), 120);
    const tgt = S.dhikrList[S.dhikrIdx].n;
    $("dhikrFill").style.width =
      Math.min(100, (S.dhikrCount / tgt) * 100) + "%";
    if (S.dhikrCount >= tgt) {
      S.dhikrIdx = (S.dhikrIdx + 1) % S.dhikrList.length;
      S.dhikrCount = 0;
      $("dhikrAr").textContent = S.dhikrList[S.dhikrIdx].ar;
      $("dhikrTgt").textContent = S.dhikrList[S.dhikrIdx].n;
      el.textContent = "0";
      $("dhikrFill").style.width = "0%";
      toast("🌿 Mashallah! → " + S.dhikrList[S.dhikrIdx].en);
    }
  };
  window.resetDhikr = function () {
    S.dhikrCount = 0;
    $("dhikrNum").textContent = "0";
    $("dhikrFill").style.width = "0%";
  };

  /* ─── DUA ─── */
  function renderDua() {
    const d = S.duas[S.duaIdx];
    $("duaAr").textContent = d.ar;
    $("duaTr").textContent = d.tr;
  }
  window.nextDua = function () {
    S.duaIdx = (S.duaIdx + 1) % S.duas.length;
    renderDua();
  };
  window.prevDua = function () {
    S.duaIdx = (S.duaIdx - 1 + S.duas.length) % S.duas.length;
    renderDua();
  };
  window.copyDua = function () {
    const d = S.duas[S.duaIdx];
    navigator.clipboard?.writeText(d.ar + "\n\n" + d.tr);
    toast("Dua copied ✓");
  };

  /* ─── PRAYER TIMES ─── */
  let pMins = [],
    nextPrayerMin = 0,
    nextPrayerName = "";
  function initPrayer() {
    if (!navigator.geolocation) {
      prayerFallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lng } = pos.coords;
        const r = await fetch(
          `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`,
        );
        const j = await r.json();
        if (j.code === 200) {
          const t = j.data.timings,
            m = j.data.meta;
          $("prayerLoc").textContent = m.timezone || "Local";
          const prayers = [
            { n: "Fajr", t: t.Fajr },
            { n: "Sunrise", t: t.Sunrise },
            { n: "Dhuhr", t: t.Dhuhr },
            { n: "Asr", t: t.Asr },
            { n: "Maghrib", t: t.Maghrib },
            { n: "Isha", t: t.Isha },
          ];
          const now = new Date();
          const nowM = now.getHours() * 60 + now.getMinutes();
          pMins = prayers.map((p) => {
            const [h, mn] = p.t.split(":").map(Number);
            return h * 60 + mn;
          });
          let nIdx = -1;
          for (let i = 0; i < pMins.length; i++) {
            if (pMins[i] > nowM) {
              nIdx = i;
              break;
            }
          }
          if (nIdx >= 0) {
            nextPrayerMin = pMins[nIdx];
            nextPrayerName = prayers[nIdx].n;
          }
          $("prayerList").innerHTML = prayers
            .map(
              (p, i) => `
          <div class="p-item ${i === nIdx ? "next" : pMins[i] < nowM ? "passed" : ""}">
            <span class="p-name">${p.n}${i === nIdx ? ` <span class="next-tag">NEXT</span>` : ""}</span>
            <span class="p-time">${p.t}</span>
          </div>`,
            )
            .join("");
        }
      } catch (e) {
        prayerFallback();
      }
    }, prayerFallback);
  }
  function prayerFallback() {
    $("prayerLoc").textContent = "Enable location";
    $("prayerList").innerHTML =
      '<div style="padding:12px;text-align:center;color:rgba(180,190,255,.4);font-size:.82rem">Allow location access</div>';
  }
  function updatePrayerCountdown() {
    const now = new Date();
    const nowM = now.getHours() * 60 + now.getMinutes();
    if (!nextPrayerMin) return;
    let diff = nextPrayerMin - nowM;
    if (diff < 0) diff += 1440;
    const h = Math.floor(diff / 60),
      m = diff % 60;
    $("nextPrayerCountdown").textContent = h > 0 ? `${h}h ${m}m ` : `${m} min `;
  }

  /* ─── QIBLA ─── */
  function initQibla() {
    if (!navigator.geolocation) {
      $("qiblaSub").textContent = "Location unavailable";
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const dLng = ((39.8262 - lng) * Math.PI) / 180;
        const lt1 = (lat * Math.PI) / 180,
          lt2 = (21.4225 * Math.PI) / 180;
        const y = Math.sin(dLng) * Math.cos(lt2);
        const x =
          Math.cos(lt1) * Math.sin(lt2) -
          Math.sin(lt1) * Math.cos(lt2) * Math.cos(dLng);
        const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
        $("qiblaNeedle").style.transform =
          `translateX(-50%) translateY(-100%) rotate(${deg}deg)`;
        $("qiblaDeg").textContent = Math.round(deg) + "°";
        $("qiblaSub").textContent = "from North · towards Makkah";
      },
      () => {
        $("qiblaSub").textContent = "Allow location access";
      },
    );
  }

  /* ─── HIJRI CALENDAR ─── */
  function initHijri() {
    const hijriMonths = [
      "Muharram",
      "Safar",
      "Rabi al-Awwal",
      "Rabi al-Thani",
      "Jumada al-Awwal",
      "Jumada al-Thani",
      "Rajab",
      "Sha'ban",
      "Ramadan",
      "Shawwal",
      "Dhu al-Qi'dah",
      "Dhu al-Hijjah",
    ];
    try {
      const today = new Date();
      fetch(
        `https://api.aladhan.com/v1/gToH/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`,
      )
        .then((r) => r.json())
        .then((j) => {
          if (j.code === 200) {
            const h = j.data.hijri;
            $("hijriMonth").textContent =
              h.day + " " + hijriMonths[parseInt(h.month.number) - 1];
            $("hijriFull").textContent = h.month.en + " " + h.year + " AH";
            $("hijriGreg").textContent = today.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          }
        });
    } catch (e) {
      $("hijriMonth").textContent = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });
      $("hijriGreg").textContent = new Date().getFullYear() + " CE";
    }
  }

  /* ─── STATS ─── */
  function bumpStats() {
    S.stats.ayahs = (S.stats.ayahs || 0) + 1;
    if (!S.stats.surahs) S.stats.surahs = [];
    if (!S.stats.surahs.includes(S.surah)) S.stats.surahs.push(S.surah);
    const today = new Date().toDateString();
    if (S.stats.lastDate !== today) {
      const yest = new Date(Date.now() - 86400000).toDateString();
      S.stats.streak =
        S.stats.lastDate === yest ? (S.stats.streak || 0) + 1 : 1;
      S.stats.lastDate = today;
    }
    localStorage.setItem("n_stats", JSON.stringify(S.stats));
    renderStats();
  }
  function updateStats() {
    S.stats.bm = S.bookmarks.length;
    localStorage.setItem("n_stats", JSON.stringify(S.stats));
    renderStats();
  }
  function renderStats() {
    $("statAyahs").textContent = S.stats.ayahs || 0;
    $("statStreak").textContent = (S.stats.streak || 0) + "🔥";
    $("statSurahs").textContent = (S.stats.surahs || []).length;
    $("statBm").textContent = S.bookmarks.length;
  }

  /* ─── BOOKMARKS ─── */
  function renderBm() {
    const el = $("bmList");
    if (!S.bookmarks.length) {
      el.innerHTML = '<div class="bm-empty">No bookmarks yet</div>';
      return;
    }
    el.innerHTML = S.bookmarks
      .map(
        (b) => `
    <div class="bm-item">
      <i class="fa-solid fa-bookmark"></i>
      <div onclick="goTo(${b.surah},${b.ayah})" style="flex:1">
        <div style="font-weight:600;font-size:.88rem">${b.name}</div>
        <div style="font-size:.7rem;color:var(--muted)">${b.key} · ${new Date(b.saved).toLocaleDateString()}</div>
      </div>
      <div class="bm-del" onclick="removeBm('${b.key}')">✕</div>
    </div>`,
      )
      .join("");
  }
  window.removeBm = function (key) {
    S.bookmarks = S.bookmarks.filter((b) => b.key !== key);
    localStorage.setItem("n_bm", JSON.stringify(S.bookmarks));
    renderBm();
    updateStats();
    toast("Bookmark removed");
  };

  /* ─── LAST READ ─── */
  function saveLastRead() {
    localStorage.setItem(
      "n_last",
      JSON.stringify({ surah: S.surah, ayah: S.ayah }),
    );
  }
  function loadLastRead() {
    const lr = JSON.parse(localStorage.getItem("n_last") || "null");
    if (lr && (lr.surah !== 1 || lr.ayah !== 1)) {
      const bar = $("resumeBar");
      bar.style.display = "flex";
      $("resumeLabel").textContent = `Surah ${lr.surah}, Ayah ${lr.ayah}`;
      bar._lr = lr;
    }
  }
  window.goResume = function () {
    const lr = $("resumeBar")._lr;
    if (lr) goTo(lr.surah, lr.ayah);
    $("resumeBar").style.display = "none";
  };

  /* ─── VERSE OF THE DAY ─── */
  function initVotd() {
    if (!S.surahs.length) return;
    const todaySeed = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem("n_votd") || "null");
    if (stored && stored.date === todaySeed) {
      showVotd(stored);
      return;
    }
    const idx = (new Date().getDate() * 7 + new Date().getMonth() * 3) % 6236;
    fetch(`https://api.alquran.cloud/v1/ayah/${idx + 1}/${S.lang}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.code === 200) {
          const v = {
            date: todaySeed,
            surah: j.data.surah.number,
            ayah: j.data.numberInSurah,
            ar: "",
            tr: j.data.text,
            name: j.data.surah.englishName,
          };
          fetch(
            `https://api.alquran.cloud/v1/ayah/${v.surah}:${v.ayah}/ar.alafasy`,
          )
            .then((r2) => r2.json())
            .then((j2) => {
              v.ar = j2.data?.text || "";
              localStorage.setItem("n_votd", JSON.stringify(v));
              showVotd(v);
            });
        }
      })
      .catch(() => {});
  }
  window.loadVotd = function () {};
  function showVotd(v) {
    S.votd = v;
    $("votdLabel").textContent =
      `Verse of the Day — ${v.name} ${v.surah}:${v.ayah}`;
    $("votdAr").textContent = v.ar || v.tr.substring(0, 80) + "…";
  }
  window.goVotd = function () {
    if (S.votd) goTo(S.votd.surah, S.votd.ayah);
  };

  /* ─── 99 NAMES ─── */
  const asmaData = [
    { ar: "الرَّحْمَٰنُ", en: "The Most Gracious", n: 1 },
    { ar: "الرَّحِيمُ", en: "The Most Merciful", n: 2 },
    { ar: "الْمَلِكُ", en: "The King", n: 3 },
    { ar: "الْقُدُّوسُ", en: "The Most Holy", n: 4 },
    { ar: "السَّلَامُ", en: "The Source of Peace", n: 5 },
    { ar: "الْمُؤْمِنُ", en: "The Guardian of Faith", n: 6 },
    { ar: "الْمُهَيْمِنُ", en: "The Protector", n: 7 },
    { ar: "الْعَزِيزُ", en: "The Almighty", n: 8 },
    { ar: "الْجَبَّارُ", en: "The Compeller", n: 9 },
    { ar: "الْمُتَكَبِّرُ", en: "The Majestic", n: 10 },
    { ar: "الْخَالِقُ", en: "The Creator", n: 11 },
    { ar: "الْبَارِئُ", en: "The Originator", n: 12 },
    { ar: "الْمُصَوِّرُ", en: "The Fashioner", n: 13 },
    { ar: "الْغَفَّارُ", en: "The Forgiving", n: 14 },
    { ar: "الْقَهَّارُ", en: "The Subduer", n: 15 },
    { ar: "الْوَهَّابُ", en: "The Bestower", n: 16 },
    { ar: "الرَّزَّاقُ", en: "The Provider", n: 17 },
    { ar: "الْفَتَّاحُ", en: "The Opener", n: 18 },
    { ar: "الْعَلِيمُ", en: "The All-Knowing", n: 19 },
    { ar: "الْقَابِضُ", en: "The Withholder", n: 20 },
    { ar: "الْبَاسِطُ", en: "The Expander", n: 21 },
    { ar: "الْخَافِضُ", en: "The Abaser", n: 22 },
    { ar: "الرَّافِعُ", en: "The Exalter", n: 23 },
    { ar: "الْمُعِزُّ", en: "The Honorer", n: 24 },
    { ar: "الْمُذِلُّ", en: "The Dishonorer", n: 25 },
    { ar: "السَّمِيعُ", en: "The All-Hearing", n: 26 },
    { ar: "الْبَصِيرُ", en: "The All-Seeing", n: 27 },
    { ar: "الْحَكَمُ", en: "The Judge", n: 28 },
    { ar: "الْعَدْلُ", en: "The Just", n: 29 },
    { ar: "اللَّطِيفُ", en: "The Subtle", n: 30 },
    { ar: "الْخَبِيرُ", en: "The Aware", n: 31 },
    { ar: "الْحَلِيمُ", en: "The Forbearing", n: 32 },
    { ar: "الْعَظِيمُ", en: "The Magnificent", n: 33 },
    { ar: "الْغَفُورُ", en: "The All-Forgiving", n: 34 },
    { ar: "الشَّكُورُ", en: "The Appreciative", n: 35 },
    { ar: "الْعَلِيُّ", en: "The Most High", n: 36 },
    { ar: "الْكَبِيرُ", en: "The Most Great", n: 37 },
    { ar: "الْحَفِيظُ", en: "The Preserver", n: 38 },
    { ar: "الْمُقِيتُ", en: "The Sustainer", n: 39 },
    { ar: "الْحَسِيبُ", en: "The Reckoner", n: 40 },
    { ar: "الْجَلِيلُ", en: "The Sublime", n: 41 },
    { ar: "الْكَرِيمُ", en: "The Generous", n: 42 },
    { ar: "الرَّقِيبُ", en: "The Watchful", n: 43 },
    { ar: "الْمُجِيبُ", en: "The Responsive", n: 44 },
    { ar: "الْوَاسِعُ", en: "The All-Encompassing", n: 45 },
    { ar: "الْحَكِيمُ", en: "The Wise", n: 46 },
    { ar: "الْوَدُودُ", en: "The Loving", n: 47 },
    { ar: "الْمَجِيدُ", en: "The Glorious", n: 48 },
    { ar: "الْبَاعِثُ", en: "The Resurrector", n: 49 },
    { ar: "الشَّهِيدُ", en: "The Witness", n: 50 },
    { ar: "الْحَقُّ", en: "The Truth", n: 51 },
    { ar: "الْوَكِيلُ", en: "The Trustee", n: 52 },
    { ar: "الْقَوِيُّ", en: "The Most Strong", n: 53 },
    { ar: "الْمَتِينُ", en: "The Firm", n: 54 },
    { ar: "الْوَلِيُّ", en: "The Protecting Friend", n: 55 },
    { ar: "الْحَمِيدُ", en: "The Praiseworthy", n: 56 },
    { ar: "الْمُحْصِي", en: "The Reckoner", n: 57 },
    { ar: "الْمُبْدِئُ", en: "The Originator", n: 58 },
    { ar: "الْمُعِيدُ", en: "The Restorer", n: 59 },
    { ar: "الْمُحْيِي", en: "The Giver of Life", n: 60 },
    { ar: "الْمُمِيتُ", en: "The Bringer of Death", n: 61 },
    { ar: "الْحَيُّ", en: "The Ever-Living", n: 62 },
    { ar: "الْقَيُّومُ", en: "The Self-Subsisting", n: 63 },
    { ar: "الْوَاجِدُ", en: "The Finder", n: 64 },
    { ar: "الْمَاجِدُ", en: "The Noble", n: 65 },
    { ar: "الْوَاحِدُ", en: "The One", n: 66 },
    { ar: "الأَحَدُ", en: "The Unique", n: 67 },
    { ar: "الصَّمَدُ", en: "The Eternal", n: 68 },
    { ar: "الْقَادِرُ", en: "The All-Powerful", n: 69 },
    { ar: "الْمُقْتَدِرُ", en: "The Powerful", n: 70 },
    { ar: "الْمُقَدِّمُ", en: "The Expediter", n: 71 },
    { ar: "الْمُؤَخِّرُ", en: "The Delayer", n: 72 },
    { ar: "الأَوَّلُ", en: "The First", n: 73 },
    { ar: "الآخِرُ", en: "The Last", n: 74 },
    { ar: "الظَّاهِرُ", en: "The Manifest", n: 75 },
    { ar: "الْبَاطِنُ", en: "The Hidden", n: 76 },
    { ar: "الْوَالِي", en: "The Governor", n: 77 },
    { ar: "الْمُتَعَالِي", en: "The Most Exalted", n: 78 },
    { ar: "الْبَرُّ", en: "The Source of All Good", n: 79 },
    { ar: "التَّوَّابُ", en: "The Ever-Pardoning", n: 80 },
    { ar: "الْمُنْتَقِمُ", en: "The Avenger", n: 81 },
    { ar: "الْعَفُوُّ", en: "The Pardoner", n: 82 },
    { ar: "الرَّؤُوفُ", en: "The Compassionate", n: 83 },
    { ar: "مَالِكُ الْمُلْكِ", en: "Owner of All", n: 84 },
    { ar: "ذُو الْجَلَالِ", en: "Lord of Majesty", n: 85 },
    { ar: "الْمُقْسِطُ", en: "The Equitable", n: 86 },
    { ar: "الْجَامِعُ", en: "The Gatherer", n: 87 },
    { ar: "الْغَنِيُّ", en: "The Self-Sufficient", n: 88 },
    { ar: "الْمُغْنِي", en: "The Enricher", n: 89 },
    { ar: "الْمَانِعُ", en: "The Withholder", n: 90 },
    { ar: "الضَّارُّ", en: "The Distresser", n: 91 },
    { ar: "النَّافِعُ", en: "The Propitious", n: 92 },
    { ar: "النُّورُ", en: "The Light", n: 93 },
    { ar: "الْهَادِي", en: "The Guide", n: 94 },
    { ar: "الْبَدِيعُ", en: "The Incomparable", n: 95 },
    { ar: "الْبَاقِي", en: "The Ever-Enduring", n: 96 },
    { ar: "الْوَارِثُ", en: "The Inheritor", n: 97 },
    { ar: "الرَّشِيدُ", en: "The Righteous Teacher", n: 98 },
    { ar: "الصَّبُورُ", en: "The Patient", n: 99 },
  ];

  window.buildAsmaGrid = function () {
    $("asmaGrid").innerHTML = asmaData
      .map(
        (a) => `
    <div class="asma-item" onclick="toast('${a.en}')">
      <div class="asma-ar">${a.ar}</div>
      <div class="asma-en">${a.en}</div>
      <div class="asma-num">${a.n}</div>
    </div>`,
      )
      .join("");
  };

  /* ─── PROGRESS MODAL ─── */
  window.buildProgressModal = function () {
    const read = (S.stats.surahs || []).length;
    const pct = Math.round((read / 114) * 100);
    $("progressBody").innerHTML = `
    <h4 style="margin-bottom:16px">Overall Quran Journey</h4>
    <div class="progress-bar-row">
      <div style="font-family:Cinzel,serif;font-size:.8rem;color:var(--muted);width:80px">Surahs</div>
      <div class="progress-bar-bg"><div class="progress-bar-inner" style="width:${pct}%"></div></div>
      <div class="progress-label">${read}/114</div>
    </div>
    <div class="progress-bar-row">
      <div style="font-family:Cinzel,serif;font-size:.8rem;color:var(--muted);width:80px">Ayahs</div>
      <div class="progress-bar-bg"><div class="progress-bar-inner" style="width:${Math.min(100, (S.stats.ayahs / 6236) * 100)}%;background:linear-gradient(90deg,var(--lapis),var(--lapis2))"></div></div>
      <div class="progress-label">${S.stats.ayahs}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:20px">
      <div style="text-align:center;background:rgba(201,168,76,.07);border-radius:14px;padding:16px;border:1px solid rgba(201,168,76,.15)">
        <div style="font-family:Cinzel Decorative,serif;font-size:2rem;color:var(--g2)">${S.stats.ayahs || 0}</div>
        <div style="font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-top:4px">Ayahs Read</div>
      </div>
      <div style="text-align:center;background:rgba(201,168,76,.07);border-radius:14px;padding:16px;border:1px solid rgba(201,168,76,.15)">
        <div style="font-family:Cinzel Decorative,serif;font-size:2rem;color:var(--g2)">${S.stats.streak || 0}🔥</div>
        <div style="font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-top:4px">Day Streak</div>
      </div>
      <div style="text-align:center;background:rgba(201,168,76,.07);border-radius:14px;padding:16px;border:1px solid rgba(201,168,76,.15)">
        <div style="font-family:Cinzel Decorative,serif;font-size:2rem;color:var(--g2)">${S.bookmarks.length}</div>
        <div style="font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-top:4px">Bookmarks</div>
      </div>
    </div>
    <p style="font-size:.82rem;color:var(--muted);margin-top:18px;text-align:center;font-style:italic">"Read the Quran, for verily it will come on the Day of Resurrection as an intercessor for its companions." — Muslim</p>`;
  };

  /* ─── NOTES MODAL ─── */
  window.buildNotesModal = function () {
    const keys = Object.keys(S.notes);
    if (!keys.length) {
      $("notesBody").innerHTML =
        '<p style="color:var(--muted);text-align:center;padding:20px">No notes saved yet. Use the Note button on any ayah.</p>';
      return;
    }
    $("notesBody").innerHTML = keys
      .map((k) => {
        const [s, a] = k.split(":").map(Number);
        const info = S.surahs.find((x) => x.number === s);
        return `<div style="background:rgba(201,168,76,.07);border-radius:12px;padding:14px 16px;margin-bottom:10px;border:1px solid rgba(201,168,76,.12)">
      <div style="font-family:Cinzel,serif;font-size:.78rem;color:var(--g2);margin-bottom:6px;cursor:pointer" onclick="closeModal('notesModal');goTo(${s},${a})">${info?.englishName || "Surah " + s} · Ayah ${a} →</div>
      <div style="font-size:.95rem;color:var(--text)">${S.notes[k]}</div>
    </div>`;
      })
      .join("");
  };

  /* ─── MODAL HELPERS ─── */
  window.openModal = function (id) {
    $(id).classList.add("open");
  };
  window.closeModal = function (id) {
    $(id).classList.remove("open");
  };

  /* ─── TABS (mobile & nav) ─── */
  window.switchTab = function (tab) {
    document
      .querySelectorAll(".nav-tab")
      .forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    if (tab === "read") {
      $("readerPanel").scrollIntoView({ behavior: "smooth" });
    } else if (
      tab === "prayer" ||
      tab === "dhikr" ||
      tab === "tools" ||
      tab === "bm"
    ) {
      $("rightCol").scrollIntoView({ behavior: "smooth" });
    }
  };

  /* ─── HELPERS ─── */
  function toAr(n) {
    return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  }
  function fmt(s) {
    if (isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }
  function getJuz(s) {
    const m = [
      1, 1, 2, 3, 4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17,
      17, 18, 19, 20, 21, 22, 22, 22, 22, 22, 23, 23, 23, 24, 24, 25, 25, 26,
      26, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29,
      30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
      30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
      30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
      30, 30,
    ];
    return m[s - 1] || 1;
  }
  function getPage(s) {
    const m = [
      1, 1, 2, 50, 77, 102, 128, 151, 178, 187, 208, 221, 235, 249, 255, 262,
      267, 282, 293, 305, 312, 322, 332, 342, 350, 367, 377, 385, 396, 404, 411,
      415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 503, 507,
      513, 518, 523, 526, 534, 538, 542, 545, 549, 551, 554, 556, 558, 562, 564,
      566, 568, 570, 572, 574, 577, 579, 582, 584, 586, 591, 595, 596, 598, 600,
      602, 604, 606, 607, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619,
      620, 621, 621, 622, 622, 623, 623, 624, 624, 624, 625, 625, 625, 626, 626,
      626, 627, 627, 627, 628, 628, 628, 628,
    ];
    return m[s - 1] || 1;
  }

  /* ─── TOAST ─── */
  let toastT = null;
  window.toast = function (msg, dur = 2600) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove("show"), dur);
  };

  window.onLangChange = function () {
    S.lang = $("langSelect").value;
    loadContent();
  };
})();
