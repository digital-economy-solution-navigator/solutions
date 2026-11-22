/**
 * Modal management functionality
 */

/**
 * Initializes about section toggle functionality
 * Sets up event listener for expand/collapse action
 */
function initializeAboutToggle() {
  const aboutToggle = document.getElementById('aboutToggle');
  const aboutContent = document.getElementById('aboutContent');
  
  if (!aboutToggle || !aboutContent) {
    console.warn('About toggle elements not found');
    return;
  }
  
  aboutToggle.addEventListener('click', function() {
    // Toggle active class on button
    aboutToggle.classList.toggle('active');
    
    // Toggle expanded class on content
    aboutContent.classList.toggle('expanded');
  });
}

/**
 * Initializes QR code modal functionality
 * Sets up event listeners for show/hide/close actions
 */
function initializeQRCodeModal() {
  const modal = utils.el('qrCodeModal');
  const showBtn = utils.el('showQRCode');
  const closeBtn = utils.el('closeQRCode');

  if (!modal || !showBtn || !closeBtn) {
    console.warn('QR Code modal elements not found');
    return;
  }

  // Show modal
  showBtn.addEventListener('click', function() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  });

  // Close modal
  closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
  });

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
}

/**
 * Initializes disclaimer button functionality
 * Sets up event listeners for show/hide/close actions
 */
function initializeDisclaimer() {
  const disclaimerBtn = utils.el('disclaimerBtn');
  const disclaimerTooltip = utils.el('disclaimerTooltip');

  if (!disclaimerBtn || !disclaimerTooltip) {
    console.warn('Disclaimer elements not found');
    return;
  }

  // Show disclaimer on button click
  disclaimerBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    
    if (disclaimerTooltip.classList.contains('show')) {
      disclaimerTooltip.classList.remove('show');
    } else {
      // Position the tooltip above the button
      const btnRect = disclaimerBtn.getBoundingClientRect();
      const tooltipWidth = 400; // Fixed width from CSS
      const tooltipHeight = 100; // Approximate height
      const margin = 8;
      
      // Calculate position to center above the button
      const left = btnRect.left + (btnRect.width / 2) - (tooltipWidth / 2);
      const top = btnRect.top - tooltipHeight - margin;
      
      // Ensure tooltip doesn't go off screen
      const finalLeft = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));
      const finalTop = Math.max(10, top);
      
      disclaimerTooltip.style.left = finalLeft + 'px';
      disclaimerTooltip.style.top = finalTop + 'px';
      disclaimerTooltip.classList.add('show');
    }
  });

  // Hide disclaimer when clicking outside
  document.addEventListener('click', function(event) {
    if (!disclaimerBtn.contains(event.target) && !disclaimerTooltip.contains(event.target)) {
      disclaimerTooltip.classList.remove('show');
    }
  });

  // Hide disclaimer on escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && disclaimerTooltip.classList.contains('show')) {
      disclaimerTooltip.classList.remove('show');
    }
  });
}/**
 * Full disclaimer dialog: information, assessment and recognition.
 *
 * Opens from any element carrying [data-open-disclaimer]. Delegation is used
 * because the solution detail modal is created at runtime. The dialog is
 * deep-linkable through #disclaimer, closes with Escape or a backdrop click,
 * traps Tab focus while open, and restores focus to the opener on close.
 * The map boundary disclaimer tooltip is left in place and unaffected.
 */
let fullDisclaimerOpener = null;

function anyOtherModalOpen() {
  return ['qrCodeModal'].some(function (id) {
    const other = utils.el(id);
    return other && other.style.display === 'block';
  });
}

function closeFullDisclaimer() {
  const modal = utils.el('fullDisclaimerModal');
  if (!modal || modal.style.display !== 'block') return;

  modal.style.display = 'none';
  document.body.style.overflow = anyOtherModalOpen() ? 'hidden' : 'auto';

  if (location.hash === '#disclaimer') {
    history.replaceState(null, '', location.pathname + location.search);
  }
  if (fullDisclaimerOpener && typeof fullDisclaimerOpener.focus === 'function') {
    fullDisclaimerOpener.focus();
  }
  fullDisclaimerOpener = null;
}

function openFullDisclaimer(opener) {
  const modal = utils.el('fullDisclaimerModal');
  if (!modal) return;

  if (modal.style.display !== 'block') {
    fullDisclaimerOpener = opener || document.activeElement;
  }

  // The map tooltip sits at a higher z-index; hide it before opening.
  const tooltip = utils.el('disclaimerTooltip');
  if (tooltip) tooltip.classList.remove('show');

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';

  const closeBtn = utils.el('closeFullDisclaimer');
  if (closeBtn) closeBtn.focus();

  if (location.hash !== '#disclaimer') {
    history.pushState(null, '', location.pathname + location.search + '#disclaimer');
  }
}

function initializeFullDisclaimer() {
  const modal = utils.el('fullDisclaimerModal');
  if (!modal) {
    console.warn('Full disclaimer modal not found');
    return;
  }

  document.addEventListener('click', function (event) {
    const trigger = event.target && event.target.closest
      ? event.target.closest('[data-open-disclaimer]')
      : null;
    if (trigger) {
      event.preventDefault();
      openFullDisclaimer(trigger);
      return;
    }
    if (event.target === modal) closeFullDisclaimer();
  });

  const closeBtn = utils.el('closeFullDisclaimer');
  if (closeBtn) closeBtn.addEventListener('click', closeFullDisclaimer);

  // Capture phase: the explanation, QR and map-tooltip dialogs each own an
  // Escape listener on document. When this dialog sits above one of them,
  // Escape must close only this dialog, not the one behind it.
  document.addEventListener('keydown', function (event) {
    if (modal.style.display !== 'block') return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeFullDisclaimer();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusables = Array.from(modal.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) { return el.offsetParent !== null; });
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, true);

  window.addEventListener('hashchange', function () {
    if (location.hash === '#disclaimer') {
      openFullDisclaimer(null);
    } else if (modal.style.display === 'block') {
      closeFullDisclaimer();
    }
  });

  // Direct link, e.g. .../solutions/#disclaimer
  if (location.hash === '#disclaimer') openFullDisclaimer(null);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeQRCodeModal,
    initializeDisclaimer,
    initializeFullDisclaimer
  };
}
