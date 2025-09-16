/**
 * Modal management functionality
 */

/**
 * Initializes modal functionality for explanation dialog
 * Sets up event listeners for show/hide/close actions
 */
function initializeModal() {
  const modal = utils.el('explanationModal');
  const showBtn = utils.el('showExplanation');
  const closeBtn = utils.el('closeExplanation');

  if (!modal || !showBtn || !closeBtn) {
    console.warn('Modal elements not found');
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
    disclaimerTooltip.classList.toggle('show');
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
}

// Landscape mode suggestion functionality
function showLandscapeSuggestion() {
  const banner = document.getElementById('landscapeSuggestion');
  if (banner && !localStorage.getItem('landscapeSuggestionDismissed')) {
    banner.classList.add('show');
    document.body.classList.add('landscape-banner-shown');
  }
}

function hideLandscapeSuggestion() {
  const banner = document.getElementById('landscapeSuggestion');
  if (banner) {
    banner.classList.remove('show');
    document.body.classList.remove('landscape-banner-shown');
    localStorage.setItem('landscapeSuggestionDismissed', 'true');
  }
}

// Check if device is in portrait mode on mobile
function checkOrientation() {
  const isMobile = window.innerWidth <= 768;
  const isPortrait = window.innerHeight > window.innerWidth;
  
  if (isMobile && isPortrait) {
    // Show suggestion after a short delay to avoid being too aggressive
    setTimeout(showLandscapeSuggestion, 2000);
  } else {
    // Hide suggestion if in landscape
    const banner = document.getElementById('landscapeSuggestion');
    if (banner) {
      banner.classList.remove('show');
      document.body.classList.remove('landscape-banner-shown');
    }
  }
}

// Listen for orientation changes
window.addEventListener('orientationchange', () => {
  // Small delay to allow orientation change to complete
  setTimeout(checkOrientation, 100);
});

// Listen for window resize (handles both orientation and window resize)
window.addEventListener('resize', checkOrientation);

// Check orientation on page load
document.addEventListener('DOMContentLoaded', checkOrientation);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    initializeModal, 
    initializeQRCodeModal, 
    initializeDisclaimer,
    showLandscapeSuggestion,
    hideLandscapeSuggestion,
    checkOrientation
  };
}
