function getElement<T extends HTMLElement>(id:string):T{const element=document.getElementById(id);if(!element)throw new Error('Missing homepage element: '+id);return element as T;}
function icon(name:string):string{return '<svg class="icon" aria-hidden="true"><use href="#'+name+'"/></svg>';}
const video=getElement<HTMLVideoElement>('hero-film');
const playbackButton=getElement<HTMLButtonElement>('toggle-video');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function updatePlayback():void {
  playbackButton.setAttribute('aria-label',video.paused?'Play background video':'Pause background video');
  playbackButton.setAttribute('aria-pressed',String(video.paused));
  playbackButton.innerHTML=icon(video.paused?'play':'pause');
}
video.addEventListener('play',updatePlayback);video.addEventListener('pause',updatePlayback);
video.addEventListener('error',()=>{video.removeAttribute('autoplay');updatePlayback();playbackButton.disabled=true;playbackButton.setAttribute('aria-label','Background video unavailable');});
playbackButton.addEventListener('click',()=>{if(video.paused)void video.play().catch(updatePlayback);else video.pause();});
if(reducedMotion.matches){video.autoplay=false;video.pause();}else{video.autoplay=true;void video.play().catch(updatePlayback);}
reducedMotion.addEventListener('change',event=>{if(event.matches)video.pause();});
updatePlayback();

function setupCommunityCarousel():void {
  const carousel=getElement('community-carousel');
  const viewport=getElement('community-viewport');
  const track=getElement('community-track');
  const slides=Array.from(track.children) as HTMLElement[];
  const count=slides.length;
  // The duplicate set follows the original at exactly one loop's distance.
  function duplicate(slide:HTMLElement):HTMLElement {
    const copy=slide.cloneNode(true) as HTMLElement;
    copy.setAttribute('aria-hidden','true');copy.inert=true;
    return copy;
  }
  track.append(...slides.map(duplicate));
  let animation:Animation|undefined,hovered=false,focused=false,inView=false;
  function updatePlayback():void {
    if(!animation)return;
    if(reducedMotion.matches){animation.pause();animation.currentTime=0;return;}
    if(hovered||focused||!inView||document.hidden)animation.pause();
    else animation.play();
  }
  function measure():void {
    const oldDuration=Number(animation?.effect?.getTiming().duration)||1;
    const phase=(Number(animation?.currentTime)||0)%oldDuration/oldDuration;
    animation?.cancel();
    const distance=(slides[0].getBoundingClientRect().width+24)*count;
    const duration=distance/42*1000;
    animation=track.animate([{transform:'translate3d(0,0,0)'},{transform:`translate3d(${-distance}px,0,0)`}],{duration,iterations:Infinity,easing:'linear'});
    animation.currentTime=phase*duration;updatePlayback();
  }
  carousel.addEventListener('pointerenter',()=>{hovered=true;updatePlayback();});
  carousel.addEventListener('pointerleave',()=>{hovered=false;updatePlayback();});
  carousel.addEventListener('focusin',()=>{focused=true;updatePlayback();});
  carousel.addEventListener('focusout',event=>{if(!carousel.contains(event.relatedTarget as Node|null)){focused=false;updatePlayback();}});
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;updatePlayback();},{threshold:.25}).observe(carousel);
  document.addEventListener('visibilitychange',updatePlayback);
  reducedMotion.addEventListener('change',measure);
  new ResizeObserver(measure).observe(viewport);
  measure();
}
setupCommunityCarousel();

