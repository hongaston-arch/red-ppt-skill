// Browser-evaluable: keep this function self-contained so QA and the validator use the same measurements.
export function measureSwissSafety({ index = 0 } = {}) {
  const slide = document.querySelectorAll('#deck > .slide')[index];
  if (!slide) throw new Error(`Missing slide ${index + 1}`);
  const origin = slide.getBoundingClientRect(), issues = [], boxes = [];
  const visible = node => {
    for (let p = node; p && p !== slide.parentElement; p = p.parentElement) {
      const css = getComputedStyle(p);
      if (css.display === 'none' || css.visibility === 'hidden' || Number(css.opacity) === 0) return false;
    }
    return true;
  };
  const add = (rect, label) => {
    if (!rect.width || !rect.height) return;
    const r = { left: rect.left-origin.left, top: rect.top-origin.top, right: rect.right-origin.left, bottom: rect.bottom-origin.top, label };
    boxes.push(r);
    if (r.left < -1 || r.right > origin.width+1 || r.top < -1 || r.bottom > origin.height+1) issues.push(`outside slide: ${label}`);
  };
  const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.textContent.trim() || node.parentElement.closest('script,style,canvas') || !visible(node.parentElement)) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    for (const rect of range.getClientRects()) add(rect, node.textContent.trim().slice(0,40));
  }
  for (const media of slide.querySelectorAll('img,svg,canvas:not(.ascii-bg),hr,.matrix-cell,.row-fill,.bar-tower,.bar-vert,.sub-card,.kpi-cell')) {
    if (!visible(media) || media.closest('.dot-mat,.ring-mat,.cross-mat,.ascii-bg')) continue;
    add(media.getBoundingClientRect(), `${media.tagName.toLowerCase()}.${media.className?.baseVal ?? media.className ?? ''}`);
  }
  const contentBottom = Math.max(0,...boxes.map(r=>r.bottom)), safeBottom = origin.height*.93;
  const nav = document.querySelector('#nav'), navRect = nav?.getBoundingClientRect();
  const navVisible = !!nav && visible(nav) && navRect.width>0 && navRect.height>0;
  const navGap = navVisible ? navRect.top-origin.top-contentBottom : null;
  if (contentBottom > safeBottom+.01) issues.push(`93vh exceeded: ${contentBottom.toFixed(2)}px > ${safeBottom.toFixed(2)}px`);
  if (!navVisible) issues.push('navigation is missing or hidden; cannot verify clearance');
  else if (navGap < 16-.01) issues.push(`navigation clearance: ${navGap.toFixed(2)}px < 16px`);
  return { index, id: slide.dataset.slideId || '', layout: slide.dataset.layout || '', width: origin.width, height: origin.height,
    contentBottom, safeBottom, navGap, boxes: boxes.length, issues };
}

// CSS object-fit geometry for the image element's content box. Inputs/outputs use image pixels and CSS pixels.
export function fitImage({ width, height, naturalWidth, naturalHeight, fit, positionX = .5, positionY = .5, subject }) {
  if (![width,height,naturalWidth,naturalHeight].every(n=>Number.isFinite(n)&&n>0)) throw new Error('Image dimensions must be positive.');
  if (!['contain','cover'].includes(fit)) throw new Error(`Unsupported image fit: ${fit}`);
  const scale = Math[fit==='contain'?'min':'max'](width/naturalWidth,height/naturalHeight);
  const renderedWidth=naturalWidth*scale, renderedHeight=naturalHeight*scale;
  const left=(width-renderedWidth)*positionX, top=(height-renderedHeight)*positionY;
  const visible = { left:Math.max(0,-left/scale),top:Math.max(0,-top/scale),right:Math.min(naturalWidth,(width-left)/scale),bottom:Math.min(naturalHeight,(height-top)/scale) };
  const fullImage = visible.left<.5 && visible.top<.5 && visible.right>naturalWidth-.5 && visible.bottom>naturalHeight-.5;
  let subjectVisible = null;
  if (subject) {
    if (subject.length!==4 || subject.some(n=>!Number.isFinite(n)||n<0||n>1) || subject[2]<=0 || subject[3]<=0 || subject[0]+subject[2]>1 || subject[1]+subject[3]>1) throw new Error('Subject must be a normalized x/y/width/height box.');
    const [x,y,w,h]=subject;
    subjectVisible = x*naturalWidth>=visible.left-.5 && y*naturalHeight>=visible.top-.5 && (x+w)*naturalWidth<=visible.right+.5 && (y+h)*naturalHeight<=visible.bottom+.5;
  }
  return { scale, left, top, renderedWidth, renderedHeight, visible, fullImage, subjectVisible };
}
