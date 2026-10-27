const all=(selector,root=document)=>[...root.querySelectorAll(selector)];
const motion=matchMedia('(prefers-reduced-motion: reduce)');
// Native scrolling stays untouched. Each element appears only once.
const reveals=all('.reveal');
let observer;
if('IntersectionObserver' in window&&!motion.matches){
  observer=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.remove('is-pending');observer.unobserve(target);}}),{threshold:0,rootMargin:'0px 0px -24px 0px'});
  reveals.forEach(el=>{if(el.getBoundingClientRect().top>=innerHeight){el.classList.add('is-pending');observer.observe(el);}});
}
motion.addEventListener('change',()=>{if(motion.matches){reveals.forEach(el=>el.classList.remove('is-pending'));observer?.disconnect();}});

const menu=document.querySelector('#mobile-menu'),toggle=document.querySelector('.menu-toggle');
function closeMenu(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';menu.hidden=open;toggle.setAttribute('aria-expanded',String(!open));toggle.setAttribute('aria-label',open?'Открыть меню':'Закрыть меню');});
menu.addEventListener('click',e=>{if(e.target.closest('a,button'))closeMenu();});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();toggle.focus();}});
matchMedia('(min-width:1200px)').addEventListener('change',closeMenu);

// One shared carousel controller: native touch/swipe, keyboard, buttons and dots.
function createCarousel(id,cardSelector){
  const rail=document.getElementById(id),cards=all(cardSelector,rail),pagination=document.querySelector(`[data-pagination="${id}"]`);
  const prev=id==='tour-rail'?document.querySelector('#tour-prev'):null,next=id==='tour-rail'?document.querySelector('#tour-next'):null;
  let active=0,queued=false;
  const dots=cards.map((_,index)=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',`${id==='tour-rail'?'Тур':'Направление'} ${index+1} из ${cards.length}`);button.addEventListener('click',()=>go(index));pagination.append(button);return button;});
  function update(){
    const start=rail.getBoundingClientRect().left+parseFloat(getComputedStyle(rail).paddingLeft);
    const distances=cards.map(card=>Math.abs(card.getBoundingClientRect().left-start));active=distances.indexOf(Math.min(...distances));
    const end=rail.scrollWidth-rail.clientWidth;
    if(end>0&&rail.scrollLeft>=end-2)active=cards.length-1;
    dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===active)));
    if(prev){prev.disabled=rail.scrollLeft<=2;next.disabled=rail.scrollLeft>=end-2;document.querySelector('#carousel-status').textContent=`Тур ${active+1} из ${cards.length}`;}
    queued=false;
  }
  function go(index){const target=cards[Math.max(0,Math.min(index,cards.length-1))];const left=rail.scrollLeft+target.getBoundingClientRect().left-rail.getBoundingClientRect().left-parseFloat(getComputedStyle(rail).paddingLeft);rail.scrollTo({left,behavior:motion.matches?'instant':'smooth'});}
  prev?.addEventListener('click',()=>go(active-1));next?.addEventListener('click',()=>go(active+1));
  rail.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});
  rail.addEventListener('keydown',e=>{if(e.target!==rail)return;let index;if(e.key==='ArrowRight')index=active+1;if(e.key==='ArrowLeft')index=active-1;if(e.key==='Home')index=0;if(e.key==='End')index=cards.length-1;if(index!==undefined){e.preventDefault();go(index);}});
  new ResizeObserver(update).observe(rail);update();
}
createCarousel('destination-rail','.destination-card');createCarousel('tour-rail','.tour-card');

const dialog=document.querySelector('#detail-dialog'),dialogTitle=document.querySelector('#dialog-title'),dialogText=document.querySelector('#dialog-text');let focusBefore;
function show(title,text){focusBefore=document.activeElement;dialogTitle.textContent=title;dialogText.textContent=text;dialog.showModal();}
all('[data-section]').forEach(button=>button.addEventListener('click',()=>{const section=button.dataset.section;show(section,['Контакты','WhatsApp','Telegram'].includes(section)?'В макете указан демонстрационный номер +7 (123) 456-78-90. Для связи нужны рабочие контакты компании.':`В макете V2 отдельная страница «${section}» не представлена.`);}));
all('[data-city]').forEach(button=>button.addEventListener('click',()=>show(`${button.dataset.city} · ${button.textContent}`, 'Программы и условия для этого направления в макете V2 не представлены.')));
all('[data-tour]').forEach(button=>button.addEventListener('click',()=>show(button.querySelector('.tour-title').textContent,`${button.querySelector('.duration').textContent.trim()} · ${button.querySelector('.price').textContent}. Подробная программа в макете V2 не представлена.`)));
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>focusBefore?.focus({preventScroll:true}));
