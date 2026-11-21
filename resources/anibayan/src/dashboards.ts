// The three AniBayan workspaces share this script. The page's <body data-dashboard="…"> picks the role:
//   admin        – platform administrator: account management, user reports, organization applications and site health
//   organization – farmer organization representative: orders, listings, ratings & feedback, members, payments
//   consumer     – buyer: shop with filters, cart and checkout, orders, saved harvests, growers
// The admin and organization workspaces need a matching account signed in on login.html. Anyone can browse the
// shop and growers; ordering, saving and rating need a buyer account.
type DashRole='admin'|'organization'|'consumer';
const dashRoleAttr=document.body.dataset.dashboard;
const dashboardRole:DashRole=dashRoleAttr==='admin'||dashRoleAttr==='organization'?dashRoleAttr:'consumer';
const isAdminDashboard=dashboardRole==='admin';
const isOrgDashboard=dashboardRole==='organization';
const isConsumerDashboard=dashboardRole==='consumer';
dashLoadStore();

/* ---------- Display preferences (remembered in this browser) ---------- */
const dashPrefsKey='anibayan-preferences-v1';
function dashApplyPreferences():void{
 try{
  const prefs=JSON.parse(localStorage.getItem(dashPrefsKey)||'{}');
  document.body.classList.toggle('compact-density',!!prefs.compact);
  document.body.classList.toggle('contrast-mode',!!prefs.contrast);
 }catch{/* no saved preferences */}
}
function dashSavePreferences():void{
 try{localStorage.setItem(dashPrefsKey,JSON.stringify({compact:document.body.classList.contains('compact-density'),contrast:document.body.classList.contains('contrast-mode')}));}catch{/* preferences last for this page only */}
}
dashApplyPreferences();

/* ---------- Who is signed in ---------- */
const dashSignedIn=dashAccountByEmail(dashSessionEmail());
const dashActive=dashSignedIn&&dashSignedIn.status==='Active'?dashSignedIn:undefined;
const dashPageRole=isAdminDashboard?'Administrator':isOrgDashboard?'Representative':'Consumer';
const dashNeedsSignIn=!isConsumerDashboard&&(!dashActive||dashActive.role!==dashPageRole);
const dashBuyer=isConsumerDashboard&&dashActive&&dashActive.role==='Consumer'?dashActive:undefined;
const isGuest=isConsumerDashboard&&!dashBuyer;
const dashMeEmail=isConsumerDashboard?(dashBuyer?dashBuyer.email:''):(dashNeedsSignIn||!dashActive?'':dashActive.email);
const dashMe=()=>dashAccountByEmail(dashMeEmail);
const dashAccount=()=>dashMe()!;
const dashOrgName=isOrgDashboard&&dashActive?dashActive.organization||'':'';
const dashConsumerName=dashBuyer?dashBuyer.name:'';
const dashBuyerViews=['overview','cart','orders','saved','payments','settings'];
const dashPageFile=()=>location.pathname.split('/').pop()||dashboardRole+'.html';
function dashGoToSignIn(notice:string):void{location.href='login.html?next='+encodeURIComponent(dashPageFile()+location.search+location.hash)+'&notice='+notice;}
// Buyer-only actions send guests to sign in, then back here.
function dashRequireBuyer():boolean{if(!isGuest)return true;dashGoToSignIn('buyer');return false;}

const dashRoot=document.getElementById('dashboard-app')!;
const dashDialog=document.getElementById('detail-dialog') as HTMLDialogElement;
interface DashShopFilters{type:string;min:string;max:string;harvest:string;location:string;sort:string}
const dashShopDefaults:DashShopFilters={type:'All',min:'',max:'',harvest:'any',location:'All',sort:'fresh'};
// bar: the highlighted chart bar; anything past the end selects the newest one.
// profile: the organization or person shown by the profile view (#org=… or #user=…).
const dashState={view:'overview',query:'',filter:'All',nextFilter:'',period:'week' as 'week'|'month',chart:'value',hardwareChart:'cpu',bar:99,shop:{...dashShopDefaults},profile:{kind:'org' as 'org'|'user',slug:''}};
const dashPaths:Record<string,string>={
 grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
 bag:'M5 7h14l2 14H3L5 7Z M8 8V6a4 4 0 0 1 8 0v2',
 box:'m3 7 9-4 9 4-9 4-9-4Z M3 7v10l9 4 9-4V7 M12 11v10 M8 5l9 4',
 leaf:'M20 3C9 2 3 7 5 14c3 7 15 4 15-11Z M5 20 16 8',
 people:'M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M16 4a4 4 0 0 1 0 8 M23 21v-2a4 4 0 0 0-3-3.9 M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
 user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
 wallet:'M3 6h17v15H3V4h15 M15 11h6v5h-6z',
 chart:'M4 20h17 M7 16V9 M12 16V4 M17 16v-5',
 settings:'M9 3h6l1 3 3 1 2 5-2 2v4l-5 3-2-2-3 1-4-3v-4l-2-2 2-5 3-1 1-2Z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
 help:'M9.2 9a3 3 0 0 1 5.6 1c0 2-3 2-3 4 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
 arrow:'M5 12h14 m-5-5 5 5-5 5',up:'M7 17 17 7 M7 7h10v10',
 search:'M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
 bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
 chevron:'m8 10 4 4 4-4',calendar:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16',
 download:'M12 3v12 m-4-4 4 4 4-4 M4 17v4h16v-4',
 eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
 pin:'M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 check:'m5 12 4 4L19 6',menu:'M9 4H3v16h18V4H9v16 M5 8h1 M5 12h1',
 plus:'M12 5v14 M5 12h14',
 store:'M3 9l1.5-5h15L21 9 M4 9v11h16V9 M9 20v-6h6v6 M3 9h18',
 shield:'m12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5l8-3Z m-4 9 3 3 5-6',
 clock:'M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
 home:'m3 10 9-7 9 7 M5 9v12h14V9 M9 21v-7h6v7',
 star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z',
 flag:'M5 21V4 M5 4h12l-2.5 4.5L17 13H5',
 pulse:'M3 12h4l3-7 4 14 3-7h4',
 clipboard:'M9 3h6v4H9z M7 5H5v16h14V5h-2 M9 13l2 2 4-4',
 lock:'M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4',
 cart:'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6 M10 21h.01 M18 21h.01',
 edit:'M4 20h4L19 9l-4-4L4 16v4Z M13 7l4 4',
 logout:'M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10',
 key:'M15 7a4 4 0 1 1-3.9 5H3v4h3v-2h2v2h3.1A4 4 0 0 1 15 7Z',
 image:'M4 5h16v14H4z M4 15l4-4 4 4 3-3 5 5 M15 9h.01',
 camera:'M4 8h3l2-3h6l2 3h3v11H4z M15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z',
 move:'M12 3v18 M3 12h18 M9 6l3-3 3 3 M9 18l3 3 3-3 M6 9l-3 3 3 3 M18 9l3 3-3 3',
 close:'M6 6l12 12 M18 6 6 18',
 verified:'m12 2 2.4 2.2 3.2-.4.8 3.1 2.8 1.6-1.3 3 1.3 3-2.8 1.6-.8 3.1-3.2-.4L12 22l-2.4-2.2-3.2.4-.8-3.1L2.8 15.5l1.3-3-1.3-3 2.8-1.6.8-3.1 3.2.4L12 2Z m-3.5 10 2.5 2.5 4.5-5',
};
const di=(name:string)=>'<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="'+(dashPaths[name]||dashPaths.grid)+'"/></svg>';
const dp=(value:number)=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(value);
const dd=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'2-digit'});
const dfull=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'2-digit',year:'numeric'});
const dmonth=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('en-PH',{month:'long',year:'numeric'});
const dtime=(iso:string)=>new Date(iso).toLocaleString('en-PH',{month:'short',day:'2-digit',hour:'numeric',minute:'2-digit'});
const ds=(status:string)=>'<span class="status '+status.toLowerCase().replace(/ /g,'-')+'">'+de(status)+'</span>';
const dashOrderNo=(id:string)=>id.replace('AB-2026-','#');
const dashInitials=(name:string)=>name.split(' ').map(part=>part[0]).join('').slice(0,2).toUpperCase();
// Stock photos live in assets/; uploaded photos are stored as data URLs.
const dashImg=(src:string)=>/^(data:|blob:|https?:)/.test(src)?src:'assets/'+src;

/* ---------- Harvest date & shelf life ---------- */
const dashDayNumber=(date:string)=>Math.round(new Date(date+'T12:00:00').getTime()/864e5);
const dashAge=(date:string)=>dashDayNumber(dashToday)-dashDayNumber(date);
function dashAddDays(date:string,days:number):string{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return dashIsoDate(d);}
interface DashFreshness{age:number;left:number;label:string;tone:string}
// age: days since harvest. left: days of shelf life remaining.
function dashFreshness(crop:DashboardCrop):DashFreshness{
 const age=dashAge(crop.harvested),left=crop.shelfLife-age;
 const label=left<0?'Past shelf life':left===0?'Use today':left<=2?'Use within '+dashPlural(left,'day'):left>=60?'Keeps about '+Math.round(left/30)+' months':'Keeps '+left+' more days';
 return {age,left,label,tone:left<0?'past-shelf-life':left<=2?'use-soon':'fresh'};
}
const dashAgeText=(age:number)=>age<=0?'today':age===1?'yesterday':age+' days ago';
const dashFreshBadge=(crop:DashboardCrop)=>{const f=dashFreshness(crop);return '<span class="status '+f.tone+'">'+f.label+'</span>';};
const dashHarvestLine=(crop:DashboardCrop,withShelfLife=false)=>{const f=dashFreshness(crop);return '<p class="harvest-line">'+di('calendar')+'<span>Harvested '+dd(crop.harvested)+' · '+dashAgeText(f.age)+(withShelfLife?' · '+f.label.toLowerCase():'')+'</span></p>';};
const dashShelfDefaults:Record<string,number>={Vegetables:7,Fruits:7,'Rice & grains':180};
// A terminated organization's listings leave the shop.
const dashIsBuyable=(crop:DashboardCrop)=>crop.status==='Active'&&crop.stock>0&&dashFreshness(crop).left>=0&&dashboardOrganizations.find(o=>o.name===crop.organization)?.status!=='Terminated';

/* ---------- Buyer ratings ---------- */
interface DashRating{rating:number;reviews:number}
function dashRatingOf(org:string):DashRating{
 const ratings=dashboardFeedback.filter(f=>f.organization===org).map(f=>f.rating);
 return {rating:ratings.length?ratings.reduce((sum,r)=>sum+r,0)/ratings.length:0,reviews:ratings.length};
}
function dashRatingText(org:string):string{
 const r=dashRatingOf(org);
 return r.reviews?'<span class="rating"><b aria-hidden="true">★</b> '+r.rating.toFixed(1)+' <small>('+dashPlural(r.reviews,'review')+')</small></span>':'<span class="rating">No reviews yet</span>';
}
const dashStars=(rating:number)=>'<span class="stars" role="img" aria-label="Rated '+rating+' out of 5">'+'★'.repeat(rating)+'<span class="stars-off">'+'★'.repeat(5-rating)+'</span></span>';

/* ---------- Organization warnings ---------- */
// Every report an administrator upholds is a warning, and administrators can also warn an organization directly
// for breaking AniBayan's rules. The last of dashWarningLimit warnings is the final warning; the next offence
// terminates the organization: its listings leave the shop and its representative can no longer sign in.
const dashWarningLimit=3;
interface DashWarningEntry{id:string;reason:string;details:string;date:string;report?:string;by?:string}
function dashWarningsFor(org:string):DashWarningEntry[]{
 const fromReports:DashWarningEntry[]=dashboardReports.filter(r=>r.organization===org&&r.status==='Upheld').map(r=>({id:r.id,reason:r.reason,details:r.details,date:r.decided||r.date,report:r.id}));
 const direct:DashWarningEntry[]=dashboardWarnings.filter(w=>w.organization===org).map(w=>({id:w.id,reason:w.reason,details:w.details,date:w.date,by:w.by}));
 return fromReports.concat(direct).sort((a,b)=>b.date.localeCompare(a.date));
}
interface DashStanding{count:number;final:boolean;terminated:boolean;label:string;tone:string}
function dashStanding(org:string):DashStanding{
 const count=dashWarningsFor(org).length;
 const terminated=dashboardOrganizations.find(o=>o.name===org)?.status==='Terminated';
 const final=!terminated&&count>=dashWarningLimit;
 const label=terminated?'Terminated':final?'Final warning':count?count+' of '+dashWarningLimit+' warnings':'No warnings';
 return {count,final,terminated,label,tone:terminated?'terminated':final?'final-warning':count?'warned':'no-warnings'};
}
const dashStandingBadge=(org:string)=>{const s=dashStanding(org);return '<span class="status '+s.tone+'">'+s.label+'</span>';};
function dashStandingSentence(org:string):string{
 const s=dashStanding(org);
 return org+(s.terminated?' is terminated.':s.final?' is on its final warning.':s.count?' has '+s.label+'.':' has no warnings.');
}
// What the next upheld report or warning does to the organization.
function dashNextOffence(org:string):string{
 const s=dashStanding(org);
 return s.terminated?'Nothing more: it is terminated':s.final?'Terminates the organization':s.count+1>=dashWarningLimit?'Final warning ('+dashWarningLimit+' of '+dashWarningLimit+')':'Warning '+(s.count+1)+' of '+dashWarningLimit;
}
// One segment per warning before termination.
function dashWarningMeter(org:string):string{
 const s=dashStanding(org);
 return '<div class="warning-meter'+(s.final||s.terminated?' final':'')+'" role="img" aria-label="'+s.label+'">'+Array.from({length:dashWarningLimit},(_,i)=>'<i'+(i<s.count?' class="on"':'')+'></i>').join('')+'</div>';
}
// Administrators can withdraw a warning they gave; a report's warning goes when the report is reopened.
function dashWarningRows(org:string,listClass:string,canWithdraw:boolean):string{
 return '<div class="'+listClass+'">'+dashWarningsFor(org).map(w=>'<article class="feedback-row"><header><strong>'+de(w.reason)+'</strong><small>'+dd(w.date)+'</small></header>'+(w.details?'<p>'+de(w.details)+'</p>':'')+'<small>'+(w.report?'Upheld report '+w.report:'Given by '+de(w.by||'AniBayan'))+'</small>'+(canWithdraw&&!w.report?' <button class="text-button" data-withdraw-warning="'+w.id+'">Withdraw</button>':'')+'</article>').join('')+'</div>';
}
function dashWarningCallout():string{
 const s=dashStanding(dashOrgName);
 if(!s.count)return '';
 const latest=dashWarningsFor(dashOrgName)[0];
 return '<div class="warning-callout'+(s.final?' final':'')+'">'+di('flag')+'<span><b>'+s.label+'</b> · '+de(latest.reason)+'</span><button data-go="feedback">See warnings →</button></div>';
}
const dashRated=(orderId:string)=>dashboardFeedback.some(f=>f.order===orderId);
const dashMyReport=(orderId:string)=>dashboardReports.find(r=>r.order===orderId&&r.customer===dashConsumerName);
const dashRegion=(org:string)=>dashboardOrganizations.find(o=>o.name===org)?.region||'';
const dashOpenReports=()=>dashboardReports.filter(r=>r.status==='Open').length;
const dashPendingApplications=()=>dashboardOrganizations.filter(o=>o.status==='Pending review').length;
const dashListingCount=(org:string)=>dashboardCrops.filter(c=>c.organization===org&&dashIsBuyable(c)).length;

/* ---------- Profiles: pictures, banners, links and buyer privacy ---------- */
// Profile addresses use the name: #org=canubing-vegetable-growers, #user=alex-reyes.
const dashSlug=(name:string)=>name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const dashAccountByName=(name:string)=>dashboardAccounts.find(a=>a.name===name);
const dashLookKind=(role:string)=>role==='Administrator'?'admin':role==='Representative'?'organization':'consumer';
// Approved and terminated organizations are public; pending and declined ones only to administrators and their own representative.
const dashOrgVisible=(o:DashboardOrganization)=>o.status==='Active'||o.status==='Terminated'||isAdminDashboard||o.name===dashOrgName;
function dashOrgLink(name:string):string{
 const o=dashboardOrganizations.find(x=>x.name===name);
 return o&&dashOrgVisible(o)?'<a class="profile-link" href="#org='+dashSlug(name)+'" data-profile-link>'+de(name)+'</a>':de(name);
}
// Buyers and representatives have profiles; administrators don't.
function dashUserLink(name:string):string{
 const a=dashAccountByName(name);
 return a&&a.role!=='Administrator'?'<a class="profile-link" href="#user='+dashSlug(name)+'" data-profile-link>'+de(name)+'</a>':de(name);
}
// The round picture: the uploaded photo, otherwise initials.
function dashAvatar(look:DashboardLook|undefined,name:string,kind:string,size=''):string{
 return '<span class="avatar '+kind+'-avatar'+(size?' '+size:'')+'">'+(look?.avatar?'<img src="'+de(look.avatar)+'" alt="">':de(dashInitials(name)))+'</span>';
}
const dashPrivacyDefaults:DashboardPrivacy={profile:true,reviews:true,city:true,growers:true};
const dashPrivacy=(a:DashboardAccount):DashboardPrivacy=>({...dashPrivacyDefaults,...(a.privacy||{})});
// "12 J.P. Rizal Street, Barangay Lalud, Calapan City, Oriental Mindoro" → "Calapan City, Oriental Mindoro".
function dashCity(address?:string):string{const parts=(address||'').split(',').map(p=>p.trim()).filter(Boolean);return parts.length>=3?parts.slice(-2).join(', '):'';}
// A banner without an uploaded photo: the organization's own photo, or a green gradient picked from the buyer's name.
function dashBannerStyle(look:DashboardLook,fallback:string):string{
 return 'background-image:'+(look.banner?'url(&quot;'+de(look.banner)+'&quot;)':fallback)+';background-position:'+(look.bannerX??50)+'% '+(look.bannerY??50)+'%';
}
function dashUserBanner(name:string):string{
 const hue=95+[...name].reduce((sum,c)=>sum+c.charCodeAt(0),0)%60;
 return 'linear-gradient(125deg,hsl('+hue+' 42% 24%),hsl('+(hue+25)+' 45% 36%) 55%,hsl('+(hue-30)+' 60% 62%))';
}
// target: "org:<name>" or "user:<email>"; data-look carries it to the photo buttons.
function dashLookOf(target:string):DashboardLook|undefined{
 const at=target.indexOf(':');const kind=target.slice(0,at),key=target.slice(at+1);
 return kind==='org'?dashboardOrganizations.find(o=>o.name===key):kind==='user'?dashAccountByEmail(key):undefined;
}
// Only the owner changes a profile's photos: the buyer on their own page, or the organization's representative.
function dashCanEdit(target:string):boolean{
 const at=target.indexOf(':');const kind=target.slice(0,at),key=target.slice(at+1);
 if(kind==='org')return isOrgDashboard&&key===dashOrgName&&!dashBlocked().length;
 return isConsumerDashboard&&!!dashMeEmail&&key.toLowerCase()===dashMeEmail.toLowerCase();
}
interface DashProfileHead{look:DashboardLook;target:string;name:string;kind:string;fallback:string;line:string;badges:string;actions:string;about:string;heading:'h1'|'h2'}
// The banner, picture and name at the top of a profile. The owner gets the photo buttons.
function dashProfileCard(p:DashProfileHead):string{
 const editable=dashCanEdit(p.target);
 const picker=(kind:string,content:string,cls:string,label:string)=>'<label class="'+cls+'" tabindex="0" role="button"'+(label?' aria-label="'+label+'"':'')+'>'+content+'<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-upload="'+kind+'" data-look="'+de(p.target)+'" hidden></label>';
 const tools=editable?'<div class="banner-tools">'+picker('banner',di('image')+'<span>'+(p.look.banner?'Change banner':'Add banner')+'</span>','banner-button','')+(p.look.banner?'<button class="banner-button" data-reposition="'+de(p.target)+'">'+di('move')+'<span>Reposition</span></button><button class="banner-button" data-remove-photo="banner" data-look="'+de(p.target)+'">'+di('close')+'<span>Remove</span></button>':'')+'</div><div class="banner-actions" hidden><button class="banner-button" data-reposition-cancel>Cancel</button><button class="banner-button primary" data-reposition-save>'+di('check')+'Save position</button></div>':'';
 const photo=editable?picker('avatar',di('camera'),'avatar-button','Change picture')+(p.look.avatar?'<button class="avatar-button remove" data-remove-photo="avatar" data-look="'+de(p.target)+'" aria-label="Remove picture">'+di('close')+'</button>':''):'';
 return '<section class="panel profile-card"><div class="profile-banner" data-banner="'+de(p.target)+'" style="'+dashBannerStyle(p.look,p.fallback)+'">'+tools+'</div><div class="profile-id"><div class="profile-avatar">'+dashAvatar(p.look,p.name,p.kind,'avatar-xl')+photo+'</div><div class="profile-name"><'+p.heading+'>'+de(p.name)+'</'+p.heading+'><p>'+p.line+'</p>'+(p.badges?'<div class="profile-badges">'+p.badges+'</div>':'')+'</div>'+(p.actions?'<div class="profile-actions">'+p.actions+'</div>':'')+'</div>'+(p.about?'<p class="profile-about">'+p.about+'</p>':'')+'</section>';
}
function dashOrgCard(o:DashboardOrganization,heading:'h1'|'h2',actions:string):string{
 const r=dashRatingOf(o.name);
 const badges=(o.status==='Active'?'<span class="status verified">'+di('verified')+'Verified</span>':ds(o.status))+(r.reviews?dashRatingText(o.name):'');
 return dashProfileCard({look:o,target:'org:'+o.name,name:o.name,kind:'organization',fallback:'url(&quot;'+de(dashImg(o.image))+'&quot;)',line:de(o.region)+' · '+de(o.crop)+(o.approved?' · Since '+dmonth(o.approved):''),badges,actions,about:o.description?de(o.description):'',heading});
}
function dashUserCard(a:DashboardAccount,heading:'h1'|'h2',actions:string,showCity:boolean):string{
 const p=dashPrivacy(a);
 const city=showCity?dashCity(a.address):'';
 const line=(a.role==='Consumer'?'Buyer':'Representative · '+dashOrgLink(a.organization||''))+' · Joined '+dmonth(a.joined)+(city?' · '+de(city):'');
 const badges=(a.role==='Consumer'&&!p.profile?'<span class="status private">'+di('lock')+'Private</span>':'')+(a.status!=='Active'&&isAdminDashboard?ds(a.status):'');
 return dashProfileCard({look:a,target:'user:'+a.email,name:a.name,kind:dashLookKind(a.role),fallback:dashUserBanner(a.name),line,badges,actions,about:'',heading});
}
const dashProfileMissing=()=>'<section class="panel">'+dashEmpty('This profile isn’t available.','')+'<div class="empty-action"><button class="control" data-go="'+dashRole.nav[0][0]+'">'+di('arrow')+'Back</button></div></section>';
function dashReviewRow(f:DashboardFeedback,by:'customer'|'organization'):string{
 const a=by==='customer'?dashAccountByName(f.customer):undefined;
 const o=by==='organization'?dashboardOrganizations.find(x=>x.name===f.organization):undefined;
 const who=by==='customer'?dashAvatar(a,f.customer,dashLookKind(a?.role||'Consumer'),'avatar-sm')+dashUserLink(f.customer):dashAvatar(o,f.organization,'organization','avatar-sm')+dashOrgLink(f.organization);
 return '<article class="feedback-row review-row"><header><span class="review-who">'+who+'</span><span class="review-meta">'+dashStars(f.rating)+'<small>'+dd(f.date)+'</small></span></header><p>'+(f.comment?'“'+de(f.comment)+'”':'No comment left.')+'</p></article>';
}
function dashOrgProfileView(slug:string):string{
 const o=dashboardOrganizations.find(x=>dashSlug(x.name)===slug&&dashOrgVisible(x));
 if(!o)return dashProfileMissing();
 const own=isOrgDashboard&&o.name===dashOrgName;
 const r=dashRatingOf(o.name);
 const crops=dashboardCrops.filter(c=>c.organization===o.name&&dashIsBuyable(c));
 const members=dashboardMembers.filter(m=>m.organization===o.name).length||o.members;
 const completed=dashboardOrders.filter(x=>x.organization===o.name&&x.status==='Completed').length;
 const mine=dashRoleOrders().filter(x=>x.organization===o.name);
 const toRate=isConsumerDashboard?mine.find(x=>x.status==='Completed'&&!dashRated(x.id)):undefined;
 const toReport=isConsumerDashboard?mine.find(x=>!dashMyReport(x.id)):undefined;
 const actions=own?'<button class="control" data-edit-org-profile>'+di('edit')+'Edit profile</button>'
  :isAdminDashboard?'<button class="control" data-organization="'+de(o.name)+'">'+di('shield')+'Review organization</button>'
  :(toReport?'<button class="control" data-report-order="'+toReport.id+'">'+di('flag')+'Report a problem</button>':'')+(toRate?'<button class="control primary" data-rate="'+toRate.id+'">'+di('star')+'Rate your order</button>':'');
 const reviews=dashboardFeedback.filter(f=>f.organization===o.name).sort((a,b)=>b.date.localeCompare(a.date));
 const metrics='<div class="metric-grid">'+dashMetric('Harvests listed',String(crops.length),'box','')+dashMetric('Buyer rating',r.reviews?r.rating.toFixed(1)+' ★':'–','star','')+dashMetric('Orders completed',String(completed),'check','')+dashMetric('Member farmers',String(members),'people','')+'</div>';
 const harvests=crops.length?'<div class="product-grid">'+crops.sort(dashShopSorts.fresh[1]).map(c=>dashConsumerTile(c,isConsumerDashboard)).join('')+'</div>':'<section class="panel">'+dashEmpty('No harvests listed right now.','')+'</section>';
 const feedback='<section class="panel">'+dashPanelHead('Buyer reviews','','<span class="filter-summary">'+dashPlural(reviews.length,'review')+'</span>')+'<div class="feedback-list">'+(reviews.length?reviews.map(f=>dashReviewRow(f,'customer')).join(''):dashEmpty('No reviews yet.',''))+'</div></section>';
 return dashOrgCard(o,'h1',actions)+metrics+'<h2 class="section-title">Harvests</h2>'+harvests+feedback;
}
function dashUserProfileView(slug:string):string{
 const a=dashboardAccounts.find(x=>dashSlug(x.name)===slug&&x.role!=='Administrator');
 if(!a)return dashProfileMissing();
 const own=!!dashMeEmail&&a.email.toLowerCase()===dashMeEmail.toLowerCase();
 const p=dashPrivacy(a);
 // The buyer and administrators see everything; others see what the buyer's privacy settings allow.
 const shows=(key:keyof DashboardPrivacy)=>a.role!=='Consumer'||own||isAdminDashboard||(p.profile&&p[key]);
 const actions=own?'<button class="control" data-go="settings">'+di('settings')+'Edit profile</button>':isAdminDashboard?'<button class="control" data-account="'+de(a.email)+'">'+di('shield')+'Manage account</button>':'';
 const card=dashUserCard(a,'h1',actions,shows('city'));
 if(a.role!=='Consumer')return card;
 if(!shows('profile'))return card+'<section class="panel private-panel">'+di('lock')+'<h2>Private profile</h2></section>';
 const orders=dashboardOrders.filter(o=>o.customer===a.name);
 const reviews=dashboardFeedback.filter(f=>f.customer===a.name).sort((x,y)=>y.date.localeCompare(x.date));
 const growers=[...new Set(orders.filter(o=>o.status!=='Cancelled').map(o=>o.organization))].map(name=>dashboardOrganizations.find(o=>o.name===name)).filter((o):o is DashboardOrganization=>!!o&&dashOrgVisible(o));
 const metrics='<div class="metric-grid three">'+dashMetric('Orders completed',String(orders.filter(o=>o.status==='Completed').length),'check','')+(shows('reviews')?dashMetric('Reviews',String(reviews.length),'star',''):'')+(shows('growers')?dashMetric('Growers',String(growers.length),'leaf',''):'')+'</div>';
 const reviewPanel=shows('reviews')?'<section class="panel">'+dashPanelHead('Reviews','','<span class="filter-summary">'+dashPlural(reviews.length,'review')+'</span>')+'<div class="feedback-list">'+(reviews.length?reviews.map(f=>dashReviewRow(f,'organization')).join(''):dashEmpty('No reviews yet.',''))+'</div></section>':'';
 const growerPanel=shows('growers')?'<section class="panel">'+dashPanelHead('Growers','')+'<div class="grower-list">'+(growers.length?growers.map(o=>'<a class="grower-chip" href="#org='+dashSlug(o.name)+'" data-profile-link>'+dashAvatar(o,o.name,'organization')+'<span><strong>'+de(o.name)+'</strong><small>'+de(o.region)+'</small></span></a>').join(''):dashEmpty('No growers yet.',''))+'</div></section>':'';
 return card+metrics+(reviewPanel&&growerPanel?'<div class="split">'+reviewPanel+growerPanel+'</div>':reviewPanel+growerPanel);
}

