// Self-contained for page.evaluate; these bounds belong only to modern-business draft-01.
export function measureModernBusiness() {
 const slide=document.querySelectorAll('#deck > .slide')[window.__currentSlideIndex||0];
 const origin=slide.getBoundingClientRect(), issues=[], texts=[];
 const walker=document.createTreeWalker(slide.querySelector('.canvas-card'),NodeFilter.SHOW_TEXT);
 let node;
 while((node=walker.nextNode())){
  if(!node.textContent.trim()||node.parentElement.closest('script,style'))continue;
  const range=document.createRange();range.selectNodeContents(node);
  for(const r of range.getClientRects()){
   const box={left:r.left-origin.left,top:r.top-origin.top,right:r.right-origin.left,bottom:r.bottom-origin.top};
   texts.push(box);
   if(box.left<origin.width*.05-1 || box.right>origin.width*.95+1 || box.top<origin.height*.05-1 || box.bottom>origin.height*.89+1)issues.push(`outside modern content zone: ${node.textContent.trim().slice(0,30)}`);
  }
 }
 const bodySizes=[...slide.querySelectorAll('.mb-body')].map(n=>parseFloat(getComputedStyle(n).fontSize));
 if(bodySizes.some(size=>size<20))issues.push('body smaller than 20px');
 for(const panel of slide.querySelectorAll('.mb-panel,.mb-cover-panel,.mb-closing-heading')){
  if(parseFloat(getComputedStyle(panel).borderTopLeftRadius)!==10)issues.push('candidate radius differs from 10px');
 }
 const title=slide.querySelector('h1'), titleStyle=getComputedStyle(title);
 if(Number(titleStyle.fontWeight)!==700)issues.push('title weight differs from 700');
 const elements=[...slide.querySelectorAll('h1,h2,p,img,figcaption,.mb-number,.mb-chrome>span,.mb-foot>span,.mb-principles>div,.mb-cover-row')];
 for(let i=0;i<elements.length;i++)for(let j=i+1;j<elements.length;j++){
  const a=elements[i],b=elements[j];if(a.contains(b)||b.contains(a))continue;
  const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();
  if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>2&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>2)issues.push(`overlap: ${a.textContent.slice(0,12)} / ${b.textContent.slice(0,12)}`);
 }
 const images=[...slide.querySelectorAll('img')].map(img=>{
  const css=getComputedStyle(img),r=img.getBoundingClientRect();
  if(!img.complete||!img.naturalWidth)issues.push('image not loaded');
  if(img.dataset.imageRole==='evidence'&&css.objectFit!=='contain')issues.push('evidence fit must be contain');
  if(r.left-origin.left<origin.width*.05-1||r.right-origin.left>origin.width*.95+1||r.bottom-origin.top>origin.height*.89+1)issues.push('image outside modern content zone');
  return {role:img.dataset.imageRole,fit:css.objectFit,width:img.naturalWidth,height:img.naturalHeight};
 });
 for(const control of document.querySelectorAll('#nav,#hint')){
  const r=control.getBoundingClientRect();if(!r.width||!r.height)continue;
  if(texts.some(t=>Math.min(t.right,r.right-origin.left)-Math.max(t.left,r.left-origin.left)>0&&Math.min(t.bottom,r.bottom-origin.top)-Math.max(t.top,r.top-origin.top)>0))issues.push(`text overlaps ${control.id}`);
 }
 if(slide.dataset.layout==='MB03'){
  const columns=getComputedStyle(slide.querySelector('.mb-modules')).gridTemplateColumns.split(/\s+/).length;
  if(columns!==2)issues.push('MB03 needs two columns');
 }
 return {slideId:slide.dataset.slideId,layout:slide.dataset.layout,bodySizes,titleSize:parseFloat(titleStyle.fontSize),maxTextBottom:Math.max(...texts.map(t=>t.bottom)),images,issues};
}