function setupHarvestGallery():void {
  const gallery=getElement('harvest-gallery');
  const stage=gallery.querySelector<HTMLElement>('.harvest-stage')!;
  const tiles=Array.from(gallery.querySelectorAll<HTMLElement>('[data-gallery-tile]'));
  const copy=gallery.querySelector<HTMLElement>('.gallery-copy')!;
  const next=gallery.querySelector<HTMLElement>('.gallery-next')!;
  const storyIntro=document.querySelector<HTMLElement>('.home-intro')!;
  const incoming=getElement('homepage-stories').parentElement!;
  const poses=[{x:-180,y:145,rotation:-9},{x:180,y:160,rotation:8},{x:-150,y:155,rotation:6},{x:0,y:210,rotation:-2},{x:170,y:150,rotation:-7}];
  let scheduled=false;
  const clamp=(value:number)=>Math.min(1,Math.max(0,value));
  function smooth(start:number,end:number,value:number):number {
    const progress=clamp((value-start)/(end-start));return progress*progress*(3-2*progress);
  }
  function render():void {
    scheduled=false;
    if(reducedMotion.matches){
      for(let i=0;i<tiles.length;i++){tiles[i].style.opacity='1';tiles[i].style.transform=`rotate(${poses[i].rotation}deg)`;}
      copy.style.opacity='1';copy.style.translate='0 0';next.style.opacity='1';
      incoming.style.setProperty('--story-shift','0px');incoming.style.setProperty('--gallery-stage-height','0px');gallery.inert=false;incoming.inert=false;
      storyIntro.style.opacity='1';storyIntro.style.transform='none';gallery.dataset.scrollProgress='static';return;
    }
    const bounds=gallery.getBoundingClientRect();
    const lead=innerHeight*.45;
    const travel=Math.max(1,gallery.offsetHeight-stage.offsetHeight);
    const progress=clamp((lead-bounds.top)/(travel+lead));
    const handoff=smooth(.62,1,progress);
    gallery.dataset.scrollProgress=progress.toFixed(3);
    incoming.dataset.slideProgress=handoff.toFixed(4);
    incoming.style.setProperty('--gallery-stage-height',`${stage.offsetHeight}px`);
    // Compensate for normal document scrolling instead of adding another full
    // downward movement. The incoming edge crosses the pinned collage once.
    const flowTop=gallery.offsetTop+gallery.offsetHeight-stage.offsetHeight-window.scrollY;
    const desiredTop=(1-handoff)*stage.offsetHeight;
    const slideOffset=progress>=1?0:progress<.62?Math.max(0,desiredTop-flowTop):desiredTop-flowTop;
    incoming.style.setProperty('--story-shift',`${slideOffset.toFixed(2)}px`);
    gallery.inert=handoff>.98;incoming.inert=handoff<.02;
    tiles.forEach((tile,index)=>{
      const pose=poses[index];
      const enter=smooth(.025+index*.025,.355+index*.025,progress);
      const x=pose.x*(1-enter);
      const y=pose.y*(1-enter)-65*handoff;
      const rotation=pose.rotation+(1-enter)*(index%2?9:-9);
      const scale=.86+.14*enter-.04*handoff;
      tile.style.opacity=enter.toFixed(4);
      tile.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
    });
    const copyIn=smooth(.10,.35,progress);
    copy.style.opacity=copyIn.toFixed(4);
    copy.style.translate=`0 ${((1-copyIn)*34-handoff*55).toFixed(2)}px`;
    next.style.opacity=(smooth(.35,.48,progress)*(1-smooth(.58,.75,progress))).toFixed(4);
    storyIntro.style.opacity='1';storyIntro.style.transform='none';
  }
  function schedule():void {if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
  // Use the section's flow position: its animated visual position is moving.
  document.querySelectorAll<HTMLAnchorElement>('a[href="#homepage-stories"]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();window.scrollTo({top:incoming.offsetTop,behavior:reducedMotion.matches?'auto':'smooth'});
  }));
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  reducedMotion.addEventListener('change',schedule);
  // Decoded local images prevent an empty tile flashing during its entrance.
  void Promise.all(Array.from(gallery.querySelectorAll<HTMLImageElement>('img')).map(img=>img.decode().catch(()=>{}))).then(schedule);
  render();
}
setupHarvestGallery();

function setupGrowingRegions():void {
  const cards=getElement('region-cards'),markers=getElement('region-markers');
  cards.innerHTML=previewGrowers.map((grower,index)=>'<article class="region-card"><div class="region-photo region-photo-'+index+'"><img src="assets/'+grower.art+'" alt="'+grower.artAlt+'"></div><div class="region-card-copy"><p class="eyebrow">'+grower.region+'</p><h3>'+grower.name+'</h3><p>'+grower.cropLabel+'</p><button class="text-link" data-region="'+grower.id+'" aria-pressed="'+(index===0)+'" aria-controls="origins">Discover the community '+icon('arrow-up')+'</button></div></article>').join('');
  markers.innerHTML=previewGrowers.map(grower=>{const x=(21+(grower.longitude-116.8)/10.1*113)/157*100,y=(18+(20.9-grower.latitude)/16*159)/216*100;return '<button class="region-dot" data-region="'+grower.id+'" aria-label="Discover '+grower.region+'" style="left:'+x+'%;top:'+y+'%"></button>';}).join('');
  function selectRegion(id:string,scroll=false):void {
    const grower=previewGrowers.find(item=>item.id===id)!;
    getElement('region-kicker').textContent=grower.region+' · '+grower.landscape;
    getElement('region-title').textContent=grower.storyTitle;
    const harvest=getElement<HTMLImageElement>('origin-harvest');harvest.src='assets/'+grower.art;harvest.alt=grower.artAlt;harvest.dataset.cropRegion=grower.id;
    getElement('region-description').textContent=grower.story;
    getElement('region-organization').textContent=grower.name;
    document.querySelectorAll<HTMLElement>('[data-region]').forEach(button=>{const active=button.dataset.region===id;button.setAttribute('aria-pressed',String(active));button.classList.toggle('selected',active);});
    if(scroll)getElement('origins').scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth',block:'center'});
  }
  document.querySelectorAll<HTMLElement>('[data-region]').forEach(button=>button.addEventListener('click',()=>selectRegion(button.dataset.region!,true)));
  selectRegion(previewGrowers[1].id);
}
setupGrowingRegions();
const landDialog=getElement<HTMLDialogElement>('land-story');
getElement('open-land-story').addEventListener('click',()=>landDialog.showModal());
getElement('open-care-story').addEventListener('click',()=>landDialog.showModal());
getElement('close-land-story').addEventListener('click',()=>landDialog.close());
landDialog.addEventListener('click',event=>{if(event.target===landDialog){const box=landDialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)landDialog.close();}});

// The header follows the account signed in on login.html, and the cart count is that buyer's cart.
function setupAccountLinks():void {
  dashLoadStore();
  const account=dashAccountByEmail(dashSessionEmail());
  const active=account&&account.status==='Active'?account:undefined;
  const signIn=document.querySelector<HTMLAnchorElement>('.header-actions .sign-in');
  if(signIn&&active){signIn.href=dashHomeFor(active);signIn.textContent=active.name.split(' ')[0]+'’s account';}
  const lines=active&&active.role==='Consumer'?(dashboardCarts[active.email]||[]).length:0;
  getElement('cart-count').textContent=String(lines);
  getElement('open-cart').setAttribute('aria-label','Open your cart, '+dashPlural(lines,'item'));
}
setupAccountLinks();