/* ---------- Uploading, removing and repositioning profile photos ---------- */
async function dashUploadLook(input:HTMLInputElement):Promise<void>{
 const file=input.files?.[0];const kind=input.dataset.upload==='banner'?'banner':'avatar';const target=input.dataset.look||'';
 input.value='';
 const look=dashLookOf(target);
 if(!file||!look||!dashCanEdit(target))return;
 if(!/^image\/(jpeg|png|webp|gif)$/.test(file.type)){dashToast('Choose a JPG, PNG, WebP or GIF picture.');return;}
 if(file.size>10*1024*1024){dashToast('Choose a picture smaller than 10 MB.');return;}
 let photo='';
 try{photo=await dashReadPhoto(file,kind==='avatar'?320:1600,kind==='avatar');}
 catch{dashToast('This picture couldn’t be read. Try another one.');return;}
 const before={avatar:look.avatar,banner:look.banner,bannerX:look.bannerX,bannerY:look.bannerY};
 if(kind==='avatar')look.avatar=photo;else Object.assign(look,{banner:photo,bannerX:50,bannerY:50});
 // Unset fields go back to undefined, which the saved copy leaves out.
 if(!dashSaveStore()){Object.assign(look,before);dashToast('This browser has no room left for that picture. Try a smaller one.');return;}
 dashLog('profile-updated',dashMeEmail,kind==='avatar'?'Profile picture':'Profile banner');
 dashRender();
 if(kind==='banner')void dashStartReposition(target);else dashToast('Profile picture updated.');
}
interface DashReposition{target:string;x:number;y:number;width:number;height:number;drag?:{id:number;cx:number;cy:number;x:number;y:number}}
let dashRepositioning:DashReposition|null=null;
const dashBannerEl=(target:string)=>document.querySelector<HTMLElement>('.profile-banner[data-banner="'+CSS.escape(target)+'"]');
async function dashStartReposition(target:string):Promise<void>{
 const look=dashLookOf(target);
 if(!look?.banner||!dashCanEdit(target))return;
 const image=new Image();image.src=look.banner;
 try{await image.decode();}catch{dashToast('The banner couldn’t be loaded.');return;}
 dashRepositioning={target,x:look.bannerX??50,y:look.bannerY??50,width:image.naturalWidth,height:image.naturalHeight};
 dashShowReposition();
 dashBannerEl(target)?.focus({preventScroll:true});
}
// Puts the banner in repositioning mode again after a redraw.
function dashShowReposition():void{
 const r=dashRepositioning;const el=r?dashBannerEl(r.target):null;
 if(!r||!el)return;
 el.classList.add('is-positioning');el.tabIndex=0;el.setAttribute('aria-label','Banner position');
 el.style.backgroundPosition=r.x+'% '+r.y+'%';
 el.querySelector<HTMLElement>('.banner-tools')!.hidden=true;el.querySelector<HTMLElement>('.banner-actions')!.hidden=false;
}
// Dragging moves the photo with the pointer: CSS percentages are a share of the part of the photo that doesn't fit.
function dashMoveBanner(dx:number,dy:number,from:{x:number;y:number}):void{
 const r=dashRepositioning;const el=r?dashBannerEl(r.target):null;
 if(!r||!el)return;
 const box=el.getBoundingClientRect();const scale=Math.max(box.width/r.width,box.height/r.height);
 const extraX=r.width*scale-box.width,extraY=r.height*scale-box.height;
 const clamp=(v:number)=>Math.round(Math.max(0,Math.min(100,v))*10)/10;
 r.x=extraX>0.5?clamp(from.x-dx/extraX*100):from.x;r.y=extraY>0.5?clamp(from.y-dy/extraY*100):from.y;
 el.style.backgroundPosition=r.x+'% '+r.y+'%';
}
function dashFinishReposition(save:boolean):void{
 const r=dashRepositioning;
 dashRepositioning=null;
 if(r&&save){
  const look=dashLookOf(r.target);
  if(look&&dashCanEdit(r.target)){look.bannerX=r.x;look.bannerY=r.y;dashLog('profile-updated',dashMeEmail,'Banner position');}
 }
 dashRender();
 if(r&&save)dashToast('Banner position saved.');
}

/* ---------- The signed-in buyer's saved harvests and cart ---------- */
const dashSavedList=():string[]=>dashMeEmail?dashboardSaved[dashMeEmail]||(dashboardSaved[dashMeEmail]=[]):[];
const dashIsSaved=(id:string)=>dashSavedList().includes(id);
const dashCart=():DashboardCartLine[]=>dashMeEmail?dashboardCarts[dashMeEmail]||(dashboardCarts[dashMeEmail]=[]):[];
interface DashCartEntry{line:DashboardCartLine;crop:DashboardCrop}
function dashCartEntries():DashCartEntry[]{
 const entries:DashCartEntry[]=[];
 dashCart().forEach(line=>{const crop=dashboardCrops.find(c=>c.id===line.crop);if(crop)entries.push({line,crop});});
 return entries;
}
// Why a cart line can't be checked out as it is, or '' when it can.
function dashCartProblem(entry:DashCartEntry):string{
 if(!dashIsBuyable(entry.crop))return 'No longer available';
 if(entry.line.quantity>entry.crop.stock)return 'Only '+entry.crop.stock+' '+entry.crop.unit+' left';
 return '';
}

/* ---------- The signed-in representative's organization ---------- */
const dashMyOrg=()=>dashboardOrganizations.find(o=>o.name===dashOrgName);
function dashOrgProfile(){
 const org=dashMyOrg();const rep=dashAccount();
 return {name:dashOrgName,region:org?org.region:'',crops:org?org.crop:'',representative:rep.name,email:rep.email,phone:(org&&org.phone)||rep.phone||'',description:(org&&org.description)||'',verified:org&&org.approved?'Verified by AniBayan · '+dfull(org.approved):'Waiting for verification'};
}
interface DashPeriodSummary extends DashboardPeriod{previousValue:number;previousOrders:number}
// Order value and volume for the last 7 days (daily) or last 4 weeks (weekly), from the organization's orders.
function dashOrgPeriod():DashPeriodSummary{
 const week=dashState.period==='week';
 const size=week?1:7,buckets=week?7:4,span=size*buckets;
 const labels=Array.from({length:buckets},(_,i)=>{const start=dashDaysAgo(span-1-i*size);return week?new Date(start+'T12:00:00').toLocaleDateString('en-PH',{weekday:'short'}):dd(start);});
 const values=labels.map(()=>0),orders=labels.map(()=>0);
 let previousValue=0,previousOrders=0;
 dashRoleOrders().filter(o=>o.status!=='Cancelled').forEach(o=>{
  const age=dashAge(o.date);
  if(age>=0&&age<span){const index=buckets-1-Math.floor(age/size);values[index]+=o.total/1000;orders[index]+=1;}
  else if(age>=span&&age<span*2){previousValue+=o.total;previousOrders+=1;}
 });
 return {label:dd(dashDaysAgo(span-1))+' – '+dfull(dashToday),value:Math.round(values.reduce((s,v)=>s+v,0)*1000),orders:orders.reduce((s,v)=>s+v,0),labels,values:values.map(v=>Math.round(v*100)/100),orderValues:orders,valueScale:Math.max(1,Math.ceil(Math.max(...values)*1.25)),orderScale:Math.max(4,Math.ceil(Math.max(...orders)*1.25)),previousValue,previousOrders};
}
// Change against the previous period, as [percentage, went down].
const dashTrend=(now:number,before:number):[string,boolean]=>before>0?[Math.abs(Math.round((now-before)/before*1000)/10)+'%',now<before]:['',false];

/* ---------- Site health: real checks run from the admin page ---------- */
let dashChecking=false;
async function dashTimedFetch(path:string):Promise<number>{
 if(location.protocol==='file:')throw new Error('Open AniBayan through the web server to check this.');
 const start=performance.now();
 const response=await fetch(path+'?check='+Date.now(),{cache:'no-store'});
 if(!response.ok)throw new Error('The server answered '+response.status+'.');
 const elapsed=performance.now()-start;
 response.body?.cancel().catch(()=>undefined);
 return elapsed;
}
const dashHealthChecks:[string,string,()=>Promise<number>][]=[
 ['Web application','Homepage and dashboards',()=>dashTimedFetch('index.html')],
 ['Application code','Dashboard and sign-in scripts',()=>dashTimedFetch('js/dashboards.js')],
 ['File storage','Product and organization photos',()=>dashTimedFetch('assets/carrot.jpg')],
 ['Data store','Accounts, listings and orders',async()=>{
  const start=performance.now();const key='anibayan-health-probe';const value=String(Date.now());
  localStorage.setItem(key,value);const read=localStorage.getItem(key);localStorage.removeItem(key);
  if(read!==value)throw new Error('Saved data could not be read back.');
  return performance.now()-start;
 }],
];
// CPU, memory and storage of the machine serving AniBayan, read by the Laravel app (routes/web.php).
async function dashReadHardware():Promise<DashboardHardware>{
 if(location.protocol==='file:')throw new Error('Open AniBayan through the web server to read the hardware.');
 const response=await fetch('../server-health',{cache:'no-store',headers:{Accept:'application/json'}});
 if(!response.ok)throw new Error('The server answered '+response.status+'.');
 return await response.json() as DashboardHardware;
}
// Services AniBayan will connect to, with their current state.
const dashIntegrations=[['PayMongo payments','Card and GCash checkout','Test mode','No money is charged'],['Tawk.to live chat','Customer support chat','Not connected','Live chat is not set up yet.'],['Email notifications','Order and account emails','Not connected','Email sending is not set up yet.']];
async function dashRunHealthChecks():Promise<void>{
 if(dashChecking)return;
 dashChecking=true;dashRender();
 const results:DashboardHealthResult[]=[];
 for(const [service,,run] of dashHealthChecks){
  try{results.push({service,ok:true,latency:Math.round(await run())});}
  catch(error){results.push({service,ok:false,latency:0,error:error instanceof Error?error.message:String(error)});}
 }
 let hardware:DashboardHardware|undefined,hardwareError:string|undefined;
 try{hardware=await dashReadHardware();}catch(error){hardwareError=error instanceof Error?error.message:String(error);}
 dashboardHealthLog.push({time:new Date().toISOString(),results,hardware,hardwareError});
 if(dashboardHealthLog.length>30)dashboardHealthLog.splice(0,dashboardHealthLog.length-30);
 dashChecking=false;dashRender();
}
function dashHealthSummary(){
 const log=dashboardHealthLog;
 const results=log.flatMap(run=>run.results);
 const passed=results.filter(r=>r.ok).length;
 const latest=log.length?log[log.length-1]:undefined;
 const web=log.map(run=>run.results.find(r=>r.service==='Web application')).filter((r):r is DashboardHealthResult=>!!r&&r.ok);
 const percent=(part:number)=>results.length?Math.round(part/results.length*1000)/10+'%':'–';
 return {latest,runs:log.length,uptime:percent(passed),errorRate:percent(results.length-passed),failures:results.length-passed,average:web.length?Math.round(web.reduce((s,r)=>s+r.latency,0)/web.length):null,down:latest?latest.results.filter(r=>!r.ok):[]};
}
const dashLatency=(ms:number)=>ms<1?'under 1 ms':ms+' ms';

interface DashRoleConfig{page:string;workspace:string;navLabel:string;nav:string[][];settingsNav:string[]|null;user:string;userRole:string;initials:string;search:string;cardIcon:string;cardTitle:string;cardText:string;shortcut:string[];titles:Record<string,string[]>}
const dashHelpTitle=['Help & support','Where to go for each task in AniBayan.'];
const dashOrgAtLoad=isOrgDashboard&&!dashNeedsSignIn?dashOrgProfile():undefined;
const dashUserName=dashMe()?.name||'Guest';
const dashRoles:Record<DashRole,DashRoleConfig>={
 admin:{
  page:'admin.html',workspace:'Admin workspace',navLabel:'Administration',
  nav:[['overview','grid','Overview'],['accounts','people','Accounts'],['activity','eye','Activity log'],['reports','flag','User reports'],['applications','clipboard','Applications'],['health','pulse','Site health']],
  settingsNav:['settings','settings','Settings'],
  user:dashUserName,userRole:'Platform administrator',initials:'AD',
  search:'Search accounts, reports, applications…',
  cardIcon:'shield',cardTitle:'Platform oversight',cardText:'Accounts, user reports, organization applications and site health.',
  shortcut:['Public homepage','index.html','home'],
  titles:{overview:['Admin overview','Accounts, user reports, organization applications and site health.'],accounts:['Account management','Consumer, representative and administrator accounts.'],activity:['Activity log','Sign-ins, orders, listings and administrator actions, newest first.'],reports:['User reports','Reports buyers filed about organizations.'],applications:['Organization applications','Farmer organizations asking to sell on AniBayan.'],health:['Site health','Live checks of AniBayan’s services, plus the history of recent checks.'],settings:['Workspace settings','Your administrator account and preferences.'],help:dashHelpTitle},
 },
 organization:{
  page:'organization.html',workspace:'Organization workspace',navLabel:'Your organization',
  nav:[['overview','grid','Overview'],['orders','bag','Incoming orders'],['listings','box','My listings'],['feedback','star','Ratings & feedback'],['members','people','Member farmers'],['payments','wallet','Payments']],
  settingsNav:['settings','store','Organization profile'],
  user:dashUserName,userRole:'Organization representative',initials:dashInitials(dashUserName),
  search:'Search your orders, listings, feedback…',
  cardIcon:'leaf',cardTitle:dashOrgName,cardText:dashOrgAtLoad?dashOrgAtLoad.region+' · '+dashOrgAtLoad.crops:'',
  shortcut:['View public storefront','consumer.html#org='+dashSlug(dashOrgName),'store'],
  titles:{overview:[dashOrgName,'Orders, listings and members for your organization.'],orders:['Incoming orders','Confirm, prepare and complete orders from your buyers.'],listings:['My listings','The crops your organization offers. Buyers see each harvest date and shelf life.'],feedback:['Ratings & feedback','What buyers say about your organization, and any warnings from AniBayan.'],members:['Member farmers','The growers who supply your organization.'],payments:['Payments','Payment status for your organization’s orders.'],settings:['Organization profile','How your organization appears on AniBayan.'],help:dashHelpTitle},
 },
 consumer:{
  page:'consumer.html',workspace:isGuest?'AniBayan market':'My AniBayan',navLabel:isGuest?'Browse':'Your account',
  nav:isGuest?[['shop','store','Shop'],['growers','leaf','Growers']]:[['overview','grid','Overview'],['shop','store','Shop'],['cart','cart','Cart'],['orders','bag','My orders'],['saved','heart','Saved harvests'],['growers','leaf','My growers'],['payments','wallet','Payment history']],
  settingsNav:isGuest?null:['settings','user','My profile'],
  user:dashUserName,userRole:isGuest?'Not signed in':'Buyer account',initials:isGuest?'?':dashInitials(dashUserName),
  search:'Search harvests, orders and growers…',
  cardIcon:'leaf',cardTitle:'Good food starts here.',cardText:'Discover fresh harvests and the communities behind them.',
  shortcut:['Shop the harvest','#shop','store'],
  titles:{overview:['Your harvest, at a glance.','Welcome back, '+dashUserName.split(' ')[0]+'. Good things are on their way.'],shop:['Shop the harvest',isGuest?'Fresh harvests from local growing communities. Sign in to order.':'Filter by price, crop type, harvest time and location.'],cart:['Your cart','Each organization fulfils its own order.'],orders:['My orders','Follow each order, then rate it or report a problem.'],saved:['Saved harvests','Crops you want to come back to.'],growers:[isGuest?'Growing communities':'Your growing communities','The organizations behind your food, with their buyer ratings.'],payments:['Payment history','Payments for your orders.'],settings:['Your profile','Your account, delivery details and preferences.'],help:dashHelpTitle},
 },
};
const dashRole=dashRoles[dashboardRole];
// Organization order workflow: current status -> [next status, action label].
const dashNextStep:Record<string,string[]>={Pending:['Confirmed','Confirm order'],Confirmed:['Processing','Start preparing'],Processing:['Completed','Mark completed']};
// Cancelling returns checked-out items to stock; cash-on-delivery orders count as paid once completed.
function dashSetOrderStatus(order:DashboardOrder,status:string):void{
 if(status==='Cancelled'&&order.status!=='Cancelled')(order.items||[]).forEach(item=>{const crop=dashboardCrops.find(c=>c.id===item.crop);if(crop)crop.stock+=item.quantity;});
 order.status=status;
 if(status==='Completed'&&order.method==='Cash on delivery')order.payment='Paid';
}
const dashOnline=(order:DashboardOrder)=>!!order.method&&order.method!=='Cash on delivery';

// [title, message] when the signed-in account can no longer use this page, otherwise [].
function dashBlocked():string[]{
 const me=dashMe();
 if(!me)return [];
 if(me.status==='Suspended')return ['This account is suspended','An AniBayan administrator suspended '+me.email+'. Contact AniBayan support if you think this is a mistake.'];
 if(me.status==='Terminated'||(isOrgDashboard&&dashMyOrg()?.status==='Terminated'))return ['Your organization was terminated',(me.organization||'Your organization')+' was removed from AniBayan after repeated warnings. Contact AniBayan support if you think this is a mistake.'];
 if(isOrgDashboard){
  const org=dashMyOrg();
  if(me.status==='Pending'||org?.status==='Pending review')return ['Your application is being reviewed','An AniBayan administrator is reviewing '+dashOrgName+'. You can manage listings and orders once it is approved.'];
  if(me.status==='Declined'||org?.status==='Declined')return ['Your application was declined',dashOrgName+' was not approved. You can apply again with complete documents.'];
 }
 return [];
}
function dashNotifications():string[][]{
 if(isAdminDashboard){
  const notes:string[][]=[];
  if(dashPendingApplications())notes.push([dashPlural(dashPendingApplications(),'organization application')+' awaiting review.','applications','Review applications']);
  if(dashFlaggedToday())notes.push([dashPlural(dashFlaggedToday(),'flagged sign-in')+' today.','activity','Open the activity log']);
  if(dashOpenReports())notes.push([dashPlural(dashOpenReports(),'user report')+' waiting for your decision.','reports','Review user reports']);
  dashHealthSummary().down.forEach(r=>notes.push([r.service+' failed its last check.','health','View site health']));
  return notes;
 }
 if(isGuest)return [['Sign in to order fresh harvests and follow your deliveries.','shop','Shop the harvest']];
 const orders=dashRoleOrders();
 if(isOrgDashboard){
  const notes:string[][]=[];
  const warning=dashWarningsFor(dashOrgName)[0];
  if(warning)notes.push(['AniBayan warning: '+warning.reason+'. '+dashStandingSentence(dashOrgName),'feedback','See warnings']);
  const pending=orders.filter(o=>o.status==='Pending');
  if(pending.length)notes.push([pending.length===1?'New order '+dashOrderNo(pending[0].id)+' from '+pending[0].customer+' is waiting for confirmation.':pending.length+' new orders are waiting for confirmation.','orders','Open incoming orders']);
  dashRoleCrops().filter(c=>c.status==='Active'&&c.stock>0&&c.stock<50).slice(0,2).forEach(c=>notes.push([c.name+' is running low: '+c.stock+' '+c.unit+' left.','listings','Manage listings']));
  dashRoleCrops().filter(c=>c.status==='Active'&&c.stock>0&&dashFreshness(c).left<0).slice(0,2).forEach(c=>notes.push([c.name+' is past its shelf life and hidden from buyers.','listings','Update the listing']));
  const latest=dashboardFeedback.filter(f=>f.organization===dashOrgName).sort((a,b)=>b.date.localeCompare(a.date))[0];
  if(latest)notes.push([latest.customer+' rated your organization '+dashPlural(latest.rating,'star')+'.','feedback','See ratings & feedback']);
  return notes;
 }
 const notes:string[][]=[];
 orders.filter(o=>['Confirmed','Processing'].includes(o.status)).slice(0,2).forEach(o=>notes.push(['Your '+o.crop.toLowerCase()+' is being prepared by '+o.organization+'.','orders','See my orders']));
 orders.filter(o=>o.payment==='Unpaid'&&dashOnline(o)&&o.status!=='Cancelled').slice(0,1).forEach(o=>notes.push(['Order '+dashOrderNo(o.id)+' is waiting for payment.','orders','Pay now']));
 const unrated=orders.find(o=>o.status==='Completed'&&!dashRated(o.id));
 if(unrated)notes.push(['How was your '+unrated.crop.toLowerCase()+' from '+unrated.organization+'?','orders','Rate your order']);
 if(dashCart().length)notes.push(['You have '+dashPlural(dashCart().length,'harvest')+' in your cart.','cart','Go to checkout']);
 return notes;
}

