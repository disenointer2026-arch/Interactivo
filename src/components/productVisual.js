/* Ilustraciones HTML/CSS de los productos físicos con el retrato del avatar.
   type: 'figure' | 'plush' | 'keychain' */
export function productVisual (type, src = '') {
  const img = `<img class="portrait-mine pv-img" alt="" ${src ? `src="${src}"` : ''} />`
  if (type === 'plush') {
    return `<div class="pv pv--plush"><div class="pv-plush">${img}</div><span class="pv-label">Peluche 25 cm</span></div>`
  }
  if (type === 'keychain') {
    return `<div class="pv pv--key"><span class="pv-ring" aria-hidden="true"></span><div class="pv-acrylic">${img}</div></div>`
  }
  return `<div class="pv pv--box">
    <div class="pv-box">
      <div class="pv-box-top"><span class="pv-brand">MINISO</span><span class="pv-x">×</span><span class="pv-ac">Animal Crossing</span></div>
      <div class="pv-window">${img}<span class="pv-base" aria-hidden="true"></span></div>
      <div class="pv-box-foot">Figura coleccionable</div>
    </div>
  </div>`
}
