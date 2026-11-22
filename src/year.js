/**
 * Call-year switching for the public dashboard.
 *
 * Both calls stay available. The public dataset for each year is a separate
 * JSON file; switching years reloads the data through the same normaliser and
 * renderer. Award data is independent and is only shown for a year that has a
 * confirmed award file. Internal evaluation fields and personal data never
 * enter these paths.
 */

const YEAR_DATASETS = {
  '2025': {
    label: '2025 Global Call',
    data: 'data/data.json',
    awards: 'data/awards_2025.json'
  },
  '2026': {
    label: '2026 Global Call',
    data: 'data/data_2026.json',
    awards: null
  }
};

const YearSwitch = {
  current: '2026',

  init() {
    const requested = new URLSearchParams(location.search).get('year');
    if (YEAR_DATASETS[requested]) this.current = requested;

    document.querySelectorAll('[data-year-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const year = btn.getAttribute('data-year-toggle');
        if (year === YearSwitch.current) return;
        if (typeof window.switchDashboardYear === 'function') {
          window.switchDashboardYear(year);
        }
      });
    });

    this.paint();
  },

  paint() {
    document.querySelectorAll('[data-year-toggle]').forEach(function (btn) {
      const active = btn.getAttribute('data-year-toggle') === YearSwitch.current;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    document.querySelectorAll('[data-year-label]').forEach(function (el) {
      el.textContent = YearSwitch.current;
    });

    const subtitle = document.getElementById('callSubtitle');
    if (subtitle) subtitle.textContent = YEAR_DATASETS[YearSwitch.current].label;

    const note = document.getElementById('awardYearLabel');
    if (note) note.textContent = YearSwitch.current;
  }
};
