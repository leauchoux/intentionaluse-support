// Progressive enhancement only: language links remain usable if this file fails.
// Search terms stay in the DOM and are never persisted or sent over the network.
(() => {
  const picker = document.querySelector('.language-picker');
  if (!picker) return;
  const fallback = picker.querySelector('.language-fallback');
  const trigger = picker.querySelector('button.language-trigger');
  const dialog = picker.querySelector('.language-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const search = dialog.querySelector('input');
  const rows = [...dialog.querySelectorAll('.language-list > li')];
  const empty = dialog.querySelector('.language-empty');
  const status = dialog.querySelector('.language-status');
  const normalize = value => value.normalize('NFKC').toLowerCase().trim();
  const filter = () => {
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    let count = 0;
    rows.forEach(row => {
      row.hidden = !terms.every(term => normalize(row.dataset.languageSearch).includes(term));
      if (!row.hidden) count++;
    });
    empty.hidden = count !== 0;
    status.textContent = terms.length === 0 ? '' : count === 0 ? empty.textContent
      : count === 1 && dialog.dataset.resultOne ? dialog.dataset.resultOne
      : dialog.dataset.resultsLabel.replace('{count}', String(count));
  };
  const reset = () => {
    search.value = '';
    filter();
    dialog.querySelector('.language-list').scrollTop = 0;
  };
  trigger.addEventListener('click', event => {
    if (dialog.open) return;
    reset();
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    // Keep the touch keyboard closed until a mobile visitor chooses Search.
    if (event.detail === 0 || window.matchMedia('(pointer: fine)').matches) search.focus();
  });
  dialog.querySelector('.language-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded', 'false');
    reset();
    // Safari does not always focus a button that was opened by a pointer.
    trigger.focus({ preventScroll: true });
  });
  const isOutside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  let beganOutside = false;
  dialog.addEventListener('pointerdown', event => { beganOutside = isOutside(event); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog && beganOutside && isOutside(event)) dialog.close();
    beganOutside = false;
  });
  search.addEventListener('input', filter);
  // Arrow keys complement normal Tab navigation; links retain native semantics.
  dialog.addEventListener('keydown', event => {
    if (event.isComposing) return;
    // Search inputs otherwise consume the first Escape just to clear their text.
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
      return;
    }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const choices = rows.filter(row => !row.hidden).map(row => row.querySelector('a'));
    if (!choices.length || (event.target !== search && !choices.includes(event.target))) return;
    event.preventDefault();
    const index = choices.indexOf(event.target);
    const next = index < 0 ? (event.key === 'ArrowDown' ? 0 : choices.length - 1)
      : (index + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length;
    choices[next].focus();
  });
  // Reveal the enhanced trigger only after all interactions are connected.
  fallback.hidden = true;
  trigger.hidden = false;
})();
