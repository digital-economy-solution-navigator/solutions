/**
 * Modal management functionality
 */

/**
 * Initializes information accordion functionality
 * Sets up event listeners for expand/collapse actions
 */
function initializeInfoAccordion() {
  const accordionHeaders = document.querySelectorAll('.info-accordion-header');
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const content = document.getElementById(targetId);
      const accordionItem = this.closest('.info-accordion-item');
      
      // Toggle active class
      accordionItem.classList.toggle('active');
      
      // Close other accordion items (optional - remove if you want multiple open)
      accordionHeaders.forEach(otherHeader => {
        if (otherHeader !== this) {
          const otherItem = otherHeader.closest('.info-accordion-item');
          otherItem.classList.remove('active');
        }
      });
    });
  });
}

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
}




// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    initializeModal, 
    initializeQRCodeModal, 
    initializeDisclaimer
  };
}