// The signed-in person's picture in the sidebar, header and account menu; representatives show their organization's.
function dashShellAvatar():string{
 const look=isOrgDashboard?dashMyOrg():dashMe();
 return '<span class="avatar '+dashboardRole+'-avatar" data-me-avatar>'+(look?.avatar?'<img src="'+de(look.avatar)+'" alt="">':dashRole.initials)+'</span>';
}
function dashShell():void{
 const link=(item:string[])=>'<a href="#'+item[0]+'" data-nav="'+item[0]+'" title="'+de(item[2])+'">'+di(item[1])+'<span>'+de(item[2])+'</span><span class="nav-count" data-nav-count="'+item[0]+'" hidden></span></a>';
 const me=dashMe();
 const avatar=dashShellAvatar();
 const menu=me
  ?'<p>Signed in as</p><div class="workspace-account">'+avatar+'<span><strong>'+de(me.name)+'</strong><small>'+de(me.email)+'</small></span></div>'+(dashRole.settingsNav?'<a href="#'+dashRole.settingsNav[0]+'">'+di(dashRole.settingsNav[1])+'<span>'+dashRole.settingsNav[2]+'</span></a>':'')+'<a href="index.html">'+di('home')+'<span>Homepage</span></a><a class="workspace-home" href="login.html" data-sign-out>'+di('logout')+'<span>Sign out</span></a>'
  :'<p>Browsing as a guest</p><a href="login.html" data-sign-in>'+di('user')+'<span>Sign in</span></a><a href="login.html#register">'+di('plus')+'<span>Create an account</span></a><a class="workspace-home" href="index.html">'+di('home')+'<span>Homepage</span></a>';
 const headerUser=me?'<button class="header-user" data-go="'+(dashRole.settingsNav?dashRole.settingsNav[0]:'help')+'" aria-label="'+(dashRole.settingsNav?dashRole.settingsNav[2]:'Help')+'">'+avatar+'<span><strong>'+de(me.name)+'</strong><small>'+dashRole.userRole+'</small></span></button>':'<a class="control" href="login.html#register">Create account</a><a class="control primary" href="login.html" data-sign-in>Sign in</a>';
 dashRoot.innerHTML=`<aside class="sidebar" id="sidebar"><a class="dash-brand" href="index.html" aria-label="AniBayan homepage"><svg viewBox="0 0 34 32" aria-hidden="true"><path d="M16 32V17C6 19 0 12 0 3c10 0 17 4 17 14C17 5 25 0 34 0c0 11-6 18-17 18v14Z"/></svg><strong>AniBayan.</strong></a><p class="sidebar-role"><span class="role-badge">${dashRole.workspace}</span></p><p class="nav-label">${dashRole.navLabel}</p><nav class="side-nav" aria-label="${dashRole.workspace} navigation">${dashRole.nav.map(link).join('')}</nav><p class="nav-label">General</p><nav class="side-nav" aria-label="Account and help">${(dashRole.settingsNav?link(dashRole.settingsNav):'')+link(['help','help','Help & support'])}</nav><div class="sidebar-foot"><div class="sidebar-card">${di(dashRole.cardIcon)}<strong>${de(dashRole.cardTitle)}</strong>${de(dashRole.cardText)}</div><div class="workspace-switch"><div class="workspace-menu" id="workspace-menu" hidden>${menu}</div><button class="sidebar-user" id="workspace-toggle" aria-expanded="false" aria-controls="workspace-menu" aria-label="Account menu">${avatar}<span class="sidebar-user-copy"><strong>${de(dashRole.user)}</strong><small>${dashRole.userRole}</small></span>${di('chevron')}</button></div></div></aside><div class="sidebar-backdrop" id="sidebar-backdrop"></div><div class="workspace"><header class="topbar"><button class="icon-button collapse-button" id="collapse-sidebar" aria-label="Toggle navigation" aria-controls="sidebar">${di('menu')}</button><label class="global-search">${di('search')}<input id="dashboard-search" type="search" placeholder="${dashRole.search}" aria-label="Search current section"><kbd>/</kbd></label><span class="topbar-spacer"></span><a class="market-shortcut" href="${dashRole.shortcut[1]}">${di(dashRole.shortcut[2])}<span>${dashRole.shortcut[0]}</span>${di('up')}</a><div class="notification-wrap"><button class="icon-button notification-button" id="show-notifications" aria-label="Show notifications" aria-expanded="false" aria-controls="notification-panel">${di('bell')}<span class="notification-dot" id="notification-dot"></span></button><div class="notification-panel" id="notification-panel" hidden><h2>Notifications</h2><ul id="notification-list"></ul></div></div><div class="header-account">${headerUser}</div></header><main class="main-content" id="dashboard-content" tabindex="-1"></main></div>`;
}
function dashRenderNotifications():void{
 const notes=dashBlocked().length?[]:dashNotifications();
 document.getElementById('notification-list')!.innerHTML=notes.length?notes.map(n=>'<li><p>'+de(n[0])+'</p><a href="#'+n[1]+'">'+n[2]+' →</a></li>').join(''):'<li><p>You’re all caught up.</p></li>';
 document.getElementById('notification-dot')!.hidden=!notes.length;
}
function dashHeading():string{
 const view=dashState.view;
 const [title,sub]=dashRole.titles[view];
 const exportButton='<button class="control" id="export-dashboard">'+di('download')+'Export CSV</button>';
 let tools='';
 if(isConsumerDashboard)tools='<span class="control static">'+di('calendar')+dashTodayDate.toLocaleDateString('en-PH',{weekday:'long',day:'2-digit',month:'short',year:'numeric'})+'</span>'+(view==='shop'||view==='cart'?'':'<button class="control primary" data-go="shop">'+di('bag')+'Shop the harvest</button>');
 else if(isAdminDashboard){
  if(view==='health'){const latest=dashHealthSummary().latest;tools+='<span class="control static">'+di('clock')+(dashChecking?'Checking now…':latest?'Last checked '+dtime(latest.time):'Not checked yet')+'</span><button class="control" data-health-check'+(dashChecking?' disabled':'')+'>'+di('pulse')+'Run checks</button>';}
  if(['accounts','reports','applications','health'].includes(view))tools+=exportButton;
 }else{
  if(view==='overview')tools+='<select class="period-select" id="dashboard-period" aria-label="Reporting period"><option value="week" '+(dashState.period==='week'?'selected':'')+'>Last 7 days</option><option value="month" '+(dashState.period==='month'?'selected':'')+'>Last 4 weeks</option></select>';
  if(['overview','orders','listings','feedback','members','payments'].includes(view))tools+=exportButton;
  if(view==='overview'||view==='listings')tools+='<button class="control primary" data-add-listing>'+di('plus')+'Add listing</button>';
  if(view==='members')tools+='<button class="control primary" data-add-member>'+di('plus')+'Add member</button>';
 }
 return '<div class="page-heading"><div><h1>'+de(title)+'</h1><p>'+de(sub)+'</p></div><div class="page-tools">'+tools+'</div></div>';
}
function dashMetric(label:string,value:string,icon:string,caption:string,trend='',down=false):string{
 return '<article class="metric"><div class="metric-top"><span>'+label+'</span>'+di(icon)+'</div><div class="metric-value"><strong>'+value+'</strong>'+(trend?'<span class="trend'+(down?' down':'')+'">'+(down?'↘ ':'↗ ')+trend+'</span>':'')+'</div>'+(caption?'<p class="metric-caption">'+caption+'</p>':'')+'</article>';
}
function dashPanelHead(title:string,note:string,action=''):string{
 return '<div class="panel-head"><div><h2>'+title+'</h2>'+(note?'<p>'+note+'</p>':'')+'</div>'+action+'</div>';
}
// A bar chart panel with one tab per data series; dashState.chart picks the visible series.
interface DashSeries{key:string;tab:string;title:string;note:string;legend:string;values:number[];scale:number;axis:(value:number)=>string;caption:(value:number)=>string;suffix:string}
// group 'hardware' keeps its own tab, so the hardware chart and the response chart can sit on one page.
function dashBarChart(series:DashSeries[],labels:string[],chip:string,foot:string,group=''):string{
 const chosen=group==='hardware'?dashState.hardwareChart:dashState.chart;
 const s=series.find(item=>item.key===chosen)||series[0];
 const selected=Math.min(dashState.bar,s.values.length-1);
 const bars=s.values.map((value,index)=>{
   const caption=s.caption(value);
   return '<div class="chart-column"><button class="chart-bar '+(selected===index?'selected':'')+'" style="--bar-height:'+Math.min(100,Math.round(value/s.scale*100))+'%" data-bar="'+index+'" aria-pressed="'+(selected===index)+'" aria-label="'+labels[index]+': '+caption+s.suffix+'"><span>'+caption+'</span></button><span class="chart-day">'+labels[index]+'</span></div>';
 }).join('');
 return '<section class="panel">'+dashPanelHead(s.title,s.note,'<span class="chip">'+chip+'</span>')+'<div class="chart-tabs">'+series.map(item=>'<button data-chart="'+item.key+'"'+(group?' data-chart-group="'+group+'"':'')+' aria-pressed="'+(item===s)+'">'+item.tab+'</button>').join('')+'</div><div class="chart-body"><div class="chart-axis">'+[1,.75,.5,.25,0].map(part=>'<span>'+s.axis(Math.round(part*s.scale*100)/100)+'</span>').join('')+'</div><div class="bar-chart">'+bars+'</div></div><div class="chart-foot"><span><i class="legend-dot"></i> '+s.legend+'</span><span>'+foot+'</span></div></section>';
}
function dashChart(period:DashboardPeriod,valueNote:string,volumeNote:string):string{
 return dashBarChart([
  {key:'value',tab:'Order value',title:'Order value',note:valueNote,legend:'Order value',values:period.values,scale:period.valueScale,axis:value=>'₱'+value+'k',caption:value=>dp(value*1000),suffix:''},
  {key:'orders',tab:'Order volume',title:'Order activity',note:volumeNote,legend:'Placed orders',values:period.orderValues,scale:period.orderScale,axis:value=>String(value),caption:value=>String(value),suffix:' orders'},
 ],period.labels,dashState.period==='week'?'Last 7 days':'Last 4 weeks',period.label);
}
function dashMatching(text:string):boolean{return text.toLowerCase().includes(dashState.query.trim().toLowerCase());}
function dashEmpty(title:string,description:string):string{return '<div class="empty-state"><h2>'+title+'</h2><p>'+description+'</p></div>';}
// search: the placeholder of a search box for this table; it shares the header search's query.
function dashFilters(options:string[],summary:string,search=''):string{
 const box=search?'<label class="global-search table-search">'+di('search')+'<input type="search" data-table-search value="'+de(dashState.query)+'" placeholder="'+search+'" aria-label="'+search+'"></label>':'';
 return '<div class="filters">'+options.map(f=>'<button class="filter-chip" data-filter="'+f+'" aria-pressed="'+(dashState.filter===f)+'">'+f+'</button>').join('')+box+'<span class="filter-summary">'+summary+'</span></div>';
}
// Orders visible to the current role, before search and status filters. Administrators and guests see none.
function dashRoleOrders():DashboardOrder[]{
 if(isAdminDashboard||isGuest)return [];
 return dashboardOrders.filter(o=>isOrgDashboard?o.organization===dashOrgName:o.customer===dashConsumerName);
}
function dashOrders():DashboardOrder[]{
 return dashRoleOrders().filter(o=>dashMatching([o.id,o.customer,o.organization,o.crop,o.quantity,o.status,o.payment,o.date].join(' '))&&(dashState.filter==='All'||o.status===dashState.filter));
}
function dashRoleCrops():DashboardCrop[]{
 return dashboardCrops.filter(c=>!isOrgDashboard||c.organization===dashOrgName);
}
function dashCropStatus(crop:DashboardCrop):string{
 if(crop.stock===0)return 'Out of stock';
 if(crop.status!=='Active')return 'Paused';
 if(dashFreshness(crop).left<0)return 'Past shelf life';
 return isOrgDashboard&&crop.stock<50?'Low stock':'Active';
}
function dashOrderTable(mode:'recent'|'all'|'payments'):string{
 const all=dashOrders();
 const orders=mode==='recent'?all.slice(0,5):all;
 const product=(o:DashboardOrder)=>'<div class="table-product"><img src="'+dashImg(o.image)+'" alt=""><div><strong>'+de(o.crop)+'</strong><small>'+de(o.quantity)+'</small></div></div>';
 const cols:[string,(o:DashboardOrder)=>string][]=[['Order',o=>'<strong>'+dashOrderNo(o.id)+'</strong>'],['Harvest',product]];
 if(isOrgDashboard)cols.push(['Buyer',o=>de(o.customer)]);
 cols.push(['Total',o=>'<strong>'+dp(o.total)+'</strong>']);
 if(mode==='payments')cols.push(['Payment',o=>ds(o.payment)+(o.method?'<small class="cell-note">'+de(o.method)+'</small>':'')],['Order status',o=>ds(o.status)]);else cols.push(['Status',o=>ds(o.status)]);
 cols.push(['Date',o=>dd(o.date)]);
 const actions=(o:DashboardOrder)=>'<div class="row-actions">'+(isOrgDashboard&&mode==='all'&&dashNextStep[o.status]?'<button class="control small" data-advance="'+o.id+'">'+dashNextStep[o.status][1]+'</button>':'')+(isConsumerDashboard&&mode!=='recent'&&o.payment==='Unpaid'&&dashOnline(o)&&o.status!=='Cancelled'?'<button class="control small primary" data-pay-order="'+o.id+'">Pay now</button>':'')+(isConsumerDashboard&&mode==='all'&&o.status==='Completed'&&!dashRated(o.id)?'<button class="control small" data-rate="'+o.id+'">'+di('star')+'Rate</button>':'')+'<button class="table-action" data-order="'+o.id+'" aria-label="View order '+o.id+'">'+di('eye')+'</button></div>';
 const title=mode==='payments'?(isOrgDashboard?'Payments by order':'Your payment history'):mode==='recent'?(isConsumerDashboard?'Recent purchases':'Recent orders'):(isOrgDashboard?'Orders from your buyers':'Your orders');
 const head=dashPanelHead(title,'',mode==='recent'?'<button class="text-button" data-go="orders">View all '+di('arrow')+'</button>':'');
 const filters=mode==='all'?dashFilters(['All','Pending','Confirmed','Processing','Completed','Cancelled'],dashPlural(orders.length,'order')):'';
 const empty=!dashRoleOrders().length?dashEmpty('No orders yet',isConsumerDashboard?'Orders you place from your cart appear here.':'Orders from buyers appear here.'):dashEmpty('No matching orders','Try another search or order status.');
 const table=orders.length?'<table><thead><tr>'+cols.map(c=>'<th scope="col">'+c[0]+'</th>').join('')+'<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>'+orders.map(o=>'<tr>'+cols.map(c=>'<td>'+c[1](o)+'</td>').join('')+'<td>'+actions(o)+'</td></tr>').join('')+'</tbody></table>':empty;
 return '<section class="panel">'+head+filters+'<div class="table-wrap">'+table+'</div>'+(mode==='recent'?'':'<div class="table-footer"><span>Showing '+orders.length+' of '+dashPlural(dashRoleOrders().length,'order')+'</span></div>')+'</section>';
}

