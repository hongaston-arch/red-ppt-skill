// Structural validation only. Rendered bounds and readability require browser QA.
export const modernLayouts = Object.freeze({ MB01:['mb-cover-row',3], MB02:['mb-principle',3], MB03:['mb-module',4], MB04:['mb-evidence',1], MB05:['mb-step',5], MB06:['mb-takeaway',3] });
export function inspectModernBusiness(html) {
  const errors=[], source=html.replace(/<!--[\s\S]*?-->/g,'');
  const attr=(tag,name)=>tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`,'i'))?.[2];
  const classes=tag=>(attr(tag,'class')||'').split(/\s+/);
  const count=(body,cls)=>[...body.matchAll(/<[a-z][^>]*>/gi)].filter(([tag])=>classes(tag).includes(cls)).length;
  const sections=[...source.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/gi)].filter(m=>classes(m[1]).includes('slide'));
  if(!sections.length) errors.push('No authored modern-business slides');
  for(const [,tag,body] of sections){
    const layout=attr(tag,'data-layout'), id=attr(tag,'data-slide-id')||'(no ID)', rule=modernLayouts[layout];
    if(!rule){errors.push(`${id}: unknown modern-business layout ${layout}`);continue;}
    for(const cls of ['canvas-card','mb-chrome','mb-main','mb-foot']) if(count(body,cls)!==1)errors.push(`${id}: require one ${cls}`);
    if((body.match(/<h1\b/gi)||[]).length!==1)errors.push(`${id}: require one h1`);
    if(count(body,rule[0])!==rule[1])errors.push(`${id}: ${layout} requires ${rule[1]} ${rule[0]}`);
    const required={MB01:['mb-cover','mb-cover-copy','mb-cover-panel'],MB02:['mb-statement-detail','mb-principles'],MB03:['mb-modules'],MB04:['mb-evidence'],MB05:['mb-steps'],MB06:['mb-closing','mb-closing-heading','mb-takeaways']}[layout];
    for(const cls of required)if(count(body,cls)!==1)errors.push(`${id}: require one ${cls}`);
    if(layout==='MB02' && !/<div\b[^>]*class=["'][^"']*mb-statement-detail/.test(body))errors.push(`${id}: missing statement detail`);
    if(layout==='MB04' && (body.match(/<img\b/gi)||[]).length!==1)errors.push(`${id}: MB04 requires one image`);
    for(const [img] of body.matchAll(/<img\b[^>]*>/gi)){
      const role=attr(img,'data-image-role');
      if(!['evidence','photo','illustration'].includes(role))errors.push(`${id}: image requires evidence/photo/illustration role`);
      if(!attr(img,'src') || !attr(img,'alt'))errors.push(`${id}: image requires src and informative alt`);
      if(role==='evidence' && /object-fit\s*:\s*cover/i.test(attr(img,'style')||''))errors.push(`${id}: evidence cannot cover`);
    }
  }
  return { slides:sections.length, errors };
}
