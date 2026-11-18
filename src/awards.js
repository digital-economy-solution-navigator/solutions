/**
 * Award wall for the 2025 Global Call.
 *
 * Reads its own file, independent of the scoring dataset. The number of award
 * categories and slots is defined entirely by that file; nothing is assumed
 * about the 2025 selection until names are supplied. No score, rank, star
 * rating or evidence tier is read here.
 */

function awardEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function awardCard(slot, published) {
  const named = published && slot.organisation && slot.title;
  const organisation = named
    ? awardEscape(slot.organisation)
    : '<span class="award-pending">To be confirmed</span>';
  const place = named
    ? awardEscape([slot.country, slot.region].filter(Boolean).join(' · '))
    : '';
  const citation = named && slot.citation
    ? awardEscape(slot.citation)
    : 'Description to be published with the awardees.';
  const badge = slot.class
    ? `<span class="award-badge">${awardEscape(slot.class)}</span>`
    : '';

  return `
    <article class="award-card${named ? '' : ' award-card-empty'}">
      ${badge}
      <h4 class="award-org">${organisation}</h4>
      ${named ? `<p class="award-title">${awardEscape(slot.title)}</p>` : ''}
      ${place ? `<p class="award-place">${place}</p>` : ''}
      <p class="award-citation">${citation}</p>
    </article>`;
}

async function renderAwardWall() {
  const root = document.getElementById('awardWall');
  const body = document.getElementById('awardWallBody');
  const count = document.getElementById('awardWallCount');
  if (!root || !body) return;

  let payload;
  try {
    const path = (typeof CONFIG !== 'undefined' && CONFIG.DATA_SOURCES && CONFIG.DATA_SOURCES.AWARDS_DATA)
      || 'data/awards_2025.json';
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    payload = await response.json();
  } catch (error) {
    console.warn('Award wall: data not available, section stays hidden.', error.message);
    return;
  }

  const groups = Array.isArray(payload.groups) ? payload.groups : [];
  const published = payload.published === true;
  const slots = groups.reduce((n, group) => n + ((group.slots || []).length), 0);

  if (count) {
    count.textContent = published && slots
      ? `${slots} awards · ${groups.length} categories`
      : 'Selection pending';
  }

  let status = '';
  if (!published) {
    status = `<div class="award-status">Award categories and names for the 2025
      Global Call will appear here once the selection is confirmed. No awardee is
      shown before confirmation.${groups.length ? ' The categories below are a layout preview.' : ''}</div>`;
  } else if (!slots) {
    status = '<div class="award-status">No awardees have been entered yet.</div>';
  }

  const groupHtml = groups.map(group => `
    <div class="award-group">
      <div class="award-group-head">
        <span class="award-group-dot" aria-hidden="true"></span>
        <h3>${awardEscape(group.name)}</h3>
      </div>
      <div class="award-grid">
        ${(group.slots || []).map(slot => awardCard(slot, published)).join('')}
      </div>
    </div>`).join('');

  const methodology = payload.methodology
    ? `<p class="award-methodology"><strong>About the awards.</strong> ${awardEscape(payload.methodology)}</p>`
    : '';

  // Recognition is tied to the submitted solution, not to the wider body of
  // work of the organisation. The historical awards themselves are unchanged.
  const scope = '<p class="award-scope-note">Recognition shown above relates to the submitted solution within the scope of the 2025 Global Call. It is not an endorsement of an organization’s wider activities. <a href="#disclaimer" class="disclaimer-link" data-open-disclaimer>Read the full disclaimer.</a></p>';

  body.innerHTML = `${status}${groupHtml}${methodology}${scope}`;
  root.hidden = false;
}