/* ---------- Admin: accounts, user reports, organization applications and site health ---------- */
const dashAppStatus=(org:DashboardOrganization)=>org.status==='Active'?'Approved':org.status;
function dashAccountList():DashboardAccount[]{
 const f=dashState.filter==='Buyer'?'Consumer':dashState.filter;
 return dashboardAccounts.filter(a=>dashMatching([a.name,a.email,a.role==='Consumer'?'Buyer':a.role,a.organization||'',a.status].join(' '))&&(f==='All'||a.role===f||a.status===f));
}
function dashReportList():DashboardReport[]{
 return dashboardReports.filter(r=>dashMatching(Object.values(r).join(' '))&&(dashState.filter==='All'||r.status===dashState.filter)).sort((a,b)=>b.date.localeCompare(a.date));
}
function dashApplicationList():DashboardOrganization[]{
 return dashboardOrganizations.filter(o=>dashMatching(o.name+' '+o.region+' '+o.crop+' '+o.representative)&&(dashState.filter==='All'||dashAppStatus(o)===dashState.filter)).sort((a,b)=>b.applied.localeCompare(a.applied));
}
function dashHealthChart():string{
 const runs=dashboardHealthLog.slice(-7);
 if(!runs.length)return '<section class="panel">'+dashPanelHead('Response time','Time for the web application to answer')+dashEmpty(dashChecking?'Running the first checks…':'No checks yet','Run the checks to measure response times.')+'</section>';
 const labels=runs.map(run=>new Date(run.time).toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'}));
 const latency=runs.map(run=>run.results.find(r=>r.service==='Web application')?.latency||0);
 const failures=runs.map(run=>run.results.filter(r=>!r.ok).length);
 return dashBarChart([
  {key:'response',tab:'Response time',title:'Response time',note:'Time for the web application to answer, per check',legend:'Response time (ms)',values:latency,scale:Math.max(50,Math.ceil(Math.max(...latency)*1.25/10)*10),axis:value=>String(Math.round(value)),caption:value=>dashLatency(value),suffix:''},
  {key:'errors',tab:'Failed checks',title:'Failed checks',note:'Services that failed, per check',legend:'Failed checks',values:failures,scale:Math.max(2,dashHealthChecks.length),axis:value=>String(Math.round(value)),caption:value=>String(value),suffix:' failed'},
 ],labels,'Last '+dashPlural(runs.length,'check'),'Times are when each check ran');
}
function dashServicesPanel():string{
 const summary=dashHealthSummary();
 const rows=dashHealthChecks.map(([name,detail])=>{
  const result=summary.latest?.results.find(r=>r.service===name);
  const history=dashboardHealthLog.flatMap(run=>run.results.filter(r=>r.service===name));
  const rate=history.length?Math.round(history.filter(r=>r.ok).length/history.length*1000)/10+'% of checks passed':'';
  const status=dashChecking&&!result?'Checking':result?(result.ok?'Operational':'Down'):'Not checked';
  const info=result&&!result.ok?result.error||'Check failed':[detail,result?dashLatency(result.latency):'',rate].filter(Boolean).join(' · ');
  return [name,info,status];
 }).concat(dashIntegrations.map(([name,detail,status,note])=>[name,detail+' · '+note,status])).filter(row=>dashMatching(row.join(' ')));
 const ok=summary.latest?summary.latest.results.filter(r=>r.ok).length:0;
 return '<section class="panel">'+dashPanelHead('Services',summary.latest?ok+' of '+dashHealthChecks.length+' checked services up':'Waiting for the first check',dashState.view==='overview'?'<button class="icon-button" data-go="health" aria-label="View site health">'+di('up')+'</button>':'')+'<div class="service-list">'+(rows.length?rows.map(([name,info,status])=>'<div class="service-row"><div><strong>'+de(name)+'</strong><small>'+de(info)+'</small></div>'+ds(status)+'</div>').join(''):dashEmpty('No matching services','Try another search.'))+'</div></section>';
}
function dashReportTable(limit:number):string{
 const all=dashReportList();
 const reports=limit?all.slice(0,limit):all;
 const table=reports.length?'<table><thead><tr><th scope="col">Report</th><th scope="col">Organization</th><th scope="col">Reported by</th><th scope="col">Reason</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>'+reports.map(r=>'<tr><td><strong>'+r.id+'</strong><small class="cell-note">'+dfull(r.date)+'</small></td><td>'+de(r.organization)+'</td><td>'+de(r.customer)+'</td><td>'+de(r.reason)+'</td><td>'+ds(r.status)+'</td><td><div class="row-actions"><button class="control small'+(r.status==='Open'?' primary':'')+'" data-report-id="'+r.id+'">'+(r.status==='Open'?'Review':'View')+'</button></div></td></tr>').join('')+'</tbody></table>':dashEmpty(dashboardReports.length?'No matching reports':'No reports yet',dashboardReports.length?'Try another search or report status.':'Reports that buyers file appear here.');
 const head=limit?dashPanelHead('Latest user reports','Newest first','<button class="text-button" data-go="reports">View all '+di('arrow')+'</button>'):dashPanelHead('Reports from buyers','');
 return '<section class="panel">'+head+(limit?'':dashFilters(['All','Open','Upheld','Dismissed'],dashPlural(reports.length,'report'),'Search reports'))+'<div class="table-wrap">'+table+'</div></section>';
}
function dashAdminOverview():string{
 const pending=dashboardOrganizations.filter(o=>o.status==='Pending review').sort((a,b)=>b.applied.localeCompare(a.applied));
 const newAccounts=dashboardAccounts.filter(a=>dashAge(a.joined)<7).length;
 const suspended=dashboardAccounts.filter(a=>a.status==='Suspended').length;
 const health=dashHealthSummary();
 const metrics='<div class="metric-grid">'+dashMetric('Accounts',String(dashboardAccounts.length),'people','<b>'+newAccounts+' new</b> this week · '+suspended+' suspended')+dashMetric('Open user reports',String(dashOpenReports()),'flag','Waiting for your decision')+dashMetric('Applications to review',String(pending.length),'clipboard','Organizations asking to sell')+dashMetric('Checks passed',health.uptime,'pulse',health.runs?'Across the last '+dashPlural(health.runs,'health check'):'Running the first health check')+'</div>';
 const applications='<section class="panel">'+dashPanelHead('Organization applications','Newest first','<button class="icon-button" data-go="applications" aria-label="View all applications">'+di('up')+'</button>')+'<div class="organization-list">'+(pending.length?pending.map(o=>'<button class="organization-row" data-organization="'+de(o.name)+'"><img src="'+dashImg(o.image)+'" alt=""><span><strong>'+de(o.name)+'</strong><small>'+de(o.region)+' · submitted '+dd(o.applied)+'</small></span>'+di('arrow')+'</button>').join(''):dashEmpty('All caught up','No applications are waiting.'))+'</div>'+(pending.length?'<div class="review-prompt">'+di('clock')+'<span><b>'+dashPlural(pending.length,'application')+'</b> awaiting review</span><button data-go="applications" data-go-filter="Pending review">Review →</button></div>':'')+'</section>';
 return metrics+'<div class="split">'+dashHealthChart()+dashServicesPanel()+'</div><div class="split">'+dashReportTable(4)+applications+'</div>';
}
function dashAccountsView():string{
 const count=(test:(a:DashboardAccount)=>boolean)=>dashboardAccounts.filter(test).length;
 const accounts=dashAccountList();
 const metrics='<div class="metric-grid">'+dashMetric('Total accounts',String(dashboardAccounts.length),'people','<b>'+count(a=>dashAge(a.joined)<7)+' new</b> this week')+dashMetric('Buyers',String(count(a=>a.role==='Consumer')),'user','Buyer accounts')+dashMetric('Representatives',String(count(a=>a.role==='Representative')),'leaf',count(a=>a.status==='Pending')+' waiting on an application')+dashMetric('Suspended',String(count(a=>a.status==='Suspended')),'lock','Can’t sign in, order or sell')+'</div>';
 const rows=accounts.map(a=>'<tr><td><div class="table-product">'+dashAvatar(a,a.name,dashLookKind(a.role))+'<div><strong>'+de(a.name)+'</strong><small>'+de(a.email)+'</small></div></div></td><td>'+(a.role==='Consumer'?'Buyer':a.role)+(a.organization?'<small class="cell-note">'+de(a.organization)+'</small>':'')+'</td><td>'+dfull(a.joined)+'</td><td>'+dd(a.lastActive)+'</td><td>'+ds(a.status)+'</td><td><div class="row-actions"><button class="control small" data-account="'+de(a.email)+'">Manage</button></div></td></tr>').join('');
 const table=accounts.length?'<table><thead><tr><th scope="col">Account</th><th scope="col">Role</th><th scope="col">Joined</th><th scope="col">Last active</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>'+rows+'</tbody></table>':dashEmpty('No matching accounts','Try a different name, email, role or status.');
 return metrics+'<section class="panel">'+dashPanelHead('Accounts','')+dashFilters(['All','Buyer','Representative','Administrator','Pending','Suspended'],dashPlural(accounts.length,'account'),'Search accounts')+'<div class="table-wrap">'+table+'</div></section>';
}
function dashReportsView():string{
 const n=(status:string)=>dashboardReports.filter(r=>r.status===status).length;
 return '<div class="metric-grid three">'+dashMetric('Open reports',String(n('Open')),'flag','')+dashMetric('Upheld',String(n('Upheld')),'check','')+dashMetric('Dismissed',String(n('Dismissed')),'clock','')+'</div>'+dashReportTable(0)+dashWarningPanel();
}
// Every approved or terminated organization, those closest to termination first.
function dashWarningPanel():string{
 const rank=(o:DashboardOrganization)=>{const s=dashStanding(o.name);return s.terminated?-1:s.count;};
 const orgs=dashboardOrganizations.filter(o=>(o.status==='Active'||o.status==='Terminated')&&dashMatching(o.name+' '+o.region)).sort((a,b)=>rank(b)-rank(a)||a.name.localeCompare(b.name));
 const row=(o:DashboardOrganization)=>{const latest=dashWarningsFor(o.name)[0];return '<button class="organization-row" data-organization="'+de(o.name)+'"><img src="'+dashImg(o.image)+'" alt=""><span><strong>'+de(o.name)+'</strong><small>'+(latest?'Latest: '+de(latest.reason)+' · '+dd(latest.date):de(o.region))+'</small></span>'+dashStandingBadge(o.name)+di('arrow')+'</button>';};
 return '<section class="panel">'+dashPanelHead('Organization warnings','')+'<div class="organization-list">'+(orgs.length?orgs.map(row).join(''):dashEmpty('No matching organizations','Try another search.'))+'</div></section>';
}
function dashApplicationsView():string{
 const n=(status:string)=>dashboardOrganizations.filter(o=>dashAppStatus(o)===status).length;
 const apps=dashApplicationList();
 const table=apps.length?'<table><thead><tr><th scope="col">Organization</th><th scope="col">Representative</th><th scope="col">Members</th><th scope="col">Documents</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>'+apps.map(o=>{
  const pending=o.status==='Pending review';
  return '<tr><td><div class="table-product"><img class="round" src="'+dashImg(o.image)+'" alt=""><div><strong>'+de(o.name)+'</strong><small>'+de(o.region)+'</small></div></div></td><td>'+de(o.representative)+'</td><td>'+o.members+'</td><td>'+dashPlural(o.documents.length,'file')+'</td><td>'+dfull(o.applied)+'</td><td>'+ds(dashAppStatus(o))+'</td><td><div class="row-actions"><button class="control small'+(pending?' primary':'')+'" data-organization="'+de(o.name)+'">'+(pending?'Review application':'View')+'</button></div></td></tr>';
 }).join('')+'</tbody></table>':dashEmpty('No matching applications','Try a different name, place or status.');
 return '<div class="metric-grid three">'+dashMetric('Awaiting review',String(n('Pending review')),'clock','Organizations asking to sell')+dashMetric('Approved',String(n('Approved')),'check','Selling on AniBayan')+dashMetric('Declined',String(n('Declined')),'flag','Can apply again with complete documents')+'</div><section class="panel">'+dashPanelHead('Applications','')+dashFilters(['All','Pending review','Approved','Declined','Terminated'],dashPlural(apps.length,'application'),'Search applications')+'<div class="table-wrap">'+table+'</div></section>';
}
const dashGB=(bytes:number)=>bytes/1073741824;
const dashGBText=(gb:number)=>(gb>=100?Math.round(gb):Math.round(gb*10)/10)+' GB';
const dashHardwareRuns=()=>dashboardHealthLog.filter(run=>run.hardware);
function dashHardwareChart():string{
 const runs=dashHardwareRuns().slice(-7);
 const last=dashboardHealthLog[dashboardHealthLog.length-1];
 if(!runs.length)return '<section class="panel">'+dashPanelHead('Hardware','')+dashEmpty(dashChecking?'Reading the hardware…':'No readings yet',last?.hardwareError||'Run the checks to read CPU, memory and storage.')+'</section>';
 const hw=runs.map(run=>run.hardware!);
 const latest=hw[hw.length-1];
 const labels=runs.map(run=>new Date(run.time).toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'}));
 const memory=hw.map(h=>h.memoryUsed===null?0:Math.round(dashGB(h.memoryUsed)*10)/10);
 const storage=hw.map(h=>h.storageUsed===null?0:Math.round(dashGB(h.storageUsed)));
 const scale=(total:number|null,values:number[])=>Math.max(1,Math.ceil(total?dashGB(total):Math.max(...values)*1.25));
 return dashBarChart([
  {key:'cpu',tab:'CPU',title:'CPU',note:latest.cores?dashPlural(latest.cores,'core'):'',legend:'CPU in use (%)',values:hw.map(h=>h.cpu??0),scale:100,axis:value=>String(Math.round(value)),caption:value=>value+'%',suffix:' CPU'},
  {key:'memory',tab:'Memory',title:'Memory',note:latest.memoryTotal?dashGBText(dashGB(latest.memoryTotal))+' installed':'',legend:'Memory in use (GB)',values:memory,scale:scale(latest.memoryTotal,memory),axis:value=>String(Math.round(value)),caption:value=>dashGBText(value),suffix:' in use'},
  {key:'storage',tab:'Storage',title:'Storage',note:latest.storageTotal?dashGBText(dashGB(latest.storageTotal))+' drive':'',legend:'Storage used (GB)',values:storage,scale:scale(latest.storageTotal,storage),axis:value=>String(Math.round(value)),caption:value=>dashGBText(value),suffix:' used'},
 ],labels,'Last '+dashPlural(runs.length,'reading'),'Times are when each check ran','hardware');
}
// The latest reading of each part, as a meter.
function dashServerPanel():string{
 const latest=dashHardwareRuns().pop()?.hardware;
 const row=(name:string,share:number|null,value:string,detail:string)=>'<div class="stock-row"><div><div class="stock-row-top"><strong>'+name+'</strong><strong>'+value+'</strong></div><div class="meter'+(share!==null&&share>=90?' high':'')+'" role="img" aria-label="'+name+': '+value+'"><i style="width:'+(share??0)+'%"></i></div><small>'+detail+'</small></div></div>';
 const part=(name:string,used:number|null,total:number|null)=>{const share=used!==null&&total?Math.round(used/total*100):null;return row(name,share,share===null?'–':share+'%',used!==null&&total?dashGBText(dashGB(used))+' of '+dashGBText(dashGB(total)):'Not available');};
 const body=latest?row('CPU',latest.cpu,latest.cpu===null?'–':latest.cpu+'%',latest.cores?dashPlural(latest.cores,'core'):'Not available')+part('Memory',latest.memoryUsed,latest.memoryTotal)+part('Storage',latest.storageUsed,latest.storageTotal):dashEmpty(dashChecking?'Reading the hardware…':'No readings yet','');
 return '<section class="panel">'+dashPanelHead('Server','')+'<div class="stock-list">'+body+'</div></section>';
}
function dashHealthView():string{
 const summary=dashHealthSummary();
 const failures:{time:string;result:DashboardHealthResult}[]=[];
 dashboardHealthLog.slice().reverse().forEach(run=>run.results.filter(r=>!r.ok).forEach(result=>failures.push({time:run.time,result})));
 const shown=failures.filter(f=>dashMatching(f.result.service+' '+(f.result.error||''))).slice(0,10);
 const incidents='<section class="panel">'+dashPanelHead('Failed checks','Most recent first')+'<div class="incident-list">'+(shown.length?shown.map(f=>'<article class="incident-row"><div class="incident-top"><strong>'+de(f.result.service)+' check failed</strong>'+ds('Down')+'</div><small>'+dtime(f.time)+'</small><p>'+de(f.result.error||'No details were recorded.')+'</p></article>').join(''):dashEmpty('No failed checks','Every recorded check passed.'))+'</div></section>';
 return '<div class="metric-grid">'+dashMetric('Checks passed',summary.uptime,'pulse',summary.runs?'Across the last '+dashPlural(summary.runs,'run'):'No checks yet')+dashMetric('Average response',summary.average===null?'–':dashLatency(summary.average),'clock','Web application, across recorded checks')+dashMetric('Failure rate',summary.errorRate,'flag',dashPlural(summary.failures,'failed check')+' recorded')+dashMetric('Services down',String(summary.down.length),'bell',summary.down.length?summary.down.map(r=>r.service).join(', '):'All checked services are up')+'</div><div class="split">'+dashHealthChart()+dashServicesPanel()+'</div><div class="split">'+dashHardwareChart()+dashServerPanel()+'</div>'+incidents;
}

/* ---------- Admin: activity log ---------- */
// type: [label, tone, filter]. Red ('flag') marks what may be suspicious; admin actions are dark.
const dashActivityTypes:Record<string,[string,string,string]>={
 'signin':['Signed in','ok','Sign-ins'],
 'signin-failed':['Failed sign-in','flag','Sign-ins'],
 'signin-blocked':['Blocked sign-in','flag','Sign-ins'],
 'signin-waiting':['Sign-in before approval','muted','Sign-ins'],
 'signout':['Signed out','muted','Sign-ins'],
 'register':['Account created','ok','Accounts'],
 'password-changed':['Password changed','watch','Accounts'],
 'profile-updated':['Profile updated','muted','Accounts'],
 'order-placed':['Order placed','info','Orders'],
 'order-paid':['Payment completed','ok','Orders'],
 'order-updated':['Order updated','muted','Orders'],
 'order-cancelled':['Order cancelled','watch','Orders'],
 'listing-added':['Listing added','info','Listings'],
 'listing-edited':['Listing edited','muted','Listings'],
 'price-changed':['Price changed','watch','Listings'],
 'listing-paused':['Listing paused','muted','Listings'],
 'listing-resumed':['Listing resumed','muted','Listings'],
 'listing-removed':['Listing removed','watch','Listings'],
 'rating':['Order rated','muted','Reports'],
 'report-filed':['Report filed','watch','Reports'],
 'account-suspended':['Account suspended','admin','Admin'],
 'account-reactivated':['Account reactivated','admin','Admin'],
 'password-reset':['Password reset','admin','Admin'],
 'report-upheld':['Report upheld','admin','Admin'],
 'report-dismissed':['Report dismissed','admin','Admin'],
 'report-reopened':['Report reopened','admin','Admin'],
 'warning-given':['Warning given','admin','Admin'],
 'warning-withdrawn':['Warning withdrawn','admin','Admin'],
 'org-terminated':['Organization terminated','admin','Admin'],
 'application-approved':['Application approved','admin','Admin'],
 'application-declined':['Application declined','admin','Admin'],
};
const dashActivityInfo=(type:string):[string,string,string]=>dashActivityTypes[type]||[type,'muted','Other'];
const dashFlagged=(e:DashboardActivity)=>dashActivityInfo(e.type)[1]==='flag';
const dashActivityPill=(type:string)=>{const [label,tone]=dashActivityInfo(type);return '<span class="status act-'+tone+'">'+label+'</span>';};
const dashLocalDate=(iso:string)=>dashIsoDate(new Date(iso));
const dashTimeOnly=(iso:string)=>new Date(iso).toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'});
const dashFlaggedToday=()=>dashboardActivity.filter(e=>dashFlagged(e)&&dashLocalDate(e.time)===dashToday).length;
const dashRepeat=(count:number)=>count>1?'<span class="repeat-count">×'+count+'</span>':'';
interface DashActivityGroup{first:DashboardActivity;last:DashboardActivity;count:number}
// Back-to-back repeats of one event by one account show as a single row with a count.
function dashGroupActivity(events:DashboardActivity[]):DashActivityGroup[]{
 const groups:DashActivityGroup[]=[];
 events.forEach(e=>{const g=groups[groups.length-1];if(g&&g.first.actor===e.actor&&g.first.type===e.type&&g.first.detail===e.detail){g.count++;g.last=e;}else groups.push({first:e,last:e,count:1});});
 return groups;
}
const dashActivitySorted=()=>dashboardActivity.slice().sort((a,b)=>b.time.localeCompare(a.time));
function dashActivityList():DashboardActivity[]{
 const f=dashState.filter;
 return dashActivitySorted().filter(e=>{
  const [label,,group]=dashActivityInfo(e.type);
  return dashMatching([e.actor,dashAccountByEmail(e.actor)?.name||'',label,e.detail].join(' '))&&(f==='All'||(f==='Flagged'?dashFlagged(e):group===f));
 });
}
function dashActivityView():string{
 const today=dashboardActivity.filter(e=>dashLocalDate(e.time)===dashToday);
 const n=(test:(e:DashboardActivity)=>boolean)=>String(today.filter(test).length);
 const metrics='<div class="metric-grid">'+dashMetric('Events today',String(today.length),'eye','')+dashMetric('Failed sign-ins today',n(e=>e.type==='signin-failed'),'lock','')+dashMetric('Blocked sign-ins today',n(e=>e.type==='signin-blocked'),'flag','')+dashMetric('Admin actions today',n(e=>dashActivityInfo(e.type)[2]==='Admin'),'shield','')+'</div>';
 const events=dashActivityList();
 const rows=dashGroupActivity(events).map(g=>{
  const e=g.first;const who=dashAccountByEmail(e.actor);
  const when=g.count>1?dashTimeOnly(g.last.time)+' – '+dashTimeOnly(e.time):dashTimeOnly(e.time);
  const person=who?'<div class="table-product">'+dashAvatar(who,who.name,dashLookKind(who.role))+'<div><strong>'+de(who.name)+'</strong><small>'+de(who.email)+'</small></div></div>':'<div class="table-product"><span class="avatar unknown-avatar">?</span><div><strong>'+de(e.actor)+'</strong><small>No account</small></div></div>';
  return '<tr'+(dashFlagged(e)?' class="flagged-row"':'')+'><td><strong>'+when+'</strong><small class="cell-note">'+dd(dashLocalDate(e.time))+'</small></td><td>'+person+'</td><td>'+dashActivityPill(e.type)+dashRepeat(g.count)+'</td><td class="wrap">'+de(e.detail)+'</td><td><div class="row-actions">'+(who?'<button class="control small" data-account="'+de(who.email)+'">View</button>':'')+'</div></td></tr>';
 }).join('');
 const table=events.length?'<table class="activity-table"><thead><tr><th scope="col">Time</th><th scope="col">Account</th><th scope="col">Activity</th><th scope="col">Details</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>'+rows+'</tbody></table>':dashEmpty(dashboardActivity.length?'No matching activity':'No activity yet',dashboardActivity.length?'Try another search or filter.':'Sign-ins, orders and changes appear here.');
 return metrics+'<section class="panel">'+dashPanelHead('Activity','')+dashFilters(['All','Flagged','Sign-ins','Accounts','Orders','Listings','Reports','Admin'],dashPlural(events.length,'event'),'Search activity')+'<div class="table-wrap">'+table+'</div></section>';
}
// The latest events by or about one account, for its pop-up.
function dashAccountActivity(email:string):string{
 const groups=dashGroupActivity(dashActivitySorted().filter(e=>e.actor===email||e.target===email)).slice(0,6);
 if(!groups.length)return '';
 return '<h3 class="detail-section">Recent activity</h3><div class="activity-list">'+groups.map(g=>'<div class="activity-row'+(dashFlagged(g.first)?' flagged':'')+'">'+dashActivityPill(g.first.type)+dashRepeat(g.count)+'<span class="activity-detail">'+de(g.first.detail)+'</span><small>'+dtime(g.first.time)+'</small></div>').join('')+'</div>';
}

/* ---------- Organization: one farmer organization's own workspace ---------- */
function dashOrgOverview():string{
 const p=dashOrgPeriod();
 const orders=dashRoleOrders();const crops=dashRoleCrops();
 const open=orders.filter(o=>dashNextStep[o.status]);
 const [valueTrend,valueDown]=dashTrend(p.value,p.previousValue);
 const [orderTrend,orderDown]=dashTrend(p.orders,p.previousOrders);
 const span=dashState.period==='week'?'previous 7 days':'previous 4 weeks';
 const metrics='<div class="metric-grid">'+dashMetric('Order value',dp(p.value),'wallet',p.previousValue?'Compared with the '+span:'Placed with your organization',valueTrend,valueDown)+dashMetric('Orders received',String(p.orders),'bag',p.previousOrders?'Compared with the '+span:dashState.period==='week'?'Last 7 days':'Last 4 weeks',orderTrend,orderDown)+dashMetric('Orders to fulfil',String(open.length),'clock','Waiting on your next step')+dashMetric('Active listings',String(crops.filter(c=>dashIsBuyable(c)).length),'box',dashPlural(crops.length,'listing')+' in total')+'</div>';
 const queue='<section class="panel">'+dashPanelHead('Needs your action','Orders waiting on your next step','<button class="text-button" data-go="orders">All orders '+di('arrow')+'</button>')+'<div class="queue">'+(open.length?open.slice(0,4).map(o=>'<div class="queue-row"><img src="'+dashImg(o.image)+'" alt=""><div><strong>'+de(o.crop)+' · '+de(o.quantity)+'</strong><small>'+dashOrderNo(o.id)+' · '+de(o.customer)+' · '+dp(o.total)+'</small><div class="queue-actions">'+ds(o.status)+'<button class="control small primary" data-advance="'+o.id+'">'+dashNextStep[o.status][1]+'</button></div></div></div>').join(''):dashEmpty('All caught up','No orders are waiting on you.'))+'</div></section>';
 const stock='<section class="panel">'+dashPanelHead('Stock watch','Lowest stock first','<button class="text-button" data-go="listings">Manage '+di('arrow')+'</button>')+'<div class="stock-list">'+(crops.length?crops.slice().sort((a,b)=>a.stock-b.stock).slice(0,4).map(c=>'<div class="stock-row"><img src="'+dashImg(c.image)+'" alt=""><div><div class="stock-row-top"><strong>'+de(c.name)+'</strong>'+ds(dashCropStatus(c))+'</div><div class="meter" role="img" aria-label="'+c.stock+' '+de(c.unit)+' available"><i style="width:'+Math.min(100,Math.round(c.stock/150*100))+'%"></i></div><small>'+c.stock+' '+de(c.unit)+' available</small></div></div>').join(''):dashEmpty('No listings yet','Add your first crop listing.'))+'</div></section>';
 return dashWarningCallout()+metrics+'<div class="split">'+dashChart(p,'Placed order totals for your organization','Orders placed with your organization')+queue+'</div><div class="split">'+dashOrderTable('recent')+stock+'</div>';
}
function dashListingCrops():DashboardCrop[]{return dashRoleCrops().filter(c=>dashMatching(c.name+' '+c.organization+' '+c.category));}
function dashListingTile(c:DashboardCrop):string{
 return '<article class="product-tile"><img src="'+dashImg(c.image)+'" alt="'+de(c.name)+'"><div class="product-tile-copy"><div class="product-tile-head"><h2>'+de(c.name)+'</h2>'+ds(dashCropStatus(c))+'</div><p>'+de(c.category)+' · '+c.id+'</p><div class="product-price"><strong>'+dp(c.price)+'</strong> / '+de(c.unit)+'</div>'+dashHarvestLine(c,true)+'<div class="product-bottom"><small>'+c.stock+' '+de(c.unit)+' available</small><span class="row-actions"><button class="control small" data-toggle-listing="'+c.id+'"'+(c.stock===0?' disabled':'')+'>'+(c.status==='Active'?'Pause':'Resume')+'</button><button class="control small" data-edit-listing="'+c.id+'">'+di('edit')+'Edit</button><button class="control small primary" data-product="'+c.id+'">Details</button></span></div></div></article>';
}
function dashListingGrid():string{
 const crops=dashListingCrops();
 if(crops.length)return '<div class="product-grid">'+crops.map(dashListingTile).join('')+'</div>';
 return '<section class="panel">'+(dashRoleCrops().length?dashEmpty('No matching listings.','Try a different search.'):dashEmpty('No listings yet','Add a crop listing so buyers can find your harvest.')+'<div class="empty-action"><button class="control primary" data-add-listing>'+di('plus')+'Add listing</button></div>')+'</section>';
}
function dashOrgFeedbackList():DashboardFeedback[]{
 return dashboardFeedback.filter(f=>f.organization===dashOrgName&&dashMatching(f.customer+' '+f.comment+' '+f.rating)).sort((a,b)=>b.date.localeCompare(a.date));
}
function dashFeedbackRow(f:DashboardFeedback):string{
 return '<article class="feedback-row"><header>'+dashStars(f.rating)+'<small>'+dd(f.date)+'</small></header><p>'+(f.comment?'“'+de(f.comment)+'”':'No comment left.')+'</p><small>'+dashUserLink(f.customer)+(f.order?' · order '+dashOrderNo(f.order):'')+'</small></article>';
}
function dashOrgFeedback():string{
 const r=dashRatingOf(dashOrgName);
 const s=dashStanding(dashOrgName);
 const feedback=dashOrgFeedbackList();
 const reports=dashboardReports.filter(x=>x.organization===dashOrgName).sort((a,b)=>b.date.localeCompare(a.date));
 const count=(status:string)=>reports.filter(x=>x.status===status).length;
 const metrics='<div class="metric-grid">'+dashMetric('Average rating',r.reviews?r.rating.toFixed(1)+' ★':'–','star','From '+dashPlural(r.reviews,'buyer review'))+dashMetric('Reports under review',String(count('Open')),'clock','')+dashMetric('Upheld reports',String(count('Upheld')),'flag','')+dashMetric('Warnings',s.terminated?'Terminated':s.count+'<small class="metric-unit">/'+dashWarningLimit+'</small>','shield','')+'</div>';
 const list='<section class="panel">'+dashPanelHead('Buyer feedback','Newest first','<span class="filter-summary">'+dashPlural(feedback.length,'review')+'</span>')+'<div class="feedback-list">'+(feedback.length?feedback.map(dashFeedbackRow).join(''):dashEmpty(r.reviews?'No matching feedback':'No ratings yet',r.reviews?'Try a different search.':'Buyers can rate their orders once you complete them.'))+'</div></section>';
 const warnings='<section class="panel">'+dashPanelHead('Warnings from AniBayan',s.label)+'<div class="warning-box">'+dashWarningMeter(dashOrgName)+'</div>'+(s.count?dashWarningRows(dashOrgName,'feedback-list',false):'')+'</section>';
 const table=reports.length?'<table><thead><tr><th scope="col">Report</th><th scope="col">Reason</th><th scope="col">Details</th><th scope="col">Status</th></tr></thead><tbody>'+reports.map(x=>'<tr><td><strong>'+x.id+'</strong><small class="cell-note">'+dfull(x.date)+'</small></td><td>'+de(x.reason)+'</td><td class="wrap">'+de(x.details)+'</td><td>'+ds(x.status)+'</td></tr>').join('')+'</tbody></table>':dashEmpty('No reports','Buyers haven’t reported a problem with your organization.');
 return metrics+'<div class="split">'+list+warnings+'</div><section class="panel">'+dashPanelHead('Reports about your organization','Reviewed by AniBayan administrators')+'<div class="table-wrap">'+table+'</div></section>';
}
const dashMyMembers=()=>dashboardMembers.filter(m=>m.organization===dashOrgName);
function dashMembers():string{
 const all=dashMyMembers();
 const members=all.filter(m=>dashMatching([m.name,m.place,m.crops,m.status].join(' ')));
 const area=all.reduce((sum,m)=>sum+m.area,0);
 const actions=(m:DashboardMember)=>'<div class="row-actions">'+(m.status==='Pending'?'<button class="control small primary" data-member-confirm="'+m.id+'">'+di('check')+'Confirm</button>':'')+'<button class="control small" data-member-remove="'+m.id+'">Remove</button></div>';
 return '<div class="metric-grid three">'+dashMetric('Member farmers',String(all.length),'people','Growers supplying your organization')+dashMetric('Farmed area',area.toFixed(1)+' ha','pin','Across all member farms')+dashMetric('Pending membership',String(all.filter(m=>m.status==='Pending').length),'clock','Awaiting your confirmation')+'</div><section class="panel">'+dashPanelHead('Members','','<span class="filter-summary">'+dashPlural(members.length,'member')+'</span>')+'<div class="table-wrap">'+(members.length?'<table><thead><tr><th scope="col">Farmer</th><th scope="col">Barangay</th><th scope="col">Crops</th><th scope="col">Area</th><th scope="col">Member since</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>'+members.map(m=>'<tr><td><div class="table-product"><span class="avatar organization-avatar">'+dashInitials(m.name)+'</span><strong>'+de(m.name)+'</strong></div></td><td>'+de(m.place)+'</td><td>'+de(m.crops)+'</td><td>'+m.area.toFixed(1)+' ha</td><td>'+de(m.joined)+'</td><td>'+ds(m.status)+'</td><td>'+actions(m)+'</td></tr>').join('')+'</tbody></table>':dashEmpty(all.length?'No matching members':'No member farmers yet',all.length?'Try a different name, place or crop.':'Add the farmers who supply your organization.'))+'</div></section>';
}
function dashOrgPayments():string{
 const orders=dashRoleOrders().filter(o=>o.status!=='Cancelled');
 const sum=(payment:string)=>orders.filter(o=>o.payment===payment).reduce((total,o)=>total+o.total,0);
 return '<div class="metric-grid three">'+dashMetric('Paid orders',dp(sum('Paid')),'check',dashPlural(orders.filter(o=>o.payment==='Paid').length,'order')+' paid')+dashMetric('Awaiting payment',dp(sum('Unpaid')),'clock',dashPlural(orders.filter(o=>o.payment==='Unpaid').length,'order')+' unpaid')+dashMetric('Open orders',String(orders.filter(o=>o.status!=='Completed').length),'bag','Not yet completed')+'</div>'+dashOrderTable('payments');
}

/* ---------- Consumer: shop, cart, saved harvests and growers ---------- */
const dashShopCrops=()=>dashboardCrops.filter(dashIsBuyable);
const dashShopSorts:Record<string,[string,(a:DashboardCrop,b:DashboardCrop)=>number]>={
 fresh:['Freshest harvest first',(a,b)=>dashFreshness(a).age-dashFreshness(b).age],
 'price-asc':['Price: low to high',(a,b)=>a.price-b.price],
 'price-desc':['Price: high to low',(a,b)=>b.price-a.price],
 rating:['Highest rated',(a,b)=>dashRatingOf(b.organization).rating-dashRatingOf(a.organization).rating],
 shelf:['Longest shelf life left',(a,b)=>dashFreshness(b).left-dashFreshness(a).left],
};
const dashHarvestWindows:string[][]=[['any','Any harvest date'],['3','Harvested in the last 3 days'],['7','Harvested in the last 7 days'],['30','Harvested in the last 30 days']];
function dashPriceBounds():(number|null)[]{
 const read=(value:string)=>value.trim()===''||!Number.isFinite(Number(value))?null:Number(value);
 return [read(dashState.shop.min),read(dashState.shop.max)];
}
function dashShopList():DashboardCrop[]{
 const s=dashState.shop;const [min,max]=dashPriceBounds();
 return dashShopCrops().filter(c=>dashMatching(c.name+' '+c.organization+' '+c.category+' '+dashRegion(c.organization))
  &&(s.type==='All'||c.category===s.type)
  &&(min===null||c.price>=min)&&(max===null||c.price<=max)
  &&(s.harvest==='any'||dashFreshness(c).age<=Number(s.harvest))
  &&(s.location==='All'||dashRegion(c.organization)===s.location))
  .sort((dashShopSorts[s.sort]||dashShopSorts.fresh)[1]);
}
// actions: the save, details and cart buttons, for the buyer pages only (profiles also show tiles to organizations and admins).
function dashConsumerTile(c:DashboardCrop,actions=true):string{
 const saved=dashIsSaved(c.id);
 const buyable=dashIsBuyable(c);
 const badge=buyable?dashFreshBadge(c):ds(c.stock===0?'Out of stock':c.status!=='Active'?'Paused':'Past shelf life');
 return '<article class="product-tile"><div class="product-media"><img src="'+dashImg(c.image)+'" alt="'+de(c.name)+'">'+badge+'</div><div class="product-tile-copy"><div class="product-tile-head"><h2>'+de(c.name)+'</h2>'+(actions?'<button class="save-button" data-save="'+c.id+'" aria-pressed="'+saved+'" aria-label="'+(saved?'Unsave ':'Save ')+de(c.name)+'">'+di('heart')+'</button>':'')+'</div><p>'+de(c.organization)+' · '+dashRatingText(c.organization)+'<br>'+de(c.category)+' · '+de(dashRegion(c.organization))+'</p><div class="product-price"><strong>'+dp(c.price)+'</strong> / '+de(c.unit)+'</div>'+dashHarvestLine(c)+(actions?'<div class="product-bottom"><span class="row-actions"><button class="control small" data-product="'+c.id+'">Details</button>'+(buyable?'<button class="control small primary" data-add-cart="'+c.id+'">'+di('cart')+'Add to cart</button>':'')+'</span></div>':'')+'</div></article>';
}
const dashShopSummary=(shown:number)=>shown+' of '+dashPlural(dashShopCrops().length,'harvest');
function dashShopGrid(crops:DashboardCrop[]):string{
 if(crops.length)return '<div class="product-grid">'+crops.map(c=>dashConsumerTile(c)).join('')+'</div>';
 const [min,max]=dashPriceBounds();
 const reversed=min!==null&&max!==null&&min>max;
 const unavailable=dashState.query.trim()?dashboardCrops.filter(c=>!dashIsBuyable(c)&&dashMatching(c.name+' '+c.organization+' '+c.category)):[];
 const description=reversed?'Swap the two prices or clear one of them.':unavailable.length?unavailable.map(c=>c.name+' is '+(c.stock===0?'out of stock':c.status!=='Active'?'paused by its grower':'past its shelf life')).join('. ')+' right now.':'Try a wider price range, another crop type, harvest time or location.';
 return '<section class="panel">'+dashEmpty(reversed?'The minimum price is higher than the maximum.':'No harvests match these filters.',de(description))+'<div class="empty-action"><button class="control" data-shop-reset>Clear filters</button></div></section>';
}
// The banner over the shop: what's on offer and quick crop-type buttons.
function dashShopHero():string{
 const crops=dashShopCrops();
 if(!crops.length)return '';
 const types=[...new Set(crops.map(c=>c.category))].sort();
 return '<section class="shop-hero"><div class="shop-hero-copy"><h2>Fresh from the field this week.</h2><p class="shop-hero-stats"><span><b>'+crops.length+'</b> harvests</span><span><b>'+new Set(crops.map(c=>c.organization)).size+'</b> growing communities</span><span>from <b>'+dp(Math.min(...crops.map(c=>c.price)))+'</b></span></p><div class="shop-hero-chips">'+types.map(t=>'<button class="hero-chip" data-shop-type="'+de(t)+'" aria-pressed="'+(dashState.shop.type===t)+'">'+de(t)+'</button>').join('')+'</div></div></section>';
}
function dashShop():string{
 const s=dashState.shop;
 const crops=dashShopList();
 const prices=dashShopCrops().map(c=>c.price);
 const opt=(value:string,label:string,current:string)=>'<option value="'+de(value)+'"'+(value===current?' selected':'')+'>'+de(label)+'</option>';
 const types=[...new Set(dashboardCrops.map(c=>c.category))].sort();
 const regions=[...new Set(dashboardOrganizations.filter(o=>o.status==='Active').map(o=>o.region))].sort();
 const price=(key:'min'|'max',label:string,bound:number)=>'<input type="number" min="0" step="1" inputmode="numeric" data-shop="'+key+'" value="'+de(s[key])+'" placeholder="'+label+' '+bound+'" aria-label="'+(key==='min'?'Minimum':'Maximum')+' price in pesos">';
 return dashShopHero()+'<section class="panel shop-filters" aria-label="Filter harvests"><div class="shop-filter-grid">'
  +'<label class="shop-field"><span>Crop type</span><select data-shop="type">'+opt('All','All crop types',s.type)+types.map(t=>opt(t,t,s.type)).join('')+'</select></label>'
  +'<div class="shop-field" role="group" aria-labelledby="shop-price-label"><span id="shop-price-label">Price per unit (₱)</span><div class="price-inputs">'+price('min','Min',prices.length?Math.min(...prices):0)+'<span aria-hidden="true">–</span>'+price('max','Max',prices.length?Math.max(...prices):0)+'</div></div>'
  +'<label class="shop-field"><span>Harvest time</span><select data-shop="harvest">'+dashHarvestWindows.map(w=>opt(w[0],w[1],s.harvest)).join('')+'</select></label>'
  +'<label class="shop-field"><span>Location</span><select data-shop="location">'+opt('All','All locations',s.location)+regions.map(r=>opt(r,r,s.location)).join('')+'</select></label>'
  +'<label class="shop-field"><span>Sort by</span><select data-shop="sort">'+Object.keys(dashShopSorts).map(k=>opt(k,dashShopSorts[k][0],s.sort)).join('')+'</select></label>'
  +'</div><div class="shop-filter-foot"><span class="filter-summary" id="shop-summary" aria-live="polite">'+dashShopSummary(crops.length)+'</span><button class="text-button" data-shop-reset>Clear filters</button></div></section><div id="shop-results">'+dashShopGrid(crops)+'</div>';
}
// Typing in a price box re-renders only the results, so the field keeps focus.
function dashRefreshShop():void{
 const results=document.getElementById('shop-results');
 if(!results)return;
 const crops=dashShopList();
 results.innerHTML=dashShopGrid(crops);
 document.getElementById('shop-summary')!.textContent=dashShopSummary(crops.length);
}
function dashAddToCart(id:string,quantity:number):void{
 if(!dashRequireBuyer())return;
 const crop=dashboardCrops.find(c=>c.id===id);
 if(!crop||!dashIsBuyable(crop)){dashToast('This harvest isn’t available right now.');return;}
 const cart=dashCart();const line=cart.find(l=>l.crop===id);
 const room=crop.stock-(line?line.quantity:0);
 if(room<=0){dashToast('Your cart already has all '+crop.stock+' '+crop.unit+' of '+crop.name+'.');return;}
 const amount=Math.max(1,Math.min(Math.floor(quantity)||1,room));
 if(line)line.quantity+=amount;else cart.push({crop:id,quantity:amount});
 dashRender();
 dashToast(amount+' '+crop.unit+' of '+crop.name+' added to your cart.'+(amount<quantity?' That’s all the stock left.':''));
}
function dashCartView():string{
 const entries=dashCartEntries();
 if(!entries.length)return '<section class="panel">'+dashEmpty('Your cart is empty.','Add harvests from the shop to order them.')+'<div class="empty-action"><button class="control primary" data-go="shop">'+di('store')+'Shop the harvest</button></div></section>';
 const orgs=[...new Set(entries.map(e=>e.crop.organization))];
 const row=(e:DashCartEntry)=>{
  const problem=dashCartProblem(e);
  return '<div class="cart-row"><img src="'+dashImg(e.crop.image)+'" alt=""><div class="cart-row-copy"><strong>'+de(e.crop.name)+'</strong><small>'+dp(e.crop.price)+' / '+de(e.crop.unit)+' · harvested '+dd(e.crop.harvested)+'</small>'+(problem?'<small class="cart-problem">'+de(problem)+'</small>':'')+'</div><div class="qty-stepper" role="group" aria-label="Quantity of '+de(e.crop.name)+'"><button class="qty-button" data-cart-step="'+e.crop.id+'" data-step="-1" aria-label="One less"'+(e.line.quantity<=1?' disabled':'')+'>−</button><span>'+e.line.quantity+' '+de(e.crop.unit)+'</span><button class="qty-button" data-cart-step="'+e.crop.id+'" data-step="1" aria-label="One more"'+(e.line.quantity>=e.crop.stock?' disabled':'')+'>+</button></div><strong class="cart-line-total">'+dp(e.line.quantity*e.crop.price)+'</strong><button class="table-action" data-cart-remove="'+e.crop.id+'" aria-label="Remove '+de(e.crop.name)+' from your cart">×</button></div>';
 };
 const subtotal=(org:string)=>entries.filter(e=>e.crop.organization===org).reduce((sum,e)=>sum+e.line.quantity*e.crop.price,0);
 const total=orgs.reduce((sum,org)=>sum+subtotal(org),0);
 const problems=entries.filter(e=>dashCartProblem(e)).length;
 const list='<section class="panel">'+dashPanelHead('Items',dashPlural(entries.length,'harvest')+' from '+dashPlural(orgs.length,'organization'),'<button class="text-button" data-cart-clear>Clear cart</button>')+'<div class="cart-list">'+orgs.map(org=>'<div class="cart-group"><div class="cart-group-head"><strong>'+de(org)+'</strong></div>'+entries.filter(e=>e.crop.organization===org).map(row).join('')+'</div>').join('')+'</div></section>';
 const summary='<section class="panel cart-summary">'+dashPanelHead('Order summary','')+'<dl class="summary-lines">'+orgs.map(org=>'<div><dt>'+de(org)+'</dt><dd>'+dp(subtotal(org))+'</dd></div>').join('')+'<div class="summary-total"><dt>Total</dt><dd>'+dp(total)+'</dd></div></dl><p class="summary-note">'+(orgs.length>1?'You’ll place '+orgs.length+' orders, one with each organization.':'Your order goes straight to '+de(orgs[0])+'.')+' Delivery is arranged with each organization.</p>'+(problems?'<p class="cart-problem summary-problem">Remove or update '+dashPlural(problems,'item')+' before checking out.</p>':'')+'<div class="summary-actions"><button class="control primary" data-checkout'+(problems?' disabled':'')+'>Check out '+di('arrow')+'</button></div></section>';
 return '<div class="split cart-split">'+list+summary+'</div>';
}
function dashSavedView():string{
 const crops=dashboardCrops.filter(c=>dashIsSaved(c.id)&&dashMatching(c.name+' '+c.organization+' '+c.category));
 return '<div class="filters bare"><button class="text-button" data-go="shop">Browse the shop '+di('arrow')+'</button><span class="filter-summary">'+dashPlural(dashSavedList().length,'saved harvest')+'</span></div>'+(crops.length?'<div class="product-grid">'+crops.map(c=>dashConsumerTile(c)).join('')+'</div>':'<section class="panel">'+dashEmpty('No saved harvests here yet.','Save a harvest from the shop to see it here.')+'</section>');
}
function dashOrganizationGrid():string{
 const orgs=dashboardOrganizations.filter(o=>o.status==='Active'&&dashMatching(o.name+' '+o.region+' '+o.crop));
 return orgs.length?'<div class="org-grid">'+orgs.map(o=>'<article class="org-card"><img src="'+dashImg(o.image)+'" alt="'+de(o.name)+'"><div><h2>'+de(o.name)+'</h2><p>'+de(o.region)+' · '+de(o.crop)+'</p><p class="org-rating">'+dashRatingText(o.name)+'</p><footer><span class="filter-summary">'+dashPlural(dashListingCount(o.name),'listing')+'</span><a class="control" href="#org='+dashSlug(o.name)+'" data-profile-link>View community '+di('up')+'</a></footer></div></article>').join('')+'</div>':'<section class="panel">'+dashEmpty('No matching communities','Try a different place or name.')+'</section>';
}
function dashActiveOrder():string{
 const order=dashRoleOrders().find(o=>!['Completed','Cancelled'].includes(o.status));
 if(!order)return '<section class="panel">'+dashPanelHead('Nothing on its way right now.','')+'<div class="active-order"><div class="active-order-foot"><p>Fresh harvests are waiting in the shop.<br>Your next order will show up here.</p><button class="control primary" data-go="shop">Shop the harvest '+di('arrow')+'</button></div></div></section>';
 const step=['Pending','Confirmed','Processing','Completed'].indexOf(order.status);
 const message=order.status==='Pending'?'Waiting for your grower to confirm your order.':order.status==='Confirmed'?'Your grower confirmed your order.':'Your grower is preparing your order.';
 return '<section class="panel">'+dashPanelHead('Your harvest is coming together.','','<span class="filter-summary">'+dashOrderNo(order.id)+'</span>')+'<div class="active-order"><div class="active-order-top"><img src="'+dashImg(order.image)+'" alt="'+de(order.crop)+'"><div><h3>'+de(order.crop)+'</h3><p>'+de(order.organization)+' · '+de(order.quantity)+'</p></div>'+ds(order.status)+'</div><div class="order-progress">'+['Placed','Confirmed','Preparing','Completed'].map((s,i)=>'<div class="progress-step '+(i<step?'done':i===step?'current':'')+'"><i></i>'+s+'</div>').join('')+'</div><div class="active-order-foot"><p>Good things take a little care.<br>'+message+'</p><button class="control primary" data-order="'+order.id+'">View order '+di('arrow')+'</button></div></div></section>';
}
function dashConsumerOverview():string{
 const own=dashRoleOrders();
 const saved=dashboardCrops.filter(c=>dashIsSaved(c.id));
 return '<section class="consumer-banner"><div class="eyebrow">Rooted in community. Grown for you.</div><h2>Fresh from their fields.<br>A little closer to your table.</h2><p>Meet the people behind your everyday food.</p><button class="control primary" data-go="shop">Explore the harvest '+di('arrow')+'</button><img class="banner-harvest" src="assets/vegetable-cutout.png" alt=""><img class="banner-leaf" src="assets/mango-branch.png" alt=""></section><div class="metric-grid">'+dashMetric('Active orders',String(own.filter(o=>!['Completed','Cancelled'].includes(o.status)).length),'bag','Being prepared by your growers')+dashMetric('Completed orders',String(own.filter(o=>o.status==='Completed').length),'check','Local harvests brought home')+dashMetric('Saved harvests',String(saved.length),'heart','Good things to come back to')+dashMetric('Growing connections',String(new Set(own.map(o=>o.organization)).size),'leaf','Communities you’ve ordered from')+'</div><div class="split">'+dashActiveOrder()+'<section class="panel grower-mini"><img src="assets/grower.png" alt="A vegetable grower at work"><div class="grower-mini-copy"><small>The people behind your harvest</small><h2>Rooted in<br>Calapan City.</h2><a href="#growers">Meet your growing community '+di('up')+'</a></div></section></div><div class="split">'+dashOrderTable('recent')+'<section class="panel">'+dashPanelHead('Saved for later','','<button class="text-button" data-go="saved">View all '+di('arrow')+'</button>')+'<div class="saved-mini">'+saved.slice(0,4).map(c=>'<div class="saved-row"><img src="'+dashImg(c.image)+'" alt=""><div><strong>'+de(c.name)+'</strong><p>'+dp(c.price)+' / '+de(c.unit)+' · harvested '+dd(c.harvested)+'</p></div><button class="save-button" data-save="'+c.id+'" aria-pressed="true" aria-label="Unsave '+de(c.name)+'">'+di('heart')+'</button></div>').join('')+(saved.length?'':dashEmpty('Nothing saved yet','Your saved harvests will appear here.'))+'</div></section></div>';
}
function dashSettings():string{
 const appearance='<section class="panel settings-panel"><h2>Appearance</h2><p>Adjust the dashboard to your preferred reading density. Saved in this browser.</p><div class="settings-row"><label for="density">Compact table rows</label><input type="checkbox" id="density" '+(document.body.classList.contains('compact-density')?'checked':'')+'></div><div class="settings-row"><label for="contrast">Stronger contrast</label><input type="checkbox" id="contrast" '+(document.body.classList.contains('contrast-mode')?'checked':'')+'></div><h2 class="settings-subhead">Data</h2><p>AniBayan keeps its accounts, listings, orders, ratings and reports in this browser, shared by every AniBayan page you open here.</p><div class="detail-actions"><button class="control danger" data-reset-data>Reset all data</button></div></section>';
 const facts=(rows:string[][])=>'<dl class="detail-facts">'+rows.map(r=>'<div><dt>'+r[0]+'</dt><dd>'+de(r[1])+'</dd></div>').join('')+'</dl>';
 const me=dashAccount();
 const common='<a class="control" href="login.html" data-sign-out>'+di('logout')+'Sign out</a><button class="control" data-change-password>'+di('key')+'Change password</button>';
 let account='';
 if(isAdminDashboard)account='<section class="panel settings-panel"><h2>Administrator account</h2>'+facts([['Name',me.name],['Email',me.email],['Role','Platform administrator'],['Administrator since',dmonth(me.joined)]])+'<div class="detail-actions">'+common+'</div></section>';
 else if(isOrgDashboard){
  const o=dashOrgProfile();
  account='<section class="panel settings-panel"><h2>'+de(o.name)+'</h2><p>'+ds('Active')+' &nbsp;'+de(o.verified)+'</p>'+(o.description?'<p>'+de(o.description)+'</p>':'')+facts([['Location',o.region],['Main crops',o.crops],['Representative',o.representative],['Contact email',o.email],['Contact number',o.phone||'Not added yet'],['Warnings',dashStanding(o.name).label]])+'<div class="detail-actions">'+common+'<a class="control" href="consumer.html#org='+dashSlug(o.name)+'">View storefront '+di('up')+'</a><button class="control primary" data-edit-org-profile>'+di('edit')+'Edit profile</button></div></section>';
  const org=dashMyOrg();
  if(org)return dashOrgCard(org,'h2','<a class="control" href="#org='+dashSlug(org.name)+'" data-profile-link>'+di('user')+'View profile</a>')+'<div class="settings-grid">'+account+appearance+'</div>';
 }else{
  account='<section class="panel settings-panel"><h2>Your account</h2>'+facts([['Name',me.name],['Email',me.email],['Mobile number',me.phone||'Not added yet'],['Member since',dmonth(me.joined)],['Delivery address',me.address||'Not added yet']])+'<div class="detail-actions">'+common+'<button class="control primary" data-edit-profile>'+di('edit')+'Edit delivery details</button></div></section>';
  const p=dashPrivacy(me);
  const toggle=(key:keyof DashboardPrivacy,label:string)=>'<div class="settings-row"><label for="privacy-'+key+'">'+label+'</label><input type="checkbox" id="privacy-'+key+'" data-privacy="'+key+'"'+(p[key]?' checked':'')+(key!=='profile'&&!p.profile?' disabled':'')+'></div>';
  const privacy='<section class="panel settings-panel"><h2>Privacy</h2>'+toggle('profile','Public profile')+toggle('reviews','Show my reviews')+toggle('city','Show my city')+toggle('growers','Show the growers I buy from')+'</section>';
  return dashUserCard(me,'h2','<a class="control" href="#user='+dashSlug(me.name)+'" data-profile-link>'+di('user')+'View profile</a>',true)+'<div class="settings-grid">'+account+privacy+appearance+'</div>';
 }
 return '<div class="settings-grid">'+account+appearance+'</div>';
}
function dashHelp():string{
 const rows=isAdminDashboard?[['Suspend, reactivate or reset accounts','accounts','Accounts'],['Watch sign-ins and other activity','activity','Activity log'],['Uphold or dismiss buyer reports, and warn organizations','reports','User reports'],['Approve or decline organization applications','applications','Applications'],['Check that AniBayan’s services are up','health','Site health']]
  :isOrgDashboard?[['Confirm and prepare incoming orders','orders','Incoming orders'],['Add, edit or pause crop listings','listings','My listings'],['See your ratings and any warnings','feedback','Ratings & feedback'],['Add or confirm member farmers','members','Member farmers'],['Update your organization profile','settings','Organization profile']]
  :isGuest?[['Browse and filter harvests','shop','Shop'],['Meet the growing communities','growers','Growers']]
  :[['Browse and filter harvests','shop','Shop'],['Check out your cart','cart','Cart'],['Follow, pay, rate or report your orders','orders','My orders'],['Update your delivery details','settings','My profile']];
 return '<section class="panel settings-panel"><h2>Here to help you grow.</h2><p>Where to go for each task.</p>'+rows.map(r=>'<div class="settings-row"><span>'+r[0]+'</span><button class="control" data-go="'+r[1]+'">'+r[2]+' '+di('arrow')+'</button></div>').join('')+(isGuest?'<div class="settings-row"><span>Order harvests, save favourites and rate growers</span><a class="control primary" href="login.html" data-sign-in>Sign in '+di('arrow')+'</a></div>':'')+'</section>';
}
// Sidebar badges: open reports and pending applications for admins, orders needing attention otherwise, cart lines for buyers.
function dashNavCounts():Record<string,number>{
 if(isAdminDashboard)return {activity:dashFlaggedToday(),reports:dashOpenReports(),applications:dashPendingApplications()};
 const orders=dashRoleOrders();
 if(isOrgDashboard)return {orders:orders.filter(o=>o.status==='Pending').length,members:dashMyMembers().filter(m=>m.status==='Pending').length};
 return {orders:orders.filter(o=>!['Completed','Cancelled'].includes(o.status)).length,cart:dashCart().length};
}
let dashStorageWarned=false;
function dashRender():void{
 // A table's search box is redrawn with the table; keep the cursor in it, even when a health check finishes mid-typing.
 const typing=document.activeElement instanceof HTMLInputElement&&document.activeElement.dataset.tableSearch!==undefined?[document.activeElement.selectionStart??0,document.activeElement.selectionEnd??0]:null;
 const search=document.getElementById('dashboard-search') as HTMLInputElement;
 if(search.value!==dashState.query)search.value=dashState.query;
 // A grower's profile belongs under Growers; your own profile under your profile settings.
 const p=dashState.profile;
 const navView=dashState.view!=='profile'?dashState.view:p.kind==='org'?(isOrgDashboard&&dashMyOrg()&&dashSlug(dashOrgName)===p.slug?'settings':'growers'):(dashMe()&&dashSlug(dashMe()!.name)===p.slug?'settings':'');
 document.querySelectorAll<HTMLElement>('[data-nav]').forEach(a=>{if(a.dataset.nav===navView)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 document.querySelectorAll<HTMLElement>('[data-me-avatar]').forEach(el=>{el.outerHTML=dashShellAvatar();});
 const counts=dashNavCounts();
 document.querySelectorAll<HTMLElement>('[data-nav-count]').forEach(el=>{const count=counts[el.dataset.navCount!]||0;el.textContent=String(count);el.hidden=count===0;});
 dashRenderNotifications();
 const blocked=dashBlocked();
 const view=dashState.view;
 let content='';
 if(blocked.length)content='<section class="panel blocked-panel">'+di('lock')+'<h1>'+de(blocked[0])+'</h1><p>'+de(blocked[1])+'</p><div class="detail-actions"><a class="control" href="index.html">Back to homepage</a><a class="control primary" href="login.html" data-sign-out>Sign in with another account</a></div></section>';
 else if(view==='overview')content=isAdminDashboard?dashAdminOverview():isOrgDashboard?dashOrgOverview():dashConsumerOverview();
 else if(view==='accounts')content=dashAccountsView();
 else if(view==='reports')content=dashReportsView();
 else if(view==='applications')content=dashApplicationsView();
 else if(view==='health')content=dashHealthView();
 else if(view==='activity')content=dashActivityView();
 else if(view==='orders')content=dashOrderTable('all');
 else if(view==='listings')content=dashListingGrid();
 else if(view==='feedback')content=dashOrgFeedback();
 else if(view==='shop')content=dashShop();
 else if(view==='cart')content=dashCartView();
 else if(view==='saved')content=dashSavedView();
 else if(view==='growers')content=dashOrganizationGrid();
 else if(view==='members')content=dashMembers();
 else if(view==='payments')content=isOrgDashboard?dashOrgPayments():dashOrderTable('payments');
 else if(view==='settings')content=dashSettings();
 else if(view==='profile')content=p.kind==='org'?dashOrgProfileView(p.slug):dashUserProfileView(p.slug);
 else content=dashHelp();
 document.getElementById('dashboard-content')!.innerHTML=(blocked.length||view==='profile'?'':dashHeading())+content+'<footer class="design-note"><span>AniBayan · '+dashRole.workspace+'</span><span>'+(dashMe()?'Signed in as '+de(dashMe()!.email):'Browsing as a guest')+'</span></footer>';
 const box=typing?document.querySelector<HTMLInputElement>('[data-table-search]'):null;
 if(box&&typing){box.focus({preventScroll:true});box.setSelectionRange(typing[0],typing[1]);}
 dashShowReposition();
 if(!dashSaveStore()&&!dashStorageWarned){dashStorageWarned=true;dashToast('This browser couldn’t save your latest change. Its storage may be full or turned off.');}
}
function dashNavigate(view:string):void{if(location.hash.slice(1)===view)dashReadHash();else location.hash=view;}
function dashOpen(html:string):void{document.getElementById('detail-content')!.innerHTML=html;if(!dashDialog.open)dashDialog.showModal();}
function dashFocusField(selector:string):void{document.querySelector<HTMLElement>('#detail-content '+selector)?.focus();}
const dashFact=(label:string,value:string)=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>';

/* ---------- Detail dialogs ---------- */
function dashOrderDetails(id:string):void{
 const order=dashRoleOrders().find(o=>o.id===id);
 if(!order)return;
 const current=['Pending','Confirmed','Processing','Completed'].indexOf(order.status);
 const next=isOrgDashboard?dashNextStep[order.status]:undefined;
 let actions='<button class="control primary" data-close-dialog>Close</button>';
 let notes='';
 if(next)actions=(order.status==='Pending'?'<button class="control danger" data-decline="'+order.id+'">Decline order</button>':'')+'<button class="control primary" data-advance="'+order.id+'">'+next[1]+'</button>';
 if(isConsumerDashboard){
  const feedback=dashboardFeedback.find(f=>f.order===order.id);
  const report=dashMyReport(order.id);
  const canRate=order.status==='Completed'&&!feedback;
  const canPay=order.payment==='Unpaid'&&dashOnline(order)&&order.status!=='Cancelled';
  if(feedback)notes+='<p class="detail-note">You rated this order '+dashStars(feedback.rating)+(feedback.comment?' · “'+de(feedback.comment)+'”':'')+'</p>';
  if(report)notes+='<p class="detail-note">Your report '+report.id+' ('+de(report.reason.toLowerCase())+') is '+(report.status==='Open'?'under review':report.status.toLowerCase())+'.</p>';
  actions=(order.status==='Pending'?'<button class="control danger" data-cancel-order="'+order.id+'">Cancel order</button>':'')+(report?'':'<button class="control" data-report-order="'+order.id+'">'+di('flag')+'Report a problem</button>')+(canPay?'<button class="control primary" data-pay-order="'+order.id+'">Pay '+dp(order.total)+'</button>':canRate?'<button class="control primary" data-rate="'+order.id+'">'+di('star')+'Rate this order</button>':actions);
 }
 const items=order.items?'<h3 class="detail-section">Items</h3><dl class="summary-lines">'+order.items.map(i=>'<div><dt>'+de(i.name)+' · '+i.quantity+' '+de(i.unit)+'</dt><dd>'+dp(i.quantity*i.price)+'</dd></div>').join('')+'<div class="summary-total"><dt>Total</dt><dd>'+dp(order.total)+'</dd></div></dl>':'';
 const delivery=order.address?dashFact('Deliver to',de(order.address))+dashFact('Contact number',de(order.phone||''))+dashFact('Payment method',de(order.method||''))+(order.note?dashFact('Note',de(order.note)):''):'';
 const timeline=order.status==='Cancelled'?'<p class="detail-note">This order was cancelled and will not be fulfilled.</p>':'<ol class="timeline">'+['Order placed','Confirmed by grower','Harvest being prepared','Order completed'].map((s,i)=>'<li class="'+(i>current?'future':'')+'"><strong>'+s+'</strong><p>'+(i>current?'Not reached yet':i===current?'Current status':'Completed step')+'</p></li>').join('')+'</ol>';
 dashOpen('<p class="detail-kicker">'+(isOrgDashboard?'Incoming order':'Your order')+'</p><h2 id="detail-title">'+order.id+'</h2><p class="detail-subtitle">'+dashOrgLink(order.organization)+'</p><div class="detail-hero"><img src="'+dashImg(order.image)+'" alt="'+de(order.crop)+'"><div><h3>'+de(order.crop)+'</h3><p>'+de(order.quantity)+' · '+dp(order.total)+'</p></div></div><dl class="detail-facts">'+dashFact('Order status',ds(order.status))+dashFact('Payment',ds(order.payment))+dashFact('Placed on',dfull(order.date))+dashFact('Buyer',dashUserLink(order.customer))+delivery+'</dl>'+items+timeline+notes+'<div class="detail-actions">'+actions+'</div>');
}
function dashProductDetails(id:string):void{
 const crop=dashboardCrops.find(c=>c.id===id);
 if(!crop)return;
 const f=dashFreshness(crop);
 const harvest=dashFact('Harvested',dfull(crop.harvested)+' · '+dashAgeText(f.age))+dashFact('Shelf life',dashPlural(crop.shelfLife,'day')+' after harvest')+dashFact('Best before',dfull(dashAddDays(crop.harvested,crop.shelfLife)))+dashFact('Freshness',dashFreshBadge(crop));
 const hero=(note:string)=>'<div class="detail-hero"><img src="'+dashImg(crop.image)+'" alt="'+de(crop.name)+'"><div><h3>'+dp(crop.price)+' / '+de(crop.unit)+'</h3><p>'+note+'</p></div></div>';
 if(isOrgDashboard){
  dashOpen('<p class="detail-kicker">Product listing · '+crop.id+'</p><h2 id="detail-title">'+de(crop.name)+'</h2><p class="detail-subtitle">'+dashOrgLink(crop.organization)+'</p>'+hero(de(crop.category))+'<dl class="detail-facts">'+dashFact('Available quantity',crop.stock+' '+de(crop.unit))+dashFact('Listing status',ds(dashCropStatus(crop)))+harvest+'</dl><p class="detail-note">Buyers see the harvest date, shelf life and best-before date on this listing.</p><div class="detail-actions"><button class="control" data-toggle-listing="'+crop.id+'"'+(crop.stock===0?' disabled':'')+'>'+(crop.status==='Active'?'Pause listing':'Resume listing')+'</button><button class="control primary" data-edit-listing="'+crop.id+'">'+di('edit')+'Edit listing</button></div>');
  return;
 }
 const saved=dashIsSaved(crop.id);
 const buyable=dashIsBuyable(crop);
 const inCart=dashCart().find(l=>l.crop===crop.id);
 const buy=!buyable?'':isGuest?'<div class="qty-add"><p>Sign in with a buyer account to order this harvest.</p><a class="control primary" href="login.html" data-sign-in-buyer>Sign in to order '+di('arrow')+'</a></div>':'<div class="qty-add"><label for="detail-qty">Quantity ('+de(crop.unit)+')</label><input type="number" id="detail-qty" min="1" max="'+crop.stock+'" step="1" value="1" inputmode="numeric"><button class="control primary" data-add-cart="'+crop.id+'" data-qty-from="detail-qty">'+di('cart')+'Add to cart</button></div>';
 dashOpen('<p class="detail-kicker">Harvest listing</p><h2 id="detail-title">'+de(crop.name)+'</h2><p class="detail-subtitle">'+dashOrgLink(crop.organization)+' · '+de(dashRegion(crop.organization))+'</p>'+hero(de(crop.category)+' · '+(buyable?crop.stock+' '+de(crop.unit)+' available':'Not available right now'))+'<dl class="detail-facts">'+harvest+dashFact('Buyer rating',dashRatingText(crop.organization))+'</dl><p class="detail-note">The organization enters the harvest date when it lists a crop. Shelf life is its estimate for produce stored as recommended, so plan to use it before the best-before date.'+(inCart?' Your cart has '+inCart.quantity+' '+de(crop.unit)+'.':'')+'</p>'+buy+'<div class="detail-actions"><a class="control" href="#org='+dashSlug(crop.organization)+'" data-profile-link>About the grower</a>'+(isGuest?'':'<button class="control" data-save="'+crop.id+'" aria-pressed="'+saved+'">'+di('heart')+(saved?'Saved':'Save harvest')+'</button>')+(inCart?'<button class="control" data-go="cart">View cart '+di('arrow')+'</button>':'')+'</div>');
}
// Opens an organization's profile page, closing any open pop-up first.
function dashOpenOrgProfile(name:string):void{
 if(dashDialog.open)dashDialog.close();
 location.hash='org='+dashSlug(name);
}
function dashAccountDetails(email:string):void{
 const a=dashAccountByEmail(email);
 if(!a)return;
 const self=a.email===dashMeEmail;
 const org=a.organization?dashboardOrganizations.find(o=>o.name===a.organization):undefined;
 const toggle=!self&&a.role!=='Administrator'&&(a.status==='Active'||a.status==='Suspended')?(a.status==='Suspended'?'<button class="control primary" data-suspend="'+de(a.email)+'">'+di('check')+'Reactivate account</button>':'<button class="control danger" data-suspend="'+de(a.email)+'">'+di('lock')+'Suspend account</button>'):'';
 const review=a.status==='Pending'&&org?'<button class="control primary" data-organization="'+de(org.name)+'">Review application</button>':'';
 dashOpen('<p class="detail-kicker">'+(a.role==='Consumer'?'Buyer':a.role)+' account</p><h2 id="detail-title">'+de(a.name)+'</h2><p class="detail-subtitle">'+de(a.email)+'</p><dl class="detail-facts">'+dashFact('Role',a.role==='Consumer'?'Buyer':a.role)+dashFact('Status',ds(a.status))+dashFact('Joined',dfull(a.joined))+dashFact('Last active',dfull(a.lastActive))+(a.organization?dashFact('Organization',de(a.organization)):'')+(a.phone?dashFact('Mobile number',de(a.phone)):'')+(a.note?dashFact('Note',de(a.note)):'')+'</dl>'+dashAccountActivity(a.email)+'<div class="detail-actions">'+(a.role==='Administrator'?'':'<a class="control" href="#user='+dashSlug(a.name)+'" data-profile-link>'+di('user')+'View profile</a>')+(self?'':'<button class="control" data-reset-password="'+de(a.email)+'">'+di('key')+'Reset password</button>')+toggle+review+'</div>');
}
// Sets a new temporary password and shows it once so the administrator can pass it on.
function dashResetPassword(email:string):void{
 const a=dashAccountByEmail(email);
 if(!a)return;
 const chars='abcdefghjkmnpqrstuvwxyz23456789';const random=new Uint32Array(8);crypto.getRandomValues(random);
 const temporary='ab-'+Array.from(random,value=>chars[value%chars.length]).join('');
 a.password=temporary;
 dashLog('password-reset',dashMeEmail,a.name,a.email);
 dashRender();
 dashOpen('<p class="detail-kicker">Password reset</p><h2 id="detail-title">Temporary password for '+de(a.name)+'</h2><div class="temp-password"><code id="temp-password">'+temporary+'</code><button class="control small" data-copy="temp-password">Copy</button></div><div class="detail-actions"><button class="control" data-account="'+de(a.email)+'">Back to account</button><button class="control primary" data-close-dialog>Done</button></div>');
}
function dashReportDetails(id:string):void{
 const r=dashboardReports.find(x=>x.id===id);
 if(!r)return;
 const open=r.status==='Open';
 const s=dashStanding(r.organization);
 const reporter=dashboardAccounts.find(a=>a.name===r.customer);
 const effect=open?dashNextOffence(r.organization):r.status==='Upheld'?'Counts as one of its warnings':'No warning';
 const uphold=s.final?'<button class="control danger" data-terminate="'+de(r.organization)+'" data-terminate-report="'+r.id+'">'+di('lock')+'Uphold and terminate</button>':'<button class="control danger" data-decide="Upheld" data-report-id="'+r.id+'">'+di('flag')+'Uphold report</button>';
 const actions=open?'<button class="control" data-decide="Dismissed" data-report-id="'+r.id+'">Dismiss report</button>'+uphold:'<button class="control" data-decide="Open" data-report-id="'+r.id+'">Reopen report</button><button class="control primary" data-close-dialog>Close</button>';
 dashOpen('<p class="detail-kicker">User report · '+r.id+'</p><h2 id="detail-title">'+de(r.reason)+'</h2><p class="detail-subtitle">'+de(r.customer)+' about '+de(r.organization)+' · '+dfull(r.date)+'</p><blockquote class="report-quote">'+de(r.details)+'</blockquote><dl class="detail-facts">'+dashFact('Status',ds(r.status))+dashFact('Related order',r.order?dashOrderNo(r.order):'Not specified')+dashFact('Organization warnings',dashStandingBadge(r.organization)+' <button class="text-button" data-organization="'+de(r.organization)+'">View</button>')+dashFact(open?'If upheld':'Effect',effect)+(reporter?dashFact('Reporter account',ds(reporter.status)):'')+'</dl><div class="detail-actions">'+actions+'</div>');
}
function dashApplicationDetails(name:string):void{
 const o=dashboardOrganizations.find(x=>x.name===name);
 if(!o)return;
 const pending=o.status==='Pending review';
 const selling=o.status==='Active'||o.status==='Terminated';
 const s=dashStanding(o.name);
 const rep=dashboardAccounts.find(a=>a.organization===o.name);
 const warnings=selling?'<h3 class="detail-section">Warnings</h3><div class="warning-summary">'+dashStandingBadge(o.name)+dashWarningMeter(o.name)+'</div>'+(s.count?dashWarningRows(o.name,'feedback-list compact',!s.terminated):''):'';
 const actions=pending?'<button class="control danger" data-review="Declined" data-review-name="'+de(o.name)+'">Decline</button><button class="control primary" data-review="Active" data-review-name="'+de(o.name)+'">'+di('check')+'Approve organization</button>'
  :(o.status==='Active'?(s.final?'<button class="control danger" data-terminate="'+de(o.name)+'">'+di('lock')+'Terminate organization</button>':'<button class="control danger" data-warn="'+de(o.name)+'">'+di('flag')+'Give a warning</button>'):'')+'<button class="control primary" data-close-dialog>Close</button>';
 dashOpen('<p class="detail-kicker">'+(selling?'Organization':'Organization application')+'</p><h2 id="detail-title">'+de(o.name)+'</h2><p class="detail-subtitle">'+de(o.region)+' · submitted '+dfull(o.applied)+'</p><div class="detail-hero"><img src="'+dashImg(o.image)+'" alt="'+de(o.name)+'"><div><h3>'+de(o.crop)+'</h3><p>'+dashPlural(o.members,'member farmer')+' · '+ds(dashAppStatus(o))+'</p></div></div><dl class="detail-facts">'+dashFact('Representative',de(o.representative)+(rep?'<small class="fact-note">'+de(rep.email)+'</small>':''))+dashFact('Submitted documents',o.documents.map(de).join(', '))+(o.phone?dashFact('Contact number',de(o.phone)):'')+(o.approved?dashFact('Approved on',dfull(o.approved)):'')+(o.terminated?dashFact('Terminated on',dfull(o.terminated)):'')+(o.terminatedFor?dashFact('Final offence',de(o.terminatedFor)):'')+'</dl>'+warnings+'<div class="detail-actions">'+actions+'</div>');
}
function dashConfirmReset():void{
 dashOpen('<p class="detail-kicker">Data</p><h2 id="detail-title">Reset all AniBayan data?</h2><p class="detail-subtitle">Accounts, listings, orders, ratings and reports go back to the starting data, and you’re signed out on every AniBayan page in this browser.</p><div class="detail-actions"><button class="control" data-close-dialog>Cancel</button><button class="control danger" data-confirm-reset>Reset data</button></div>');
}
// Shown after checkout for card and GCash orders, and from "Pay now" on unpaid ones.
function dashPaymentDialog(ids:string[]):void{
 const orders=ids.map(id=>dashboardOrders.find(o=>o.id===id)).filter((o):o is DashboardOrder=>!!o&&o.payment==='Unpaid'&&o.status!=='Cancelled');
 if(!orders.length)return;
 const total=orders.reduce((sum,o)=>sum+o.total,0);
 const method=orders[0].method||'GCash';
 dashOpen('<p class="detail-kicker">PayMongo · test mode</p><h2 id="detail-title">Pay '+dp(total)+' with '+de(method)+'</h2><p class="detail-subtitle">'+orders.map(o=>dashOrderNo(o.id)+' · '+de(o.organization)).join('<br>')+'</p>'+(method==='GCash'?'':'<div class="pay-box">'+di('shield')+'<p>Test card <b>4343 4343 4343 4345</b> · any future date · any CVC</p></div>')+'<div class="detail-actions"><button class="control" data-pay-later>Pay later</button><button class="control primary" data-pay="'+orders.map(o=>o.id).join(',')+'">'+di('wallet')+'Pay '+dp(total)+'</button></div>');
}
// The crops PayMongo lists on its checkout page. Uploaded photos stay in this browser, so only stock photos are sent.
function dashPaymentItems(o:DashboardOrder):{name:string;quantity:number;unit:string;price:number;image:string|null}[]{
 const photo=(src:string|undefined)=>src&&!/^(data:|blob:)/.test(src)?src:null;
 return o.items?.length?o.items.map(i=>({name:i.name,quantity:i.quantity,unit:i.unit,price:i.price,image:photo(dashboardCrops.find(c=>c.id===i.crop)?.image)}))
  :[{name:o.crop,quantity:1,unit:'order',price:o.total,image:photo(o.image)}];
}
// Opens PayMongo's checkout for the orders. The secret key stays on the server (routes/api.php).
async function dashStartPayment(ids:string[],button:HTMLButtonElement):Promise<void>{
 const orders=ids.map(id=>dashboardOrders.find(o=>o.id===id)).filter((o):o is DashboardOrder=>!!o&&o.payment==='Unpaid');
 if(!orders.length)return;
 const label=button.innerHTML;button.disabled=true;button.textContent='Opening PayMongo…';
 try{
  const response=await fetch('../api/payments',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({method:orders[0].method,buyer:{name:dashAccount().name,email:dashAccount().email,phone:orders[0].phone||dashAccount().phone||null,address:orders[0].address||dashAccount().address||null},orders:orders.map(o=>({id:o.id,total:o.total,organization:o.organization,items:dashPaymentItems(o)}))})});
  const data=await response.json().catch(()=>({})) as {session?:string;checkoutUrl?:string;message?:string};
  if(!response.ok||!data.session||!data.checkoutUrl)throw new Error(data.message||'PayMongo didn’t answer ('+response.status+').');
  orders.forEach(o=>{o.checkout=data.session;});
  dashSaveStore();
  location.href=data.checkoutUrl;
 }catch(error){button.disabled=false;button.innerHTML=label;dashToast(error instanceof Error?error.message:'PayMongo couldn’t be reached.');}
}
// When PayMongo sends the buyer back, and on every later visit, asks the server whether each open checkout was paid.
async function dashCheckPayments():Promise<void>{
 const params=new URLSearchParams(location.search);const outcome=params.get('payment');
 if(outcome){params.delete('payment');history.replaceState(null,'',location.pathname+(params.toString()?'?'+params:'')+location.hash);}
 const sessions=[...new Set(dashRoleOrders().filter(o=>o.checkout&&o.payment==='Unpaid').map(o=>o.checkout!))];
 const paid:DashboardOrder[]=[];
 for(const session of sessions){
  try{
   const response=await fetch('../api/payments/'+encodeURIComponent(session),{headers:{Accept:'application/json'},cache:'no-store'});
   if(!response.ok)continue;
   const result=await response.json() as {paid:boolean;status:string;payment:string|null};
   const orders=dashboardOrders.filter(o=>o.checkout===session);
   if(result.paid)orders.forEach(o=>{o.payment='Paid';o.paymentRef=result.payment||undefined;o.checkout=undefined;dashLog('order-paid',dashMeEmail,dashOrderNo(o.id)+' · '+dp(o.total)+' · '+(o.method||'PayMongo'));paid.push(o);});
   else if(result.status!=='active'||outcome==='cancelled')orders.forEach(o=>{o.checkout=undefined;});
  }catch{/* offline: checked again on the next visit */}
 }
 if(sessions.length)dashRender();
 if(paid.length)dashToast('Payment received for '+paid.map(o=>dashOrderNo(o.id)).join(', ')+'.');
 else if(outcome==='cancelled')dashToast('Payment cancelled.');
}

/* ---------- Dialog forms ---------- */
const dashSelected=(value:string,current:string)=>value===current?' selected':'';
const dashStockPhotos=[['vegetable-cutout.png','Vegetable basket'],['carrot.jpg','Carrots'],['tomatoes.jpg','Tomatoes'],['onion.jpg','Onions'],['eggplant.jpg','Eggplants'],['sweet-potatoes.jpg','Sweet potatoes'],['mango.jpg','Mangoes'],['bananas.jpg','Bananas'],['rice.jpg','Rice']];
function dashListingForm(editId=''):void{
 const crop=editId?dashboardCrops.find(c=>c.id===editId):undefined;
 if(editId&&!crop)return;
 const value=(v:string|number|undefined)=>v===undefined?'':' value="'+de(v)+'"';
 const image=crop?crop.image:'vegetable-cutout.png';
 const uploaded=/^data:/.test(image);
 const photo='<div class="form-field wide"><span class="form-label" id="photo-label">Photo</span><div class="photo-field"><img class="photo-preview" id="photo-preview" src="'+dashImg(image)+'" alt="Listing photo"><div class="photo-inputs"><label class="control small file-button">'+di('plus')+'Upload a photo<input type="file" name="photo" id="field-photo" accept="image/jpeg,image/png,image/webp" aria-describedby="hint-photo error-photo"></label><select name="image" id="field-image" aria-label="Or choose a stock photo">'+(uploaded?'<option value="">Keep the uploaded photo</option>':'')+dashStockPhotos.map(p=>'<option value="'+p[0]+'"'+dashSelected(p[0],image)+'>Stock photo: '+p[1]+'</option>').join('')+'</select><small class="form-hint" id="hint-photo">Upload a JPG, PNG or WebP photo, or choose a stock photo.</small><small class="field-error" id="error-photo" data-error-for="photo"></small></div></div></div>';
 dashOpen('<p class="detail-kicker">'+(crop?'Edit listing · '+crop.id:'New listing · '+de(dashOrgName))+'</p><h2 id="detail-title">'+(crop?de(crop.name):'Add a crop listing')+'</h2><p class="detail-subtitle">Buyers see the harvest date and shelf life on every listing.</p><form class="dash-form" id="listing-form"'+(crop?' data-edit="'+crop.id+'"':'')+' novalidate><div class="form-grid">'
  +dashField('name','Crop name'+dashRequired,'<input required maxlength="80" autocomplete="off" placeholder="e.g. Calamansi"'+value(crop?.name)+'>','',true)
  +dashField('category','Crop type'+dashRequired,'<select required><option value="">Choose a type…</option>'+Object.keys(dashShelfDefaults).map(c=>'<option'+dashSelected(c,crop?crop.category:'')+'>'+de(c)+'</option>').join('')+'</select>')
  +dashField('unit','Unit'+dashRequired,'<select required>'+['kg','piece','bundle','sack'].map(u=>'<option value="'+u+'"'+dashSelected(u,crop?crop.unit:'kg')+'>'+u+'</option>').join('')+'</select>')
  +dashField('price','Price per unit (₱)'+dashRequired,'<input type="number" required min="1" step="1" inputmode="numeric"'+value(crop?.price)+'>')
  +dashField('stock','Available quantity'+dashRequired,'<input type="number" required min="'+(crop?0:1)+'" step="1" inputmode="numeric"'+value(crop?.stock)+'>')
  +dashField('harvested','Harvest date'+dashRequired,'<input type="date" required max="'+dashToday+'"'+value(crop?.harvested)+'>','When this batch was harvested. Shown to buyers.')
  +dashField('shelfLife','Shelf life (days)'+dashRequired,'<input type="number" required min="1" max="365" step="1" inputmode="numeric"'+value(crop?.shelfLife)+(crop?' data-edited="true"':'')+'>','How long the produce keeps after harvest. Filled in from the crop type.')
  +photo
  +'</div><p class="form-error" id="listing-error" role="alert" hidden></p><div class="detail-actions">'+(crop?'<button type="button" class="control danger push-left" data-remove-listing="'+crop.id+'">Remove listing</button>':'')+'<button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+(crop?di('check')+'Save changes':di('plus')+'Publish listing')+'</button></div></form>');
 dashFocusField('#field-name');
}
// Shrinks an uploaded photo to at most max px (listings 640, banners 1600) so it fits in browser storage.
// square: crops the middle square first (profile pictures). Transparent parts become white.
async function dashReadPhoto(file:File,max=640,square=false):Promise<string>{
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  const w=image.naturalWidth,h=image.naturalHeight,side=Math.min(w,h);
  const [sx,sy,sw,sh]=square?[(w-side)/2,(h-side)/2,side,side]:[0,0,w,h];
  const scale=Math.min(1,max/Math.max(sw,sh));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(sw*scale));canvas.height=Math.max(1,Math.round(sh*scale));
  const context=canvas.getContext('2d')!;
  context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
  context.drawImage(image,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',0.82);
 }finally{URL.revokeObjectURL(url);}
}
async function dashSubmitListing(form:HTMLFormElement):Promise<void>{
 const data=new FormData(form);
 const value=(name:string)=>String(data.get(name)??'').trim();
 const editing=form.dataset.edit?dashboardCrops.find(c=>c.id===form.dataset.edit):undefined;
 const name=value('name'),category=value('category'),harvested=value('harvested');
 const price=Number(value('price')),stock=Number(value('stock')),shelfLife=Number(value('shelfLife'));
 const minimumStock=editing?0:1;
 const file=(form.elements.namedItem('photo') as HTMLInputElement).files?.[0];
 const errors:Record<string,string>={};
 if(name.length<2)errors.name='Enter the crop name.';
 if(!category)errors.category='Choose a crop type.';
 if(!value('price')||!Number.isInteger(price)||price<1)errors.price='Enter a whole peso amount of at least ₱1.';
 if(!value('stock')||!Number.isInteger(stock)||stock<minimumStock)errors.stock='Enter a whole number of at least '+minimumStock+'.';
 if(!value('shelfLife')||!Number.isInteger(shelfLife)||shelfLife<1||shelfLife>365)errors.shelfLife='Enter a shelf life between 1 and 365 days.';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(harvested))errors.harvested='Enter the harvest date. Buyers use it to judge freshness.';
 else if(harvested>dashToday)errors.harvested='The harvest date can’t be in the future.';
 else if(!errors.shelfLife&&dashAge(harvested)>shelfLife)errors.harvested='This harvest is already past its '+shelfLife+'-day shelf life, so it can’t be listed.';
 if(file&&!/^image\/(jpeg|png|webp)$/.test(file.type))errors.photo='Choose a JPG, PNG or WebP photo.';
 else if(file&&file.size>10*1024*1024)errors.photo='Choose a photo smaller than 10 MB.';
 if(!dashShowErrors(form,errors))return;
 let image=value('image')||(editing?editing.image:'vegetable-cutout.png');
 if(file){
  try{image=await dashReadPhoto(file);}
  catch{dashShowErrors(form,{photo:'This photo couldn’t be read. Try another JPG or PNG.'});return;}
 }
 const fields={name,category,image,price,unit:value('unit')||'kg',stock,harvested,shelfLife};
 if(editing){
  const oldPrice=editing.price;
  Object.assign(editing,fields);
  if(editing.price!==oldPrice)dashLog('price-changed',dashMeEmail,editing.name+' · '+dp(oldPrice)+' → '+dp(editing.price)+' /'+editing.unit);
  else dashLog('listing-edited',dashMeEmail,editing.name);
  if(editing.stock===0&&editing.status==='Active')editing.status='Unavailable';
  dashDialog.close();dashRender();
  dashToast('Changes to '+editing.name+' saved.');
  return;
 }
 const next=Math.max(0,...dashboardCrops.map(c=>Number(c.id.slice(5))||0))+1;
 const crop:DashboardCrop={id:'CROP-'+String(next).padStart(3,'0'),organization:dashOrgName,status:'Active',...fields};
 dashboardCrops.unshift(crop);
 dashDialog.close();
 dashNavigate('listings');
 dashLog('listing-added',dashMeEmail,crop.name+' · '+dp(crop.price)+' /'+crop.unit);
 dashToast(crop.name+' is listed. Buyers see it was harvested '+dd(harvested)+'.');
}
function dashConfirmRemoveListing(id:string):void{
 const crop=dashboardCrops.find(c=>c.id===id);
 if(!crop)return;
 dashOpen('<p class="detail-kicker">Remove listing · '+crop.id+'</p><h2 id="detail-title">Remove '+de(crop.name)+'?</h2><p class="detail-subtitle">Buyers will no longer see this listing and it is taken out of their carts. Orders already placed aren’t affected.</p><div class="detail-actions"><button class="control" data-edit-listing="'+crop.id+'">Keep listing</button><button class="control danger" data-confirm-remove="'+crop.id+'">Remove listing</button></div>');
}
function dashMemberForm():void{
 dashOpen('<p class="detail-kicker">Member farmers · '+de(dashOrgName)+'</p><h2 id="detail-title">Add a member farmer</h2><p class="detail-subtitle">Members are the growers who supply your organization’s listings.</p><form class="dash-form" id="member-form" novalidate><div class="form-grid">'
  +dashField('name','Full name'+dashRequired,'<input required maxlength="80" autocomplete="off">','',true)
  +dashField('place','Barangay'+dashRequired,'<input required maxlength="60" placeholder="e.g. Canubing I">')
  +dashField('area','Farm area (hectares)'+dashRequired,'<input type="number" required min="0.1" max="500" step="0.1" inputmode="decimal">')
  +dashField('crops','Crops grown'+dashRequired,'<input required maxlength="80" placeholder="e.g. Rice, calamansi">','',true)
  +'</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+di('plus')+'Add member</button></div></form>');
 dashFocusField('#field-name');
}
function dashSubmitMember(form:HTMLFormElement):void{
 const data=new FormData(form);
 const value=(name:string)=>String(data.get(name)??'').trim();
 const area=Number(value('area'));
 const errors:Record<string,string>={};
 if(value('name').length<3)errors.name='Enter the farmer’s full name.';
 if(value('place').length<3)errors.place='Enter the barangay.';
 if(!value('area')||!(area>=0.1&&area<=500))errors.area='Enter the farm area in hectares, from 0.1 to 500.';
 if(value('crops').length<3)errors.crops='Enter the crops they grow.';
 if(!dashShowErrors(form,errors))return;
 const next=Math.max(0,...dashboardMembers.map(m=>Number(m.id.slice(3))||0))+1;
 dashboardMembers.push({id:'MB-'+String(next).padStart(3,'0'),organization:dashOrgName,name:value('name'),place:value('place'),crops:value('crops'),area:Math.round(area*10)/10,joined:String(dashTodayDate.getFullYear()),status:'Active'});
 dashDialog.close();dashRender();
 dashToast(value('name')+' was added as a member farmer.');
}
function dashOrgProfileForm():void{
 const org=dashMyOrg();
 if(!org)return;
 const barangay=org.region.split(', ')[0];
 dashOpen('<p class="detail-kicker">Organization profile</p><h2 id="detail-title">'+de(org.name)+'</h2><p class="detail-subtitle">Buyers see this on your storefront and listings.</p><form class="dash-form" id="org-profile-form" novalidate><div class="form-grid">'
  +dashField('crop','Main crops'+dashRequired,'<input required maxlength="80" value="'+de(org.crop)+'">','',true)
  +dashField('barangay','Barangay, '+dashCityName+dashRequired,'<select required>'+dashBarangayOptions(dashBarangays.includes(barangay)?barangay:'')+'</select>')
  +dashField('phone','Contact number'+dashRequired,'<input type="tel" required maxlength="20" autocomplete="tel" value="'+de(org.phone||'')+'">')
  +dashField('description','About your organization','<textarea rows="3" maxlength="240">'+de(org.description||'')+'</textarea>','',true)
  +'</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+di('check')+'Save profile</button></div></form>');
 dashFocusField('#field-crop');
}
function dashSubmitOrgProfile(form:HTMLFormElement):void{
 const data=new FormData(form);
 const value=(name:string)=>String(data.get(name)??'').trim();
 const errors:Record<string,string>={};
 if(value('crop').length<3)errors.crop='Enter your main crops.';
 if(!dashBarangays.includes(value('barangay')))errors.barangay='Choose your barangay.';
 if(!dashPhonePattern.test(value('phone')))errors.phone='Enter a mobile number like 0917 555 0148.';
 if(!dashShowErrors(form,errors))return;
 const org=dashMyOrg();
 if(!org)return;
 Object.assign(org,{crop:value('crop'),region:value('barangay')+', '+dashCityName,phone:value('phone'),description:value('description')});
 dashLog('profile-updated',dashMeEmail,'Organization profile');
 dashDialog.close();dashRender();
 dashToast('Organization profile saved.');
}
// Delivery address fields: house and street, plus a barangay of Calapan City (AniBayan delivers only there).
function dashAddressFields(address?:string):string{
 const a=dashSplitAddress(address);
 return dashField('street','House number and street'+dashRequired,'<input required maxlength="120" autocomplete="address-line1" placeholder="e.g. 12 J.P. Rizal Street" value="'+de(a.street)+'">')
  +dashField('barangay','Barangay, '+dashCityName+dashRequired,'<select required>'+dashBarangayOptions(a.barangay)+'</select>');
}
// Reads those fields back as one address, adding any problems to errors.
function dashReadAddress(data:FormData,errors:Record<string,string>):string{
 const street=String(data.get('street')??'').trim(),barangay=String(data.get('barangay')??'').trim();
 if(street.length<4)errors.street='Enter the house number and street.';
 if(!dashBarangays.includes(barangay))errors.barangay='Choose a barangay in Calapan City.';
 return dashJoinAddress(street,barangay);
}
function dashProfileForm():void{
 const me=dashAccount();
 dashOpen('<p class="detail-kicker">Your profile</p><h2 id="detail-title">Delivery details</h2><p class="detail-subtitle">Used to fill in checkout. Your name and email can’t be changed here.</p><form class="dash-form" id="profile-form" novalidate><div class="form-grid single">'
  +dashField('phone','Mobile number'+dashRequired,'<input type="tel" required maxlength="20" autocomplete="tel" value="'+de(me.phone||'')+'">')
  +dashAddressFields(me.address)
  +'</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+di('check')+'Save details</button></div></form>');
 dashFocusField('#field-phone');
}
function dashSubmitProfile(form:HTMLFormElement):void{
 const data=new FormData(form);
 const phone=String(data.get('phone')??'').trim();
 const errors:Record<string,string>={};
 if(!dashPhonePattern.test(phone))errors.phone='Enter a mobile number like 0917 555 0148.';
 const address=dashReadAddress(data,errors);
 if(!dashShowErrors(form,errors))return;
 Object.assign(dashAccount(),{phone,address});
 dashLog('profile-updated',dashMeEmail,'Delivery details');
 dashDialog.close();dashRender();
 dashToast('Delivery details saved.');
}
function dashPasswordForm():void{
 dashOpen('<p class="detail-kicker">Security</p><h2 id="detail-title">Change your password</h2><p class="detail-subtitle">You’ll use the new password the next time you sign in.</p><form class="dash-form" id="password-form" novalidate><div class="form-grid single">'
  +dashField('current','Current password'+dashRequired,'<input type="password" required autocomplete="current-password">')
  +dashField('password','New password'+dashRequired,'<input type="password" required minlength="8" autocomplete="new-password">','At least 8 characters.')
  +dashField('confirm','Confirm new password'+dashRequired,'<input type="password" required autocomplete="new-password">')
  +'</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+di('key')+'Change password</button></div></form>');
 dashFocusField('#field-current');
}
function dashSubmitPassword(form:HTMLFormElement):void{
 const data=new FormData(form);
 const current=String(data.get('current')??''),password=String(data.get('password')??''),confirm=String(data.get('confirm')??'');
 const me=dashAccount();
 const errors:Record<string,string>={};
 if(current!==(me.password||dashDemoPassword))errors.current='That isn’t your current password.';
 if(password.length<8)errors.password='Use at least 8 characters.';
 else if(password===current)errors.password='Choose a password different from the current one.';
 if(confirm!==password)errors.confirm='The two new passwords don’t match.';
 if(!dashShowErrors(form,errors))return;
 me.password=password;
 dashLog('password-changed',dashMeEmail);
 dashDialog.close();dashRender();
 dashToast('Password changed.');
}
const dashPaymentMethods=[['Cash on delivery','Pay the organization when your order arrives.'],['GCash','Pay now through PayMongo.'],['Credit or debit card','Pay now through PayMongo.']];
function dashCheckoutForm():void{
 const entries=dashCartEntries();
 if(!entries.length||entries.some(e=>dashCartProblem(e)))return;
 const me=dashAccount();
 const total=entries.reduce((sum,e)=>sum+e.line.quantity*e.crop.price,0);
 const orgs=[...new Set(entries.map(e=>e.crop.organization))];
 dashOpen('<p class="detail-kicker">Checkout</p><h2 id="detail-title">Place your order'+(orgs.length>1?'s':'')+'</h2><p class="detail-subtitle">'+dashPlural(entries.length,'harvest')+' · '+dp(total)+(orgs.length>1?' · '+orgs.length+' orders, one per organization':'')+'</p><form class="dash-form" id="checkout-form" novalidate><div class="form-grid single">'
  +dashAddressFields(me.address)
  +dashField('phone','Mobile number'+dashRequired,'<input type="tel" required maxlength="20" autocomplete="tel" value="'+de(me.phone||'')+'">','The organization calls this number to arrange delivery.')
  +'<div class="form-field"><span class="form-label" id="method-label">Payment method'+dashRequired+'</span><div class="choice-list" role="radiogroup" aria-labelledby="method-label">'+dashPaymentMethods.map((m,i)=>'<label class="choice"><input type="radio" name="method" value="'+m[0]+'"'+(i===0?' checked':'')+'><span><strong>'+m[0]+'</strong><small>'+m[1]+'</small></span></label>').join('')+'</div></div>'
  +dashField('note','Note for the organization','<textarea rows="2" maxlength="200" placeholder="Gate code, preferred delivery time…"></textarea>')
  +'<label class="check-row"><input type="checkbox" name="remember" checked> Save this address and number to my profile</label>'
  +'</div><p class="form-error" id="checkout-error" role="alert" hidden></p><div class="detail-actions"><button type="button" class="control" data-close-dialog>Back to cart</button><button type="submit" class="control primary">Place order'+(orgs.length>1?'s':'')+' · '+dp(total)+'</button></div></form>');
 dashFocusField(dashSplitAddress(me.address).barangay?'[type=submit]':'#field-street');
}
function dashSubmitCheckout(form:HTMLFormElement):void{
 const data=new FormData(form);
 const phone=String(data.get('phone')??'').trim(),note=String(data.get('note')??'').trim();
 const method=String(data.get('method')||'Cash on delivery');
 const errors:Record<string,string>={};
 const address=dashReadAddress(data,errors);
 if(!dashPhonePattern.test(phone))errors.phone='Enter a mobile number like 0917 555 0148.';
 if(!dashShowErrors(form,errors))return;
 const entries=dashCartEntries();
 const problems=entries.filter(e=>dashCartProblem(e));
 const error=document.getElementById('checkout-error')!;
 if(!entries.length||problems.length){error.hidden=false;error.textContent=problems.length?'Some items changed while you were checking out: '+problems.map(e=>e.crop.name+' ('+dashCartProblem(e).toLowerCase()+')').join(', ')+'. Go back to your cart to update them.':'Your cart is empty.';return;}
 let next=Math.max(...dashboardOrders.map(o=>Number(o.id.slice(8))||0))+1;
 const placed:DashboardOrder[]=[];
 [...new Set(entries.map(e=>e.crop.organization))].forEach(org=>{
  const lines=entries.filter(e=>e.crop.organization===org);
  const items=lines.map(e=>({crop:e.crop.id,name:e.crop.name,quantity:e.line.quantity,unit:e.crop.unit,price:e.crop.price}));
  lines.forEach(e=>{e.crop.stock-=e.line.quantity;});
  placed.push({id:'AB-2026-'+next++,customer:dashConsumerName,organization:org,crop:items.length===1?items[0].name:items[0].name+' + '+(items.length-1)+' more',image:lines[0].crop.image,quantity:items.length===1?items[0].quantity+' '+items[0].unit:dashPlural(items.length,'item'),total:items.reduce((sum,i)=>sum+i.quantity*i.price,0),date:dashToday,status:'Pending',payment:'Unpaid',items,address,phone,method,note});
 });
 dashboardOrders.unshift(...placed);
 placed.forEach(o=>dashLog('order-placed',dashMeEmail,dashOrderNo(o.id)+' · '+dp(o.total)+' · '+o.organization));
 dashCart().splice(0);
 if(data.get('remember'))Object.assign(dashAccount(),{address,phone});
 const numbers=placed.map(o=>dashOrderNo(o.id)).join(', ');
 if(method!=='Cash on delivery'){dashRender();dashPaymentDialog(placed.map(o=>o.id));dashToast('Order'+(placed.length>1?'s ':' ')+numbers+' placed. Complete the payment to finish.');return;}
 dashDialog.close();
 dashNavigate('orders');
 dashToast(placed.length===1?'Order '+numbers+' placed with '+placed[0].organization+'.':placed.length+' orders placed: '+numbers+'.');
}
const dashRatingWords=['','Very poor','Poor','Okay','Good','Excellent'];
function dashFeedbackForm(orderId:string):void{
 const o=dashRoleOrders().find(x=>x.id===orderId);
 if(!o||dashRated(o.id))return;
 const stars=[1,2,3,4,5].map(n=>'<input type="radio" name="rating" id="rating-'+n+'" value="'+n+'"><label for="rating-'+n+'" title="'+n+' – '+dashRatingWords[n]+'">★<span class="sr-only">'+dashPlural(n,'star')+', '+dashRatingWords[n]+'</span></label>').join('');
 dashOpen('<p class="detail-kicker">Rate your order · '+dashOrderNo(o.id)+'</p><h2 id="detail-title">How was your order?</h2><p class="detail-subtitle">'+de(o.crop)+' · '+de(o.quantity)+' from '+de(o.organization)+'</p><form class="dash-form" id="feedback-form" data-order="'+o.id+'" novalidate><div class="form-grid single"><div class="form-field"><span class="form-label" id="rating-label">Your rating'+dashRequired+'</span><div class="star-input" role="radiogroup" aria-labelledby="rating-label" aria-describedby="rating-caption error-rating">'+stars+'</div><small class="form-hint" id="rating-caption">Choose 1 to 5 stars.</small><small class="field-error" id="error-rating" data-error-for="rating"></small></div>'+dashField('comment','Comment (optional)','<textarea rows="3" maxlength="300" placeholder="What did you like? What could be better?"></textarea>')+'</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+di('star')+'Submit rating</button></div></form>');
 dashFocusField('#rating-1');
}
function dashSubmitFeedback(form:HTMLFormElement):void{
 const data=new FormData(form);
 const rating=Number(data.get('rating'));
 if(!dashShowErrors(form,rating>=1&&rating<=5?{}:{rating:'Choose a rating from 1 to 5 stars.'}))return;
 const order=dashboardOrders.find(o=>o.id===form.dataset.order);
 if(!order)return;
 const next=Math.max(0,...dashboardFeedback.map(f=>Number(f.id.slice(3))||0))+1;
 dashLog('rating',dashMeEmail,rating+'★ · '+order.organization);
 dashboardFeedback.unshift({id:'FB-'+next,organization:order.organization,customer:dashConsumerName,rating,comment:String(data.get('comment')??'').trim(),date:dashToday,order:order.id});
 dashDialog.close();dashRender();
 dashToast('Thanks for rating '+order.organization+'!');
}
const dashReportReasons=['Short or wrong quantity','Poor quality or spoiled','Harvest date not as listed','Late or no fulfillment','Payment or refund problem','Other'];
function dashReportForm(orderId:string):void{
 const o=dashRoleOrders().find(x=>x.id===orderId);
 if(!o||dashMyReport(o.id))return;
 dashOpen('<p class="detail-kicker">Report a problem · '+dashOrderNo(o.id)+'</p><h2 id="detail-title">What went wrong?</h2><p class="detail-subtitle">'+de(o.crop)+' · '+de(o.quantity)+' from '+de(o.organization)+'</p><form class="dash-form" id="report-form" data-order="'+o.id+'" novalidate><div class="form-grid single">'
  +dashField('reason','Reason'+dashRequired,'<select required><option value="">Choose a reason…</option>'+dashReportReasons.map(r=>'<option>'+de(r)+'</option>').join('')+'</select>')
  +dashField('details','Details'+dashRequired,'<textarea rows="4" required maxlength="500" placeholder="What did you receive, and when?"></textarea>','At least 20 characters.')
  +'</div><p class="detail-note">AniBayan administrators review every report.</p><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+di('flag')+'Send report</button></div></form>');
 dashFocusField('#field-reason');
}
function dashSubmitReport(form:HTMLFormElement):void{
 const data=new FormData(form);
 const reason=String(data.get('reason')??'').trim(),details=String(data.get('details')??'').trim();
 const errors:Record<string,string>={};
 if(!reason)errors.reason='Choose a reason.';
 if(details.length<20)errors.details='Describe the problem in at least 20 characters.';
 if(!dashShowErrors(form,errors))return;
 const order=dashboardOrders.find(o=>o.id===form.dataset.order);
 if(!order)return;
 const next=Math.max(0,...dashboardReports.map(r=>Number(r.id.slice(3))||0))+1;
 dashboardReports.push({id:'RP-'+String(next).padStart(3,'0'),organization:order.organization,customer:dashConsumerName,reason,details,date:dashToday,status:'Open',order:order.id});
 dashLog('report-filed',dashMeEmail,'RP-'+String(next).padStart(3,'0')+' · '+order.organization);
 dashDialog.close();dashRender();
 dashToast('Report sent. An AniBayan administrator will review it.');
}

const dashRepEmail=(org:string)=>dashboardAccounts.find(a=>a.organization===org&&a.role==='Representative')?.email||'';
// Administrators warn an organization directly; at its final warning the next step is termination.
function dashWarningForm(name:string):void{
 const s=dashStanding(name);
 if(s.terminated)return;
 if(s.final){dashTerminateDialog(name);return;}
 const last=s.count+1>=dashWarningLimit;
 dashOpen('<p class="detail-kicker">Warn organization · '+dashNextOffence(name)+'</p><h2 id="detail-title">Give '+de(name)+' a warning</h2><form class="dash-form" id="warning-form" data-organization-name="'+de(name)+'" novalidate><div class="form-grid single">'
  +dashField('reason','Reason'+dashRequired,'<input required maxlength="120" placeholder="For example: abusive messages to a buyer">')
  +dashField('details','Details (optional)','<textarea rows="3" maxlength="500" placeholder="What happened, and when?"></textarea>')
  +'</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control danger">'+di('flag')+(last?'Give final warning':'Give warning')+'</button></div></form>');
 dashFocusField('#field-reason');
}
function dashSubmitWarning(form:HTMLFormElement):void{
 const data=new FormData(form);
 const reason=String(data.get('reason')??'').trim(),details=String(data.get('details')??'').trim();
 if(!dashShowErrors(form,reason.length>=5?{}:{reason:'Give a reason of at least 5 characters.'}))return;
 const name=form.dataset.organizationName||'';
 const next=Math.max(0,...dashboardWarnings.map(w=>Number(w.id.slice(3))||0))+1;
 dashboardWarnings.push({id:'WN-'+String(next).padStart(3,'0'),organization:name,reason,details,date:dashToday,by:dashAccount().name});
 dashLog('warning-given',dashMeEmail,name+' · '+reason,dashRepEmail(name));
 dashRender();dashApplicationDetails(name);
 dashToast('Warning given. '+dashStandingSentence(name));
}
// Asks before terminating. With a report, upholding that report is the offence that ends it.
function dashTerminateDialog(name:string,reportId=''):void{
 const s=dashStanding(name);
 if(s.terminated)return;
 dashOpen('<p class="detail-kicker">Terminate organization</p><h2 id="detail-title">Terminate '+de(name)+'?</h2><p class="detail-subtitle">This can’t be undone.</p><form class="dash-form" id="terminate-form" data-organization-name="'+de(name)+'" data-report="'+reportId+'" novalidate>'
  +(reportId?'':'<div class="form-grid single">'+dashField('reason','Reason'+dashRequired,'<input required maxlength="120" placeholder="What did the organization do this time?">')+'</div>')
  +'<div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control danger">'+di('lock')+(reportId?'Uphold and terminate':'Terminate organization')+'</button></div></form>');
 if(!reportId)dashFocusField('#field-reason');
}
function dashSubmitTerminate(form:HTMLFormElement):void{
 const name=form.dataset.organizationName||'';
 const org=dashboardOrganizations.find(o=>o.name===name);
 if(!org)return;
 const report=form.dataset.report?dashboardReports.find(r=>r.id===form.dataset.report):undefined;
 let reason='';
 if(report){report.status='Upheld';report.decided=dashToday;reason=report.reason+' (report '+report.id+')';}
 else{
  reason=String(new FormData(form).get('reason')??'').trim();
  if(!dashShowErrors(form,reason.length>=5?{}:{reason:'Give a reason of at least 5 characters.'}))return;
 }
 if(report)dashLog('report-upheld',dashMeEmail,report.id+' · '+name);
 dashLog('org-terminated',dashMeEmail,name+' · '+reason,dashRepEmail(name));
 org.status='Terminated';org.terminated=dashToday;org.terminatedFor=reason;
 dashboardAccounts.filter(a=>a.organization===name&&a.role==='Representative').forEach(a=>{a.status='Terminated';a.note=name+' was terminated by '+dashAccount().name+' on '+dfull(dashToday)+'.';});
 dashRender();dashApplicationDetails(name);
 dashToast(name+' is terminated. Its listings left the shop and its representative is signed out.');
}

let dashToastTimeout:number|undefined;
function dashToast(message:string):void{const el=document.getElementById('dashboard-toast')!;el.textContent=message;el.classList.add('visible');window.clearTimeout(dashToastTimeout);dashToastTimeout=window.setTimeout(()=>el.classList.remove('visible'),3600);}
function dashExportRows():[string,(string|number)[][]]{
 const view=dashState.view;
 if(isAdminDashboard){
  if(view==='activity')return ['activity-log',[['Time','Email','Name','Activity','Details'],...dashActivityList().map(e=>[e.time,e.actor,dashAccountByEmail(e.actor)?.name||'',dashActivityInfo(e.type)[0],e.detail])]];
  if(view==='reports')return ['user-reports',[['Report ID','Organization','Reported by','Reason','Details','Order','Filed','Status'],...dashReportList().map(r=>[r.id,r.organization,r.customer,r.reason,r.details,r.order||'',r.date,r.status])]];
  if(view==='applications')return ['organization-applications',[['Organization','Region','Main crops','Representative','Members','Documents','Submitted','Status'],...dashApplicationList().map(o=>[o.name,o.region,o.crop,o.representative,o.members,o.documents.join('; '),o.applied,dashAppStatus(o)])]];
  if(view==='health')return ['health-checks',[['Checked at','Service','Result','Response time (ms)','Error'],...dashboardHealthLog.slice().reverse().flatMap(run=>run.results.map(r=>[run.time,r.service,r.ok?'Passed':'Failed',r.latency,r.error||'']))]];
  return ['accounts',[['Name','Email','Role','Organization','Joined','Last active','Status'],...dashAccountList().map(a=>[a.name,a.email,a.role==='Consumer'?'Buyer':a.role,a.organization||'',a.joined,a.lastActive,a.status])]];
 }
 if(view==='listings')return ['listings',[['Product ID','Name','Category','Price PHP','Unit','Available quantity','Harvest date','Shelf life (days)','Best before','Status'],...dashListingCrops().map(c=>[c.id,c.name,c.category,c.price,c.unit,c.stock,c.harvested,c.shelfLife,dashAddDays(c.harvested,c.shelfLife),dashCropStatus(c)])]];
 if(view==='members')return ['members',[['Farmer','Barangay','Crops','Area ha','Member since','Status'],...dashMyMembers().filter(m=>dashMatching([m.name,m.place,m.crops,m.status].join(' '))).map(m=>[m.name,m.place,m.crops,m.area,m.joined,m.status])]];
 if(view==='feedback')return ['feedback',[['Feedback ID','Date','Buyer','Rating','Comment','Order'],...dashOrgFeedbackList().map(f=>[f.id,f.date,f.customer,f.rating,f.comment,f.order||''])]];
 return ['orders',[['Order ID','Buyer','Organization','Harvest','Quantity','Total PHP','Status','Payment','Date','Delivery address','Contact number','Payment method'],...dashOrders().map(o=>[o.id,o.customer,o.organization,o.crop,o.quantity,o.total,o.status,o.payment,o.date,o.address||'',o.phone||'',o.method||''])]];
}
function dashExport():void{
 const [recordType,rows]=dashExportRows();
 // Prefix cells that start like a spreadsheet formula so they open as plain text.
 const cell=(value:string|number)=>{const text=String(value);return '"'+(/^[=+\-@]/.test(text)?"'"+text:text).replace(/"/g,'""')+'"';};
 const csv='﻿'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='anibayan-'+recordType+'-'+dashToday+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);dashToast(recordType.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase())+' exported as CSV.');
}
function dashSetPopover(panelId:string,buttonId:string,open:boolean):void{
 document.getElementById(panelId)!.hidden=!open;
 document.getElementById(buttonId)!.setAttribute('aria-expanded',String(open));
}
function dashClosePopovers():void{dashSetPopover('notification-panel','show-notifications',false);dashSetPopover('workspace-menu','workspace-toggle',false);}
const dashNarrow=window.matchMedia('(max-width:900px)');
function dashReadHash():void{
 const requested=location.hash.slice(1);
 if(isGuest&&dashBuyerViews.includes(requested)){dashGoToSignIn('buyer');return;}
 const allowed=dashRole.nav.map(n=>n[0]).concat(dashRole.settingsNav?[dashRole.settingsNav[0]]:[],['help']);
 const profile=/^(org|user)=([a-z0-9-]+)$/.exec(requested);
 if(profile)dashState.profile={kind:profile[1]==='user'?'user':'org',slug:profile[2]};
 dashState.view=profile?'profile':allowed.includes(requested)?requested:dashRole.nav[0][0];
 dashRepositioning=null;
 dashState.filter=dashState.nextFilter||'All';dashState.nextFilter='';dashState.query='';
 dashClosePopovers();document.body.classList.remove('sidebar-open');dashRender();window.scrollTo(0,0);
}

/* ---------- Start: sign-in check, events ---------- */
function dashStart():void{
 dashShell();
 // Links from the homepage: consumer.html?q=rice#shop searches the shop; ?grower=Name opens that community's profile.
 const params=new URLSearchParams(location.search);
 const grower=isConsumerDashboard?params.get('grower'):null;
 if(grower){params.delete('grower');history.replaceState(null,'',location.pathname+(params.toString()?'?'+params:'')+'#org='+dashSlug(grower));}
 window.addEventListener('hashchange',dashReadHash);dashReadHash();
 if(isConsumerDashboard&&params.get('q')){dashState.query=params.get('q')!.replace(/-/g,' ');dashRender();}
 if(isAdminDashboard)void dashRunHealthChecks();
 if(dashBuyer)void dashCheckPayments();
 // Keep every open AniBayan page in step: another page saved new data, reset it, or signed in or out.
 window.addEventListener('storage',event=>{
  if(event.key===dashSessionKey||(event.key===dashStoreKey&&event.newValue===null)||event.key===null){location.reload();return;}
  if(event.key===dashPrefsKey){dashApplyPreferences();return;}
  if(event.key!==dashStoreKey)return;
  dashLoadStore();
  dashRender();
 });
 document.getElementById('dashboard-search')!.addEventListener('input',event=>{dashState.query=(event.target as HTMLInputElement).value;dashRender();});
 document.addEventListener('keydown',event=>{
  const el=event.target as Element;
  // Repositioning a banner: arrow keys move it (Shift for bigger steps), Enter saves, Escape cancels.
  const r=dashRepositioning;
  if(r&&el instanceof HTMLElement&&el.classList.contains('is-positioning')){
   if(event.key==='Enter'){event.preventDefault();dashFinishReposition(true);return;}
   const step:Record<string,number[]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
   const d=step[event.key];const size=event.shiftKey?30:10;
   if(d){event.preventDefault();dashMoveBanner(d[0]*size,d[1]*size,{x:r.x,y:r.y});return;}
  }
  if(r&&event.key==='Escape'){event.preventDefault();dashFinishReposition(false);return;}
  // Photo pickers are labels acting as buttons.
  if((event.key==='Enter'||event.key===' ')&&el instanceof HTMLLabelElement&&el.getAttribute('role')==='button'){event.preventDefault();el.querySelector('input')?.click();return;}
  if(event.key==='Escape'){dashClosePopovers();document.body.classList.remove('sidebar-open');return;}
  if(event.key==='/'&&!el.closest('input,select,textarea')&&!dashDialog.open){event.preventDefault();document.getElementById('dashboard-search')!.focus();}
 });
 document.addEventListener('click',dashHandleClick);
 document.addEventListener('input',event=>{
  const input=event.target as HTMLInputElement;
  if(input.dataset.tableSearch!==undefined){dashState.query=input.value;dashRender();return;}
  const key=input.dataset.shop as keyof DashShopFilters|undefined;
  if(key){dashState.shop[key]=input.value;dashRefreshShop();return;}
  const form=input.form;
  if(!form||!form.closest('#detail-dialog'))return;
  dashClearFieldError(input);
  if(form.id!=='listing-form')return;
  if(input.name==='shelfLife')input.dataset.edited='true';
  if(input.name==='category'){
   const shelfLife=form.elements.namedItem('shelfLife') as HTMLInputElement;
   const days=dashShelfDefaults[input.value];
   if(days&&!shelfLife.dataset.edited)shelfLife.value=String(days);
  }
 });
 // Dragging a banner that is being repositioned.
 document.addEventListener('pointerdown',event=>{
  const el=event.target as Element;const banner=el.closest<HTMLElement>('.profile-banner.is-positioning');const r=dashRepositioning;
  if(!banner||!r||event.button!==0||el.closest('button,label,input'))return;
  r.drag={id:event.pointerId,cx:event.clientX,cy:event.clientY,x:r.x,y:r.y};
  banner.setPointerCapture(event.pointerId);banner.classList.add('is-dragging');event.preventDefault();
 });
 document.addEventListener('pointermove',event=>{const r=dashRepositioning;if(r?.drag&&event.pointerId===r.drag.id)dashMoveBanner(event.clientX-r.drag.cx,event.clientY-r.drag.cy,r.drag);});
 const endDrag=(event:PointerEvent)=>{const r=dashRepositioning;if(!r?.drag||event.pointerId!==r.drag.id)return;r.drag=undefined;dashBannerEl(r.target)?.classList.remove('is-dragging');};
 document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',endDrag);
 document.addEventListener('change',event=>{
  const input=event.target as HTMLInputElement;
  if(input.dataset.upload){void dashUploadLook(input);return;}
  if(input.dataset.privacy){
   const me=dashMe();const key=input.dataset.privacy as keyof DashboardPrivacy;
   if(!me||!isConsumerDashboard||!(key in dashPrivacyDefaults))return;
   me.privacy={...dashPrivacy(me),[key]:input.checked};
   dashLog('profile-updated',dashMeEmail,'Privacy settings');
   dashRender();document.getElementById('privacy-'+key)?.focus();return;
  }
  if(input.id==='dashboard-period'){dashState.period=input.value==='month'?'month':'week';dashState.bar=99;dashRender();}
  if(input.id==='density'){document.body.classList.toggle('compact-density',input.checked);dashSavePreferences();}
  if(input.id==='contrast'){document.body.classList.toggle('contrast-mode',input.checked);dashSavePreferences();}
  if(input.name==='rating'){const caption=document.getElementById('rating-caption');if(caption)caption.textContent=dashPlural(Number(input.value),'star')+' · '+dashRatingWords[Number(input.value)];}
  const preview=document.getElementById('photo-preview') as HTMLImageElement|null;
  if(preview&&input.id==='field-photo'&&input.files&&input.files[0])preview.src=URL.createObjectURL(input.files[0]);
  if(preview&&input.id==='field-image'&&input.value){preview.src=dashImg(input.value);const file=document.getElementById('field-photo') as HTMLInputElement;file.value='';}
 });
 document.addEventListener('submit',event=>{
  const form=event.target as HTMLFormElement;
  if(!form.closest('#detail-dialog'))return;
  event.preventDefault();
  if(form.id==='listing-form')void dashSubmitListing(form);
  else if(form.id==='feedback-form')dashSubmitFeedback(form);
  else if(form.id==='report-form')dashSubmitReport(form);
  else if(form.id==='warning-form')dashSubmitWarning(form);
  else if(form.id==='terminate-form')dashSubmitTerminate(form);
  else if(form.id==='checkout-form')dashSubmitCheckout(form);
  else if(form.id==='profile-form')dashSubmitProfile(form);
  else if(form.id==='org-profile-form')dashSubmitOrgProfile(form);
  else if(form.id==='member-form')dashSubmitMember(form);
  else if(form.id==='password-form')dashSubmitPassword(form);
 });
 dashDialog.addEventListener('click',event=>{if(event.target===dashDialog){const r=dashDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dashDialog.close();}});
}
function dashHandleClick(event:MouseEvent):void{
 const el=event.target as Element;
 if(!el.closest('.notification-wrap'))dashSetPopover('notification-panel','show-notifications',false);
 if(!el.closest('.workspace-switch'))dashSetPopover('workspace-menu','workspace-toggle',false);
 if(el.closest('#sidebar-backdrop'))document.body.classList.remove('sidebar-open');
 if(el.closest('[data-sign-out]')){if(dashMeEmail){dashLog('signout',dashMeEmail);dashSaveStore();}dashClearSession();return;}
 if(el.closest('[data-sign-in]')){event.preventDefault();dashGoToSignIn('signin');return;}
 if(el.closest('[data-sign-in-buyer]')){event.preventDefault();dashGoToSignIn('buyer');return;}
 // Profile links are plain links; a pop-up they sit in closes as the profile opens.
 if(el.closest('[data-profile-link]')&&dashDialog.open)dashDialog.close();
 const target=el.closest<HTMLElement>('button,[data-go]');if(!target)return;
 const data=target.dataset;
 if(data.reposition){void dashStartReposition(data.reposition);return;}
 if(data.repositionSave!==undefined){dashFinishReposition(true);return;}
 if(data.repositionCancel!==undefined){dashFinishReposition(false);return;}
 if(data.removePhoto&&data.look){
  const look=dashLookOf(data.look);
  if(!look||!dashCanEdit(data.look))return;
  const avatar=data.removePhoto==='avatar';
  if(avatar)delete look.avatar;else{delete look.banner;delete look.bannerX;delete look.bannerY;}
  dashRepositioning=null;
  dashLog('profile-updated',dashMeEmail,avatar?'Profile picture removed':'Profile banner removed');
  dashRender();dashToast(avatar?'Picture removed.':'Banner removed.');return;
 }
 if(data.shopType){dashState.shop.type=dashState.shop.type===data.shopType?'All':data.shopType;dashRender();return;}
 if(data.go){dashState.nextFilter=data.goFilter||'';if(dashDialog.open)dashDialog.close();dashNavigate(data.go);return;}
 if(data.advance||data.decline||data.cancelOrder){
  const order=dashboardOrders.find(o=>o.id===(data.advance||data.decline||data.cancelOrder))!;
  dashSetOrderStatus(order,data.advance?dashNextStep[order.status][0]:'Cancelled');
  if(order.status==='Cancelled')dashLog('order-cancelled',dashMeEmail,dashOrderNo(order.id)+(data.decline?' · declined by '+order.organization:''));
  else dashLog('order-updated',dashMeEmail,dashOrderNo(order.id)+' → '+order.status);
  dashRender();if(dashDialog.open)dashOrderDetails(order.id);
  dashToast('Order '+dashOrderNo(order.id)+' '+(data.cancelOrder?'cancelled.':'marked '+order.status.toLowerCase()+'.'));return;
 }
 if(data.toggleListing){
  const crop=dashboardCrops.find(c=>c.id===data.toggleListing)!;
  crop.status=crop.status==='Active'?'Unavailable':'Active';
  dashLog(crop.status==='Active'?'listing-resumed':'listing-paused',dashMeEmail,crop.name);dashRender();
  if(dashDialog.open)dashProductDetails(crop.id);
  dashToast(crop.name+(crop.status==='Active'?' is visible to buyers again.':' is paused. Buyers can’t order it until you resume it.'));return;
 }
 if(data.editListing){dashListingForm(data.editListing);return;}
 if(data.removeListing){dashConfirmRemoveListing(data.removeListing);return;}
 if(data.confirmRemove){
  const index=dashboardCrops.findIndex(c=>c.id===data.confirmRemove);
  if(index<0)return;
  const [crop]=dashboardCrops.splice(index,1);
  dashLog('listing-removed',dashMeEmail,crop.name);
  Object.values(dashboardCarts).forEach(cart=>{const i=cart.findIndex(l=>l.crop===crop.id);if(i>=0)cart.splice(i,1);});
  dashDialog.close();dashRender();
  dashToast(crop.name+' was removed from your listings.');return;
 }
 if(data.addMember!==undefined){dashMemberForm();return;}
 if(data.memberConfirm){
  const member=dashboardMembers.find(m=>m.id===data.memberConfirm);
  if(member){member.status='Active';dashRender();dashToast(member.name+' is now an active member.');}
  return;
 }
 if(data.memberRemove){
  const member=dashboardMembers.find(m=>m.id===data.memberRemove);
  if(member)dashOpen('<p class="detail-kicker">Member farmers</p><h2 id="detail-title">Remove '+de(member.name)+'?</h2><p class="detail-subtitle">They will no longer be listed as a member of '+de(dashOrgName)+'.</p><div class="detail-actions"><button class="control" data-close-dialog>Cancel</button><button class="control danger" data-member-remove-confirm="'+member.id+'">Remove member</button></div>');
  return;
 }
 if(data.memberRemoveConfirm){
  const index=dashboardMembers.findIndex(m=>m.id===data.memberRemoveConfirm);
  if(index>=0){const [member]=dashboardMembers.splice(index,1);dashDialog.close();dashRender();dashToast(member.name+' was removed from your members.');}
  return;
 }
 if(data.review&&data.reviewName){
  const org=dashboardOrganizations.find(o=>o.name===data.reviewName)!;
  org.status=data.review;
  if(data.review==='Active')org.approved=dashToday;
  const representative=dashboardAccounts.find(a=>a.organization===org.name&&a.status==='Pending');
  if(representative)representative.status=data.review==='Active'?'Active':'Declined';
  dashLog(data.review==='Active'?'application-approved':'application-declined',dashMeEmail,org.name,representative?.email||'');
  dashDialog.close();dashRender();
  dashToast(org.name+(data.review==='Active'?' approved. '+(representative?representative.name+' can now sign in.':''):' declined.'));return;
 }
 if(data.decide&&data.reportId){
  const report=dashboardReports.find(r=>r.id===data.reportId)!;
  report.status=data.decide;
  report.decided=report.status==='Open'?undefined:dashToday;
  dashLog(report.status==='Upheld'?'report-upheld':report.status==='Dismissed'?'report-dismissed':'report-reopened',dashMeEmail,report.id+' · '+report.organization);
  dashRender();dashReportDetails(report.id);
  dashToast(report.id+(report.status==='Open'?' reopened. ':' '+report.status.toLowerCase()+'. ')+dashStandingSentence(report.organization));return;
 }
 if(data.warn){dashWarningForm(data.warn);return;}
 if(data.terminate){dashTerminateDialog(data.terminate,data.terminateReport||'');return;}
 if(data.withdrawWarning){
  const index=dashboardWarnings.findIndex(w=>w.id===data.withdrawWarning);
  if(index>=0){const [w]=dashboardWarnings.splice(index,1);dashLog('warning-withdrawn',dashMeEmail,w.organization+' · '+w.reason,dashRepEmail(w.organization));dashRender();dashApplicationDetails(w.organization);dashToast('Warning withdrawn. '+dashStandingSentence(w.organization));}
  return;
 }
 if(data.reportId){dashReportDetails(data.reportId);return;}
 if(data.suspend){
  const account=dashAccountByEmail(data.suspend)!;
  account.status=account.status==='Suspended'?'Active':'Suspended';
  account.note=account.status==='Suspended'?'Suspended by '+dashAccount().name+' on '+dfull(dashToday)+'.':undefined;
  dashLog(account.status==='Suspended'?'account-suspended':'account-reactivated',dashMeEmail,account.name,account.email);
  dashRender();dashAccountDetails(account.email);
  dashToast(account.name+(account.status==='Suspended'?' is suspended and signed out of AniBayan.':' is reactivated.'));return;
 }
 if(data.resetPassword){dashResetPassword(data.resetPassword);return;}
 if(data.copy){
  const text=document.getElementById(data.copy)?.textContent||'';
  navigator.clipboard?.writeText(text).then(()=>dashToast('Copied.'),()=>dashToast('Copy didn’t work here; select the password and copy it.'));
  return;
 }
 if(data.account){dashAccountDetails(data.account);return;}
 if(data.rate){if(dashRequireBuyer())dashFeedbackForm(data.rate);return;}
 if(data.reportOrder){if(dashRequireBuyer())dashReportForm(data.reportOrder);return;}
 if(data.payOrder){dashPaymentDialog([data.payOrder]);return;}
 if(data.pay){
  void dashStartPayment(data.pay.split(','),target as HTMLButtonElement);return;
 }
 if(data.payLater!==undefined){dashDialog.close();dashNavigate('orders');dashToast('Your order is waiting for payment. Use Pay now in My orders when you’re ready.');return;}
 if(data.addListing!==undefined){dashListingForm();return;}
 if(data.editOrgProfile!==undefined){dashOrgProfileForm();return;}
 if(data.editProfile!==undefined){dashProfileForm();return;}
 if(data.changePassword!==undefined){dashPasswordForm();return;}
 if(data.resetData!==undefined){dashConfirmReset();return;}
 if(data.confirmReset!==undefined){dashResetStore();location.href='login.html';return;}
 if(data.addCart){
  const input=data.qtyFrom?document.getElementById(data.qtyFrom) as HTMLInputElement|null:null;
  dashAddToCart(data.addCart,input?Number(input.value):1);
  if(dashDialog.open&&!isGuest)dashProductDetails(data.addCart);
  return;
 }
 if(data.cartStep){
  const line=dashCart().find(l=>l.crop===data.cartStep);
  const crop=dashboardCrops.find(c=>c.id===data.cartStep);
  if(line&&crop){line.quantity=Math.max(1,Math.min(crop.stock,line.quantity+Number(data.step)));dashRender();}
  return;
 }
 if(data.cartRemove){
  const cart=dashCart();const index=cart.findIndex(l=>l.crop===data.cartRemove);
  if(index>=0){cart.splice(index,1);dashRender();dashToast('Removed from your cart.');}
  return;
 }
 if(data.cartClear!==undefined){dashCart().splice(0);dashRender();dashToast('Your cart is empty.');return;}
 if(data.checkout!==undefined){dashCheckoutForm();return;}
 if(data.shopReset!==undefined){dashState.shop={...dashShopDefaults};dashState.query='';dashRender();return;}
 if(data.shopRegion){
  dashState.shop={...dashShopDefaults,location:data.shopRegion};
  if(dashDialog.open)dashDialog.close();
  dashNavigate('shop');return;
 }
 if(data.healthCheck!==undefined){void dashRunHealthChecks().then(()=>dashToast('Health checks finished: '+(dashHealthSummary().down.length?dashPlural(dashHealthSummary().down.length,'service')+' down.':'every checked service is up.')));return;}
 if(data.order){dashOrderDetails(data.order);return;}
 if(data.product){dashProductDetails(data.product);return;}
 if(data.organization){if(isAdminDashboard)dashApplicationDetails(data.organization);else dashOpenOrgProfile(data.organization);return;}
 if(data.filter){dashState.filter=data.filter;dashRender();return;}
 if(data.chart){if(data.chartGroup==='hardware')dashState.hardwareChart=data.chart;else dashState.chart=data.chart;dashRender();return;}
 if(data.bar!==undefined){dashState.bar=Number(data.bar);dashRender();return;}
 if(data.save){
  if(!dashRequireBuyer())return;
  const id=data.save;const list=dashSavedList();const index=list.indexOf(id);
  if(index<0)list.push(id);else list.splice(index,1);
  dashRender();
  if(target.closest('#detail-dialog'))dashProductDetails(id);
  dashToast(index<0?'Harvest saved.':'Harvest removed from saved items.');return;
 }
 if(target.hasAttribute('data-close-dialog')){dashDialog.close();return;}
 if(target.id==='export-dashboard'){dashExport();return;}
 if(target.id==='collapse-sidebar'){
  if(dashNarrow.matches)document.body.classList.toggle('sidebar-open');
  else document.body.classList.toggle('sidebar-collapsed');
  return;
 }
 if(target.id==='show-notifications'){dashSetPopover('notification-panel','show-notifications',document.getElementById('notification-panel')!.hidden);return;}
 if(target.id==='workspace-toggle'){dashSetPopover('workspace-menu','workspace-toggle',document.getElementById('workspace-menu')!.hidden);}
}
// Admin and organization pages need a matching account; a signed-in account that was suspended is signed out.
if(dashNeedsSignIn||(dashSignedIn&&dashSignedIn.status!=='Active')){
 const notice=dashSignedIn&&dashSignedIn.status!=='Active'?dashSignedIn.status.toLowerCase():isAdminDashboard?'admin':'organization';
 if(dashSignedIn&&dashSignedIn.status!=='Active')dashClearSession();
 if(dashNeedsSignIn)location.replace('login.html?next='+encodeURIComponent(dashPageFile()+location.search+location.hash)+'&notice='+notice);
 else dashStart();
}else dashStart();
