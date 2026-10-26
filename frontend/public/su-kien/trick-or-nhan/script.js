/* ══════════════════════════════════════════════════════════════
   MINIGAME TRICK OR “NHÃN” — Nguyệt Nhãn Phố Hiến
   Quay số ngẫu nhiên 00–99, chọn 03 người thắng cuộc.
   Toàn bộ dữ liệu lưu tại localStorage của thiết bị.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const STORAGE_KEY = "nn_trick_or_nhan_v1";
  const MAX_WINNERS = 3;
  const MAX_ENTRIES = 100; // dải số 00 → 99
  const SPIN_MS = 3400;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const els = {
    reel: document.getElementById("reel"),
    digitA: document.getElementById("digitA"),
    digitB: document.getElementById("digitB"),
    spinBtn: document.getElementById("spinBtn"),
    spinLabel: document.getElementById("spinLabel"),
    gameHint: document.getElementById("gameHint"),
    winCount: document.getElementById("winCount"),
    winnerList: document.getElementById("winnerList"),
    copyResult: document.getElementById("copyResult"),
    resetDraw: document.getElementById("resetDraw"),
    soundToggle: document.getElementById("soundToggle"),
    soundIcon: document.getElementById("soundIcon"),
    namesInput: document.getElementById("namesInput"),
    saveNames: document.getElementById("saveNames"),
    clearNames: document.getElementById("clearNames"),
    demoNames: document.getElementById("demoNames"),
    adminStatus: document.getElementById("adminStatus"),
    namesTable: document.getElementById("namesTable"),
    reveal: document.getElementById("reveal"),
    revealNum: document.getElementById("revealNum"),
    revealTitle: document.getElementById("revealTitle"),
    revealPrize: document.getElementById("revealPrize"),
    revealClose: document.getElementById("revealClose"),
    confetti: document.getElementById("confetti"),
    year: document.getElementById("year"),
  };

  /** @type {{participants: {name: string, num: string}[], winners: {num: string, name: string|null}[], sound: boolean}} */
  const state = {
    participants: [],
    winners: [],
    sound: true,
  };

  let spinning = false;
  let lastFocused = null;

  /* ── Tiện ích ─────────────────────────────────────────────── */
  const pad = (n) => String(n).padStart(2, "0");
  const randomInt = (max) => {
    // Ưu tiên crypto nếu có, fallback Math.random
    if (window.crypto && window.crypto.getRandomValues) {
      const limit = Math.floor(0xffffffff / max) * max;
      const buf = new Uint32Array(1);
      let v;
      do {
        window.crypto.getRandomValues(buf);
        v = buf[0];
      } while (v >= limit);
      return v % max;
    }
    return Math.floor(Math.random() * max);
  };

  const normalizeName = (s) =>
    s
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase("vi");

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* Trình duyệt chặn localStorage — bỏ qua, game vẫn chạy trong phiên hiện tại. */
    }
  }

  /* ── Âm thanh (Web Audio, không cần tệp ngoài) ───────────── */
  let audioCtx = null;

  function getAudio() {
    if (!state.sound) return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, duration, type, volume, delay) {
    const ctx = getAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  const playTick = () => tone(880 + Math.random() * 240, 0.045, "square", 0.028);
  const playWin = () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.35, "triangle", 0.09, i * 0.1));
    tone(261.63, 0.7, "sine", 0.07, 0.05);
  };

  /* ── Lưu / đọc trạng thái ────────────────────────────────── */
  function save() {
    safeStorageSet(
      STORAGE_KEY,
      JSON.stringify({ participants: state.participants, winners: state.winners, sound: state.sound })
    );
  }

  function load() {
    const raw = safeStorageGet(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data.participants)) {
        state.participants = data.participants
          .filter((p) => p && typeof p.name === "string")
          .slice(0, MAX_ENTRIES)
          .map((p, i) => ({ name: p.name, num: pad(i) }));
      }
      if (Array.isArray(data.winners)) {
        state.winners = data.winners
          .filter((w) => w && typeof w.num === "string")
          .slice(0, MAX_WINNERS)
          .map((w) => ({
            num: w.num,
            name: typeof w.name === "string" ? w.name : null,
          }));
      }
      if (typeof data.sound === "boolean") state.sound = data.sound;
    } catch {
      /* Dữ liệu cũ hỏng — bắt đầu lại với danh sách trống. */
    }
  }

  /* ── Giao diện ───────────────────────────────────────────── */
  function setDigits(value) {
    const s = pad(value).slice(-2);
    if (els.digitA.textContent !== s[0]) els.digitA.textContent = s[0];
    if (els.digitB.textContent !== s[1]) els.digitB.textContent = s[1];
  }

  function eligibleParticipants() {
    const used = new Set(state.winners.map((w) => w.num));
    return state.participants.filter((p) => !used.has(p.num));
  }

  function maxWinners() {
    if (state.participants.length === 0) return MAX_WINNERS;
    return Math.min(MAX_WINNERS, state.participants.length);
  }

  function updateHint() {
    const total = state.participants.length;
    const left = maxWinners() - state.winners.length;

    if (total === 0) {
      els.gameHint.innerHTML =
        state.winners.length >= MAX_WINNERS
          ? "Đã đủ <strong>03</strong> người thắng cuộc 🎉 Xoá kết quả để quay lượt mới."
          : "Chưa có danh sách bình luận — đang quay thử trong dải <strong>00 – 99</strong>. Thêm danh sách ở mục Ban tổ chức bên dưới.";
      return;
    }

    if (left <= 0) {
      els.gameHint.innerHTML =
        "Đã đủ <strong>" + state.winners.length + "</strong> người thắng cuộc 🎉 Xoá kết quả để quay lượt mới.";
      return;
    }

    els.gameHint.innerHTML =
      "Đã có <strong>" + total + "</strong> bình luận hợp lệ · còn <strong>" + left + "</strong> giải chờ quay.";
  }

  function updateSpinButton() {
    const done = state.winners.length >= maxWinners();
    els.spinBtn.disabled = spinning || done;
    if (spinning) {
      els.spinLabel.textContent = "ĐANG QUAY…";
    } else if (done) {
      els.spinLabel.textContent = "ĐÃ ĐỦ GIẢI";
    } else {
      els.spinLabel.textContent = "QUAY SỐ";
    }
  }

  function renderWinners() {
    const slots = els.winnerList.querySelectorAll(".winner-slot");
    slots.forEach((slot, i) => {
      const w = state.winners[i];
      const numEl = slot.querySelector(".winner-slot__num");
      const nameEl = slot.querySelector(".winner-slot__name");
      const ticketEl = slot.querySelector(".winner-slot__ticket");

      numEl.textContent = "Giải " + (i + 1);

      if (w) {
        slot.classList.add("is-filled");
        ticketEl.textContent = w.num;
        nameEl.textContent = w.name || "Số may mắn " + w.num;
      } else {
        slot.classList.remove("is-filled");
        ticketEl.textContent = "--";
        nameEl.textContent = "Đang chờ quay…";
      }
    });
    els.winCount.textContent = state.winners.length + "/" + maxWinners();
  }

  function renderTable() {
    const wonNums = new Set(state.winners.map((w) => w.num));
    if (state.participants.length === 0) {
      els.namesTable.innerHTML =
        '<tr class="admin__empty"><td colspan="2">Chưa có tài khoản nào. Dán danh sách ở trên rồi bấm “Lưu danh sách”.</td></tr>';
      return;
    }
    els.namesTable.innerHTML = state.participants
      .map(
        (p) =>
          '<tr class="' +
          (wonNums.has(p.num) ? "is-winner" : "") +
          '"><td>' +
          p.num +
          "</td><td>" +
          escapeHtml(p.name) +
          (wonNums.has(p.num) ? " 🏆" : "") +
          "</td></tr>"
      )
      .join("");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderAll() {
    renderWinners();
    renderTable();
    updateHint();
    updateSpinButton();
    els.namesInput.value = state.participants.map((p) => p.name).join("\n");
    els.soundToggle.setAttribute("aria-pressed", String(state.sound));
    els.soundIcon.textContent = state.sound ? "🔊" : "🔇";
  }

  function setAdminStatus(message) {
    els.adminStatus.textContent = message;
    window.clearTimeout(setAdminStatus.timer);
    setAdminStatus.timer = window.setTimeout(() => {
      els.adminStatus.textContent = "";
    }, 6000);
  }

  /* ── Quay số ─────────────────────────────────────────────── */
  function pickWinner() {
    if (state.participants.length > 0) {
      const pool = eligibleParticipants();
      if (pool.length === 0) return null;
      return pool[randomInt(pool.length)];
    }
    // Không có danh sách: quay thử trong dải 00–99, không trùng số đã trúng.
    const used = new Set(state.winners.map((w) => w.num));
    const pool = [];
    for (let i = 0; i < 100; i++) if (!used.has(pad(i))) pool.push(pad(i));
    if (pool.length === 0) return null;
    return { num: pool[randomInt(pool.length)], name: null };
  }

  /**
   * Quay hiệu ứng rồi dừng đúng vào targetNum.
   * Dùng setInterval thay vì requestAnimationFrame để không bị treo khi tab bị
   * ẩn (rAF bị tạm dừng ở tab nền, khiến lượt quay không bao giờ kết thúc),
   * kèm một bộ đếm bảo hiểm để luôn trả kết quả đúng giờ.
   */
  function animateTo(targetNum) {
    return new Promise((resolve) => {
      const duration = reduceMotion ? 500 : SPIN_MS;
      const startedAt = performance.now();
      let nextUpdate = 0;
      let finished = false;
      let timer = 0;
      let guard = 0;

      function finish() {
        if (finished) return;
        finished = true;
        window.clearInterval(timer);
        window.clearTimeout(guard);
        document.removeEventListener("visibilitychange", onVisibility);
        els.reel.classList.remove("is-spinning");
        setDigits(targetNum);
        resolve();
      }

      // Tab bị ẩn giữa chừng → chốt luôn kết quả đã chọn.
      function onVisibility() {
        if (document.hidden) finish();
      }

      els.reel.classList.add("is-spinning");
      document.addEventListener("visibilitychange", onVisibility);
      guard = window.setTimeout(finish, duration + 900);

      timer = window.setInterval(() => {
        const elapsed = performance.now() - startedAt;
        const t = Math.min(1, elapsed / duration);

        if (t >= 1) {
          finish();
          return;
        }

        if (elapsed >= nextUpdate) {
          setDigits(randomInt(100));
          if (t < 0.94) playTick();
          // Nhịp chậm dần về cuối
          nextUpdate = elapsed + 42 + 300 * Math.pow(t, 3);
        }
      }, 30);
    });
  }

  async function spin() {
    if (spinning) return;
    const winner = pickWinner();
    if (!winner) {
      setAdminStatus("Không còn số nào để quay. Hãy xoá kết quả để bắt đầu lượt mới.");
      return;
    }

    spinning = true;
    updateSpinButton();
    els.spinBtn.classList.add("is-spinning");
    closeReveal();

    await animateTo(Number(winner.num));

    state.winners.push(winner);
    save();

    spinning = false;
    els.spinBtn.classList.remove("is-spinning");
    renderWinners();
    renderTable();
    updateHint();
    updateSpinButton();

    els.reel.classList.add("is-hot");
    window.setTimeout(() => els.reel.classList.remove("is-hot"), 1500);

    showReveal(winner, state.winners.length - 1);
    playWin();
  }

  /* ── Overlay chúc mừng ───────────────────────────────────── */
  function showReveal(winner, index) {
    const done = state.winners.length >= maxWinners();

    els.revealNum.textContent = winner.num;
    els.revealTitle.textContent = winner.name || "Số may mắn " + winner.num;
    els.revealPrize.textContent =
      "Giải " +
      (index + 1) +
      " · Phần quà từ Nguyệt Nhãn Phố Hiến" +
      (done ? " · Đã đủ " + state.winners.length + " người thắng cuộc 🎉" : "");

    lastFocused = document.activeElement;
    els.reveal.hidden = false;
    document.body.style.overflow = "hidden";
    els.revealClose.focus();
    launchConfetti();
  }

  function closeReveal() {
    if (els.reveal.hidden) return;
    els.reveal.hidden = true;
    document.body.style.overflow = "";
    stopConfetti();
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  els.revealClose.addEventListener("click", closeReveal);
  els.reveal.addEventListener("click", (e) => {
    if (e.target === els.reveal) closeReveal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.reveal.hidden) closeReveal();
  });

  /* ── Confetti ────────────────────────────────────────────── */
  let confettiFrame = 0;
  let confettiParticles = [];

  function launchConfetti() {
    if (reduceMotion) return;
    const canvas = els.confetti;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = (canvas.width = Math.floor(window.innerWidth * dpr));
    const h = (canvas.height = Math.floor(window.innerHeight * dpr));
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    const colors = ["#e9772b", "#ffc074", "#b68a45", "#4f7d3a", "#f8f3e8", "#ffa552", "#d5b477"];
    confettiParticles = [];

    for (let i = 0; i < 130; i++) {
      confettiParticles.push({
        x: Math.random() * w,
        y: -Math.random() * h * 0.5,
        w: (6 + Math.random() * 8) * dpr,
        h: (8 + Math.random() * 12) * dpr,
        vx: (Math.random() - 0.5) * 2.2 * dpr,
        vy: (1.6 + Math.random() * 3.4) * dpr,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.22,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }

    cancelAnimationFrame(confettiFrame);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of confettiParticles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045 * dpr;
        p.rot += p.vr;
        if (p.y > h * 0.75) p.life -= 0.012;
        if (p.life <= 0 || p.y > h + 60) continue;
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive > 0) {
        confettiFrame = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    }

    confettiFrame = requestAnimationFrame(draw);
  }

  function stopConfetti() {
    cancelAnimationFrame(confettiFrame);
    const ctx = els.confetti.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, els.confetti.width, els.confetti.height);
    }
  }

  /* ── Danh sách ban tổ chức ───────────────────────────────── */
  function parseNames(text) {
    const rawLines = text.split(/\r?\n/);
    const seen = new Set();
    const names = [];
    let duplicates = 0;
    let overflow = 0;

    for (const line of rawLines) {
      const name = line.replace(/\s+/g, " ").trim();
      if (!name) continue;
      const key = normalizeName(name);
      if (seen.has(key)) {
        duplicates++;
        continue;
      }
      if (names.length >= MAX_ENTRIES) {
        overflow++;
        continue;
      }
      seen.add(key);
      names.push(name);
    }
    return { names, duplicates, overflow };
  }

  els.saveNames.addEventListener("click", () => {
    const { names, duplicates, overflow } = parseNames(els.namesInput.value);
    if (names.length === 0) {
      setAdminStatus("Chưa có tài khoản nào để lưu.");
      return;
    }
    state.participants = names.map((name, i) => ({ name, num: pad(i) }));
    state.winners = [];
    save();
    renderAll();

    const notes = [];
    if (duplicates) notes.push("bỏ " + duplicates + " dòng trùng");
    if (overflow) notes.push("bỏ " + overflow + " dòng vượt quá 100");
    setAdminStatus(
      "Đã lưu " + names.length + " tài khoản" + (notes.length ? " (" + notes.join(", ") + ")" : "") + "."
    );
  });

  els.clearNames.addEventListener("click", () => {
    state.participants = [];
    state.winners = [];
    save();
    els.namesInput.value = "";
    renderAll();
    setAdminStatus("Đã xoá danh sách.");
  });

  els.demoNames.addEventListener("click", () => {
    els.namesInput.value = [
      "Nguyễn Thu Hiền",
      "Trần Minh Anh",
      "Phạm Quốc Bảo",
      "Lê Thu Trang",
      "Hoàng Văn Nam",
      "Đỗ Khánh Linh",
      "Vũ Đức Thắng",
      "Bùi Ngọc Mai",
      "Ngô Thanh Tùng",
      "Trịnh Hồng Nhung",
      "Phan Văn Hùng",
      "Lý Mỹ Duyên",
    ].join("\n");
    setAdminStatus("Đã điền danh sách mẫu — bấm “Lưu danh sách” để bắt đầu quay.");
  });

  /* ── Kết quả ─────────────────────────────────────────────── */
  function resultsText() {
    if (state.winners.length === 0) {
      return "Chưa có người thắng cuộc nào.";
    }
    const lines = ["🎃 KẾT QUẢ MINIGAME TRICK OR “NHÃN” 🎃", ""];
    state.winners.forEach((w, i) => {
      lines.push(
        "Giải " + (i + 1) + ": Số " + w.num + (w.name ? " – " + w.name : "")
      );
    });
    lines.push("", "Nguyệt Nhãn Phố Hiến · nguyetnhanphohien.com");
    return lines.join("\n");
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* Clipboard API bị chặn (quyền/tiêu điểm) — thử cách cũ bên dưới. */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  els.copyResult.addEventListener("click", async () => {
    const ok = await copyText(resultsText());
    setAdminStatus(
      ok
        ? "Đã sao chép kết quả vào bộ nhớ tạm."
        : "Không sao chép được — bạn có thể chọn và copy thủ công."
    );
  });

  els.resetDraw.addEventListener("click", () => {
    if (spinning) return;
    state.winners = [];
    save();
    setDigits(0);
    renderAll();
    closeReveal();
    setAdminStatus("Đã xoá kết quả quay. Sẵn sàng lượt mới!");
  });

  /* ── Điều khiển ──────────────────────────────────────────── */
  els.spinBtn.addEventListener("click", spin);

  els.soundToggle.addEventListener("click", () => {
    state.sound = !state.sound;
    save();
    els.soundToggle.setAttribute("aria-pressed", String(state.sound));
    els.soundIcon.textContent = state.sound ? "🔊" : "🔇";
    if (state.sound) playTick();
  });

  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" && e.key !== " ") return;
    const tag = (e.target && e.target.tagName) || "";
    if (/^(INPUT|TEXTAREA|BUTTON|SELECT|A)$/.test(tag)) return;
    if (!els.reveal.hidden) return;
    e.preventDefault();
    spin();
  });

  window.addEventListener("resize", () => {
    if (!els.reveal.hidden) {
      stopConfetti();
      launchConfetti();
    }
  });

  /* ── Khởi động ───────────────────────────────────────────── */
  els.year.textContent = new Date().getFullYear();
  load();
  renderAll();
  if (state.winners.length > 0) {
    const last = state.winners[state.winners.length - 1];
    setDigits(Number(last.num));
  }
})();
