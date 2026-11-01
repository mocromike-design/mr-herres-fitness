// Mr. Herres Trainingsapp - Applicatie Logica
(function () {
  'use strict';

  // --- STATE MANAGEMENT ---
  const STORAGE_KEY_LOGS = 'mr_herres_exercise_logs_v1';
  const STORAGE_KEY_PHOTOS = 'mr_herres_exercise_photos_v1';
  const STORAGE_KEY_SETTINGS = 'mr_herres_settings_v1';

  let logsData = {};
  let photosData = {};
  let currentDayId = 'MA-1';
  let currentWeek = '1';
  let activeExercise = null;

  // Initialiseer data uit LocalStorage
  function loadStorage() {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      if (storedLogs) logsData = JSON.parse(storedLogs);
    } catch (e) {
      console.warn('Fout bij laden van logs:', e);
      logsData = {};
    }

    try {
      const storedPhotos = localStorage.getItem(STORAGE_KEY_PHOTOS);
      if (storedPhotos) photosData = JSON.parse(storedPhotos);
    } catch (e) {
      console.warn('Fout bij laden van fotos:', e);
      photosData = {};
    }

    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        if (settings.currentDayId) currentDayId = settings.currentDayId;
        if (settings.currentWeek) currentWeek = settings.currentWeek;
      }
    } catch (e) {
      // fallback
    }
  }

  function saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logsData));
    } catch (e) {
      alert('Opslaglimiet bereikt op je toestel!');
    }
  }

  function savePhotos() {
    try {
      localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(photosData));
    } catch (e) {
      alert('Foto kon niet worden opgeslagen (mogelijk te groot voor lokaal geheugen).');
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
        currentDayId,
        currentWeek
      }));
    } catch (e) {}
  }

  // --- HULPFUNCTIES ---
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  // Datum formattering naar DD/MM/JJJJ
  function formatDateNL(dateStr) {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    // Reeds DD/MM/YYYY of D/M/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const p = str.split('/');
      return `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2]}`;
    }
    // DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
      const p = str.split('-');
      return `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2]}`;
    }
    // YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
      const p = str.split('-');
      return `${p[2].slice(0, 2).padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[0]}`;
    }
    // YYYY/MM/DD
    if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(str)) {
      const p = str.split('/');
      return `${p[2].slice(0, 2).padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[0]}`;
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return str;
  }

  function getTodayString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }

  function getLatestLog(exerciseId) {
    const list = logsData[exerciseId];
    if (!list || list.length === 0) return null;
    return list[list.length - 1];
  }

  function getPersonalRecord(exerciseId) {
    const list = logsData[exerciseId];
    if (!list || list.length === 0) return null;
    let max = -1;
    list.forEach(item => {
      if (typeof item.weight === 'number' && item.weight > max) {
        max = item.weight;
      }
    });
    return max > -1 ? max : null;
  }

  // --- SVG ILLUSTRATIE GENERATOR (STANDAARD OEFENINGSHOUDING) ---
  function getIllustrationSvg(exerciseName, target) {
    const nameLower = exerciseName.toLowerCase();
    let iconSvg = '';
    let label = 'Uitvoering & Houding';

    if (nameLower.includes('press') || nameLower.includes('bench') || nameLower.includes('dips')) {
      iconSvg = `<path d="M10 50 Q30 40 50 50 Q70 40 90 50" stroke="#f59e0b" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="50" cy="38" r="7" fill="#fbbf24"/>`;
      label = 'Drukbeweging • Borst & Schouders';
    } else if (nameLower.includes('squat') || (nameLower.includes('press') && nameLower.includes('leg'))) {
      iconSvg = `<path d="M50 20 L50 35 L25 65 L20 90" stroke="#f59e0b" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      label = 'Kniebuiging • Quadriceps & Glutes';
    } else if (nameLower.includes('deadlift') || nameLower.includes('rdl')) {
      iconSvg = `<path d="M30 85 L50 35 L70 85" stroke="#f59e0b" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="50" cy="20" r="6" fill="#fbbf24"/>`;
      label = 'Heupscharnier • Achterketen';
    } else if (nameLower.includes('curl')) {
      iconSvg = `<path d="M40 30 L40 60 L60 50" stroke="#f59e0b" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="60" cy="48" r="8" fill="#fbbf24"/>`;
      label = 'Armbuiging • Biceps & Brachialis';
    } else {
      iconSvg = `<rect x="25" y="38" width="50" height="30" rx="6" stroke="#f59e0b" stroke-width="3" fill="rgba(245,158,11,0.15)"/>`;
      label = `${exerciseName}`;
    }

    return `
      <div class="photo-placeholder">
        <svg viewBox="0 0 100 100" style="max-height: 140px; width: 100%;">
          <rect width="100" height="100" fill="#0b0d11" rx="8"/>
          <g transform="translate(0, 0)">
            ${iconSvg}
          </g>
        </svg>
        <span style="margin-top: 8px; color: #94a3b8;">${label}</span>
      </div>
    `;
  }

  // --- CHART RENDERING (100% STANDALONE HTML5 CANVAS) ---
  function renderProgressChart(canvas, history) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 200;

    // Scherpe weergave op Retina/High DPI Samsung schermen
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const emptyMsg = document.getElementById('chartEmptyMsg');
    if (!history || history.length === 0) {
      if (emptyMsg) emptyMsg.style.display = 'flex';
      return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    // Min & Max berekenen
    const weights = history.map(item => Number(item.weight) || 0);
    let minWeight = Math.min(...weights);
    let maxWeight = Math.max(...weights);

    // Padding toevoegen
    if (minWeight === maxWeight) {
      minWeight = Math.max(0, minWeight - 10);
      maxWeight = maxWeight + 10;
    } else {
      const padding = (maxWeight - minWeight) * 0.2;
      minWeight = Math.max(0, minWeight - padding);
      maxWeight = maxWeight + padding;
    }

    const padLeft = 46;
    const padRight = 24;
    const padTop = 26;
    const padBottom = 34;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    // Raster & Y-as
    ctx.strokeStyle = '#222834';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const val = minWeight + ((maxWeight - minWeight) / ySteps) * i;
      const y = padTop + chartH - (i / ySteps) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(`${val.toFixed(1)} kg`, padLeft - 6, y);
    }

    // Punten plotten
    const points = history.map((item, idx) => {
      const x = history.length === 1 
        ? padLeft + chartW / 2 
        : padLeft + (idx / (history.length - 1)) * chartW;
      const yRatio = (item.weight - minWeight) / (maxWeight - minWeight);
      const y = padTop + chartH - yRatio * chartH;
      return { x, y, weight: item.weight, date: item.date, reps: item.reps };
    });

    // Gradient onder de lijn
    if (points.length > 1) {
      const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(points[points.length - 1].x, padTop + chartH);
      ctx.lineTo(points[0].x, padTop + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Lijn tekenen
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (points.length === 1) {
      ctx.arc(points[0].x, points[0].y, 5, 0, Math.PI * 2);
    } else {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    // Cirkels en labels
    const maxVal = Math.max(...weights);
    points.forEach((pt, idx) => {
      const isPR = pt.weight === maxVal;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isPR ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isPR ? '#fbbf24' : '#15181e';
      ctx.fill();
      ctx.lineWidth = isPR ? 3 : 2;
      ctx.strokeStyle = isPR ? '#ffffff' : '#f59e0b';
      ctx.stroke();

      // Gewicht tekst boven punt
      ctx.fillStyle = isPR ? '#fbbf24' : '#f8fafc';
      ctx.font = isPR ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pt.weight}k`, pt.x, pt.y - 10);

      // Datum op X-as (bij de eerste, laatste, of als er weinig punten zijn)
      if (points.length <= 5 || idx === 0 || idx === points.length - 1) {
        ctx.fillStyle = '#64748b';
        ctx.font = '9px sans-serif';
        const dateFormatted = formatDateNL(pt.date); // DD/MM/JJJJ
        const parts = dateFormatted.split('/');
        const dateShort = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : dateFormatted; // DD/MM
        ctx.fillText(dateShort, pt.x, height - padBottom + 16);
      }
    });
  }

  // --- RENDER FUNCTIES VOOR DE INTERFACE ---
  function renderDaysSelector() {
    const daysContainer = document.getElementById('daysScroll');
    if (!daysContainer) return;

    // Filter dagen op basis van actieve week (Week 1 = -1, Week 2 = -2)
    const suffix = currentWeek === '1' ? '-1' : '-2';
    const activeDays = window.HERRES_DATA.dagen.filter(d => d.id.endsWith(suffix));

    daysContainer.innerHTML = activeDays.map(day => {
      const isActive = day.id === currentDayId;
      const shortName = day.id.split('-')[0]; // bv. MA, DI
      return `
        <div class="day-pill ${isActive ? 'active' : ''}" data-day="${day.id}">
          <span class="day-code">${shortName}</span>
          <span class="day-sub">Week ${currentWeek === '1' ? 'A' : 'B'}</span>
        </div>
      `;
    }).join('');

    // Event listeners
    daysContainer.querySelectorAll('.day-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        currentDayId = pill.dataset.day;
        saveSettings();
        renderApp();
      });
    });

    // Update dag titel header
    const currentDayObj = window.HERRES_DATA.dagen.find(d => d.id === currentDayId);
    const dayTitle = document.getElementById('selectedDayTitle');
    const dayFocus = document.getElementById('selectedDayFocus');
    if (dayTitle && currentDayObj) dayTitle.textContent = currentDayObj.label;
    if (dayFocus && currentDayObj) dayFocus.textContent = `Focus: ${currentDayObj.focus}`;
  }

  function renderExercisesList() {
    const listContainer = document.getElementById('exerciseList');
    if (!listContainer) return;

    const exercises = window.HERRES_DATA.schema.filter(ex => ex.dag === currentDayId);

    if (exercises.length === 0) {
      listContainer.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 30px;">Geen oefeningen gevonden voor deze dag.</div>';
      return;
    }

    listContainer.innerHTML = exercises.map((ex, index) => {
      const latest = getLatestLog(ex.id);
      const pr = getPersonalRecord(ex.id);

      let logBadge = `<span class="badge badge-empty">Nog geen log</span>`;
      if (latest) {
        logBadge = `<span class="badge badge-log">Laatst: ${latest.weight} kg (${latest.reps}x)</span>`;
      }

      const userPhoto = (typeof photosData[ex.id] === 'string') ? photosData[ex.id] : null;
      const imgSrc = userPhoto || (ex.foto ? encodeURI(ex.foto) : null);

      const thumbHtml = imgSrc 
        ? `<div class="ex-thumb"><img src="${imgSrc}" alt="${ex.oefening}" loading="lazy"></div>`
        : `<div class="ex-thumb"><div class="ex-thumb-fallback">#${index + 1}</div></div>`;

      return `
        <div class="exercise-card" data-id="${ex.id}">
          ${thumbHtml}
          <div class="ex-info">
            <div class="ex-title-row">
              <span class="ex-num">#${index + 1}</span>
              <h3 class="ex-name">${ex.oefening}</h3>
            </div>
            <div class="ex-tags">
              <span class="badge badge-reps">${ex.sets} sets × ${ex.reps}</span>
              <span class="badge badge-target">${ex.doelwit}</span>
              ${logBadge}
              ${pr !== null ? `<span class="badge" style="background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.4);">PR: ${pr} kg</span>` : ''}
            </div>
          </div>
          <div class="ex-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      `;
    }).join('');

    // Klik event per kaart
    listContainer.querySelectorAll('.exercise-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const ex = window.HERRES_DATA.schema.find(item => item.id === id);
        if (ex) openExerciseModal(ex);
      });
    });
  }

  // --- MODAL: OEFENING DETAIL, FOTO'S, LOGGEN & GRAFIEK ---
  function openExerciseModal(exercise) {
    activeExercise = exercise;
    const modal = document.getElementById('exerciseModal');
    if (!modal) return;

    // Titels & Doelwit
    document.getElementById('modalExerciseName').textContent = exercise.oefening;
    document.getElementById('modalExerciseMeta').textContent = `${exercise.sets} sets × ${exercise.reps} herhalingen • ${exercise.doelwit}`;

    // Korte beschrijving (max 1 regel)
    const tipText = document.getElementById('modalTipText');
    tipText.textContent = exercise.beschrijving_kort || 'Geen specifieke tips opgegeven.';

    // Oefeningsfoto tonen
    updateExercisePhotoDisplay(exercise);

    // Formulier instellen
    const dateInput = document.getElementById('logDate');
    const weightInput = document.getElementById('logWeight');
    const repsInput = document.getElementById('logReps');
    const notesInput = document.getElementById('logNotes');

    dateInput.value = getTodayString();
    
    // Automatisch vullen met vorig gelogd gewicht als handige suggestie
    const latest = getLatestLog(exercise.id);
    if (latest) {
      weightInput.value = latest.weight;
      repsInput.value = latest.reps || '';
    } else {
      weightInput.value = '';
      repsInput.value = '';
    }
    notesInput.value = '';

    // PR badge updaten
    const prVal = getPersonalRecord(exercise.id);
    const prBadge = document.getElementById('modalPrBadge');
    if (prBadge) {
      if (prVal !== null) {
        prBadge.textContent = `PR: ${prVal} kg`;
        prBadge.style.display = 'inline-block';
      } else {
        prBadge.style.display = 'none';
      }
    }

    // Grafiek en geschiedenislijst renderen
    updateModalChartAndHistory(exercise.id);

    // Toon modal met Android terugknop ondersteuning
    openModalWithHistory(modal);
  }

  function updateExercisePhotoDisplay(exercise) {
    const container = document.getElementById('exercisePhotoContainer');
    if (!container) return;

    // 1. Zelf geüploade foto (Base64 string)
    const userPhoto = (typeof photosData[exercise.id] === 'string') ? photosData[exercise.id] : null;
    // 2. Vaste foto in schema (zoals Barbell Bench Press.jpg)
    const defaultPhoto = exercise.foto;

    if (userPhoto) {
      container.innerHTML = `<img src="${userPhoto}" alt="${exercise.oefening}" />`;
    } else if (defaultPhoto) {
      container.innerHTML = `<img src="${encodeURI(defaultPhoto)}" alt="${exercise.oefening}" />`;
    } else {
      container.innerHTML = getIllustrationSvg(exercise.oefening, exercise.doelwit);
    }
  }

  function updateModalChartAndHistory(exerciseId) {
    const history = logsData[exerciseId] || [];
    const canvas = document.getElementById('progressChart');
    renderProgressChart(canvas, history);

    // Geschiedenis lijst vullen
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    if (history.length === 0) {
      historyList.innerHTML = '<div style="color: #64748b; font-size: 0.85rem; text-align: center; padding: 12px;">Nog geen trainingen gelogd voor deze oefening.</div>';
      return;
    }

    // Sorteer nieuwste bovenaan
    const sorted = [...history].reverse();
    historyList.innerHTML = sorted.map(item => `
      <div class="history-item">
        <div class="history-left">
          <span class="history-weight">${item.weight} kg <small style="font-weight: normal; color: #94a3b8;">(${item.reps || 0} reps)</small></span>
          <span class="history-meta">${formatDateNL(item.date)} ${item.notes ? '• ' + item.notes : ''}</span>
        </div>
        <button class="history-delete-btn" data-log-id="${item.id}" title="Verwijder log">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    `).join('');

    // Delete buttons
    historyList.querySelectorAll('.history-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const logId = btn.dataset.logId;
        if (confirm('Weet je zeker dat je deze trainingslog wilt wissen?')) {
          logsData[exerciseId] = logsData[exerciseId].filter(item => item.id !== logId);
          saveLogs();
          updateModalChartAndHistory(exerciseId);
          renderExercisesList();
          showToast('Log verwijderd');
        }
      });
    });
  }

  // --- UNIFIED MODAL & SAMSUNG/ANDROID BACK BUTTON MANAGER ---
  function openModalWithHistory(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Zet hash op #modal zodat Android/Chromium WebView native history direct 'canGoBack = true' registreert
    try {
      if (window.location.hash !== '#modal') {
        window.location.hash = 'modal';
      }
    } catch (e) {
      console.log('hash set fout:', e);
    }
  }

  function closeModalDirect(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('active');
    if (modalEl.id === 'exerciseModal') {
      activeExercise = null;
    }
    const anyActive = document.querySelector('.modal-overlay.active');
    if (!anyActive) {
      document.body.style.overflow = '';
    }
  }

  function closeModalWithHistory(modalEl) {
    if (!modalEl) return;
    closeModalDirect(modalEl);
    try {
      if (window.location.hash === '#modal') {
        history.back();
      }
    } catch (e) {
      window.location.hash = '';
    }
  }

  function closeModal() {
    const modal = document.getElementById('exerciseModal');
    closeModalWithHistory(modal);
  }

  // Direct aangeroepen door native Android Java (MainActivity) bij fysieke/swipe terugknop
  window.handleAndroidBack = function() {
    const activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal) {
      closeModalDirect(activeModal);
      if (window.location.hash === '#modal') {
        try {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (e) {
          window.location.hash = '';
        }
      }
      return 'handled';
    }
    return 'unhandled';
  };

  // --- FOTO UPLOAD HANDLER ---
  function setupPhotoUpload() {
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    const fileInput = document.getElementById('photoFileInput');

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => {
        fileInput.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !activeExercise) return;

        // Comprimeer/lees afbeelding naar Base64
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            // Schaal afbeelding terug om LocalStorage niet te overbelasten
            const canvas = document.createElement('canvas');
            const maxDimension = 900;
            let w = img.width;
            let h = img.height;
            if (w > h && w > maxDimension) {
              h = Math.round((h * maxDimension) / w);
              w = maxDimension;
            } else if (h > maxDimension) {
              w = Math.round((w * maxDimension) / h);
              h = maxDimension;
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

            photosData[activeExercise.id] = compressedBase64;
            savePhotos();
            updateExercisePhotoDisplay(activeExercise);
            showToast('Foto succesvol opgeslagen! 📸');
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        fileInput.value = ''; // Reset
      });
    }
  }

  // --- LOG FORMULIER HANDLER ---
  function setupLogForm() {
    const saveBtn = document.getElementById('saveLogBtn');
    const calBtn = document.getElementById('calendarPickBtn');
    const hiddenPicker = document.getElementById('logDateHiddenPicker');
    const dateInput = document.getElementById('logDate');

    if (calBtn && hiddenPicker && dateInput) {
      calBtn.addEventListener('click', () => {
        if (typeof hiddenPicker.showPicker === 'function') {
          hiddenPicker.showPicker();
        } else {
          hiddenPicker.click();
        }
      });
      hiddenPicker.addEventListener('change', () => {
        if (hiddenPicker.value) {
          dateInput.value = formatDateNL(hiddenPicker.value);
        }
      });
    }

    if (!saveBtn) return;

    saveBtn.addEventListener('click', () => {
      if (!activeExercise) return;

      const rawDate = document.getElementById('logDate').value.trim();
      const dateVal = formatDateNL(rawDate) || getTodayString();
      const weightVal = parseFloat(document.getElementById('logWeight').value);
      const repsVal = parseInt(document.getElementById('logReps').value, 10) || 0;
      const notesVal = document.getElementById('logNotes').value.trim();

      if (isNaN(weightVal) || weightVal <= 0) {
        alert('Vul een geldig gewicht in (bijv. 60 of 82.5 kg).');
        return;
      }

      if (!logsData[activeExercise.id]) {
        logsData[activeExercise.id] = [];
      }

      const newEntry = {
        id: 'log_' + Date.now(),
        date: dateVal,
        weight: weightVal,
        reps: repsVal,
        notes: notesVal
      };

      logsData[activeExercise.id].push(newEntry);
      saveLogs();

      // UI vernieuwen
      updateModalChartAndHistory(activeExercise.id);
      renderExercisesList();

      const pr = getPersonalRecord(activeExercise.id);
      if (pr === weightVal) {
        showToast('🔥 NIEUW PERSOONLIJK RECORD! ' + weightVal + ' kg');
      } else {
        showToast('Gewicht opgeslagen! 💪');
      }
    });
  }

  // --- PERIODISERING MODAL & WEEK SCHAKELAAR ---
  function setupPeriodization() {
    const weekBtns = document.querySelectorAll('.week-switch-btn');
    weekBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        weekBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentWeek = btn.dataset.week;
        // Zet standaard op de maandag van die week
        currentDayId = currentWeek === '1' ? 'MA-1' : 'MA-2';
        saveSettings();
        renderApp();
      });
    });

    const openPeriodBtn = document.getElementById('openPeriodBtn');
    const periodModal = document.getElementById('periodModal');
    const closePeriodBtn = document.getElementById('closePeriodBtn');

    if (openPeriodBtn && periodModal) {
      openPeriodBtn.addEventListener('click', () => {
        openModalWithHistory(periodModal);
      });
    }

    if (closePeriodBtn && periodModal) {
      closePeriodBtn.addEventListener('click', () => {
        closeModalWithHistory(periodModal);
      });
    }

    if (periodModal) {
      periodModal.addEventListener('click', (e) => {
        if (e.target === periodModal) closeModalWithHistory(periodModal);
      });
    }
  }

  // --- DATA BACKUP (EXPORT & IMPORT) ---
  function setupDataBackup() {
    const openDataBtn = document.getElementById('openDataBtn');
    const dataModal = document.getElementById('dataModal');
    const closeDataBtn = document.getElementById('closeDataBtn');
    const exportBtn = document.getElementById('exportDataBtn');
    const importInput = document.getElementById('importDataInput');
    const resetBtn = document.getElementById('resetDataBtn');

    if (openDataBtn && dataModal) {
      openDataBtn.addEventListener('click', () => {
        openModalWithHistory(dataModal);
      });
    }

    if (closeDataBtn && dataModal) {
      closeDataBtn.addEventListener('click', () => {
        closeModalWithHistory(dataModal);
      });
    }

    if (dataModal) {
      dataModal.addEventListener('click', (e) => {
        if (e.target === dataModal) closeModalWithHistory(dataModal);
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const fullBackup = {
          app: 'Mr. Herres Trainingsapp',
          exportDate: new Date().toISOString(),
          logs: logsData,
          photos: photosData
        };
        const jsonStr = JSON.stringify(fullBackup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = url;
        const fileDate = (getTodayString() || 'backup').replace(/\//g, '-');
        downloadAnchor.download = `mr-herres-backup-${fileDate}.json`;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('Backup gedownload! 📂');
      });
    }

    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            let raw = (event.target.result || '').trim();
            if (raw.startsWith('data:')) {
              const commaIdx = raw.indexOf(',');
              raw = decodeURIComponent(raw.substring(commaIdx + 1));
            } else if (raw.startsWith('%7B') || raw.startsWith('%7b')) {
              raw = decodeURIComponent(raw);
            }
            const parsed = JSON.parse(raw);
            if (parsed.logs && typeof parsed.logs === 'object') {
              logsData = parsed.logs;
              if (parsed.photos && typeof parsed.photos === 'object') photosData = parsed.photos;
            } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              logsData = parsed;
            }
            saveLogs();
            savePhotos();
            renderApp();
            showToast('Backup succesvol hersteld! ✅');
            closeModalWithHistory(dataModal);
          } catch (err) {
            console.error('Import parse error:', err);
            alert('Kon het bestand niet verwerken als geldige backup.');
          }
        };
        reader.readAsText(file);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Let op: hiermee wis je al je gelogde gewichten en eigen fotos op dit toestel. Weet je het zeker?')) {
          localStorage.removeItem(STORAGE_KEY_LOGS);
          localStorage.removeItem(STORAGE_KEY_PHOTOS);
          logsData = {};
          photosData = {};
          renderApp();
          showToast('Data gewist');
          closeModalWithHistory(dataModal);
        }
      });
    }
  }

  // --- SERVICE WORKER REGISTRATIE VOOR OFFLINE GYM GEBRUIK ---
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('Mr Herres ServiceWorker geregistreerd', reg))
          .catch(err => console.log('ServiceWorker registratie fout:', err));
      });
    }
  }

  // --- MAIN RENDER CYCLE ---
  function renderApp() {
    renderDaysSelector();
    renderExercisesList();
  }

  // --- NATIVE & BROWSER BACK BUTTON CONTROLLER ---
  function setupAndroidBackButtonListeners() {
    // 1. Hashchange listener (universeel in Android WebView, Samsung Internet, Chrome, Safari)
    window.addEventListener('hashchange', () => {
      if (!window.location.hash || window.location.hash === '#' || window.location.hash === '') {
        const activeModals = document.querySelectorAll('.modal-overlay.active');
        activeModals.forEach(m => closeModalDirect(m));
      }
    });

    // 2. Browser History Popstate
    window.addEventListener('popstate', () => {
      const activeModals = document.querySelectorAll('.modal-overlay.active');
      activeModals.forEach(m => closeModalDirect(m));
    });

    // 3. Cordova / Android hardware backbutton event
    document.addEventListener('backbutton', (e) => {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        if (e && e.preventDefault) e.preventDefault();
        closeModalWithHistory(activeModal);
      }
    });

    // 4. Capacitor Native App Plugin listener (voor standalone APK)
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
          const activeModal = document.querySelector('.modal-overlay.active');
          if (activeModal) {
            closeModalWithHistory(activeModal);
          } else if (canGoBack) {
            window.history.back();
          } else {
            window.Capacitor.Plugins.App.exitApp();
          }
        });
      }
    } catch (err) {
      console.log('Capacitor App listener:', err);
    }

    // Schoon eventuele oude hash op bij opstarten
    if (window.location.hash === '#modal') {
      try {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (e) {}
    }
  }

  // --- INITIALISATIE ---
  window.addEventListener('DOMContentLoaded', () => {
    loadStorage();

    // Sluitknoppen modal
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const modalOverlay = document.getElementById('exerciseModal');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
    }

    // Luister naar schermkanteling/resizes om de canvas grafiek scherp te houden
    window.addEventListener('resize', () => {
      if (activeExercise) {
        const canvas = document.getElementById('progressChart');
        const history = logsData[activeExercise.id] || [];
        renderProgressChart(canvas, history);
      }
    });

    setupPhotoUpload();
    setupLogForm();
    setupPeriodization();
    setupDataBackup();
    setupAndroidBackButtonListeners();
    registerServiceWorker();

    renderApp();
  });

})();
