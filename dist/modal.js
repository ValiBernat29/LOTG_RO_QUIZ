// Native modal dialogs keep keyboard focus inside and make the page behind inert.
export function showConfirmation({title, text, confirmLabel, onConfirm, onClose}, doc = document) {
  const dialog = doc.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-labelledby', 'modal-title');
  dialog.setAttribute('aria-describedby', 'modal-description');
  dialog.innerHTML = `<button class="modal-close" type="button" aria-label="Închide fereastra">×</button>
    <h2 id="modal-title"></h2><p id="modal-description"></p>
    <div class="modal-actions"><button class="secondary" type="button" data-modal="cancel" autofocus>Anulează</button>
    <button class="primary" type="button" data-modal="accept"></button></div>`;
  dialog.querySelector('#modal-title').textContent = title;
  dialog.querySelector('#modal-description').textContent = text;
  dialog.querySelector('[data-modal="accept"]').textContent = confirmLabel;
  dialog.querySelector('[data-modal="accept"]').onclick = () => dialog.close('confirm');
  return mountDialog(dialog, {onConfirm, onClose}, doc);
}

// html must be constructed from escaped values by the caller.
export function showInformation({title, html, onClose}, doc = document) {
  const dialog = doc.createElement('dialog');
  dialog.className = 'modal law-modal';
  dialog.setAttribute('aria-labelledby', 'modal-title');
  dialog.innerHTML = `<button class="modal-close" type="button" aria-label="Închide explicația">×</button>
    <h2 id="modal-title"></h2><div class="modal-body" aria-live="polite"></div>
    <div class="modal-actions"><button class="secondary" type="button" data-modal="cancel" autofocus>Închide</button></div>`;
  dialog.querySelector('#modal-title').textContent = title;
  dialog.querySelector('.modal-body').innerHTML = html;
  return mountDialog(dialog, {onClose}, doc);
}

function mountDialog(dialog, {onConfirm, onClose}, doc) {
  const before = doc.activeElement;
  dialog.querySelector('.modal-close').onclick = () => dialog.close();
  dialog.querySelector('[data-modal="cancel"]').onclick = () => dialog.close();
  dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
  // Only dismiss a gesture that starts and ends on the backdrop, not a drag
  // from inside the dialog or a click on its padding.
  const outside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom);
  };
  let backdropPress = false;
  dialog.addEventListener('pointerdown', event => { backdropPress = outside(event); });
  dialog.addEventListener('click', event => {
    if (backdropPress && outside(event)) dialog.close();
    backdropPress = false;
  });
  dialog.addEventListener('close', () => {
    const accepted = dialog.returnValue === 'confirm';
    dialog.remove();
    onClose?.();
    if (before?.isConnected) before.focus({preventScroll:true});
    if (accepted) onConfirm?.();
  }, {once:true});
  doc.body.append(dialog);
  dialog.showModal();
  dialog.querySelector('[data-modal="cancel"]').focus();
  return dialog;
}
