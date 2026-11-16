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
const dashState={view:'overview',query:'',filter:'All',nextFilter:'',period:'week' as 'week'|'month',chart:'value',bar:99,shop:{...dashShopDefaults}};
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
const dashIsBuyable=(crop:DashboardCrop)=>crop.status==='Active'&&crop.stock>0&&dashFreshness(crop).left>=0;

/* ---------- Organization credit score ---------- */
// Credit score (0–100) = average buyer rating × 20, minus 10 points for every report an administrator upheld.
// Open reports don't count until they are reviewed and dismissed reports never count. Organizations without ratings are "New".
const dashReportPenalty=10;
interface DashCredit{score:number|null;base:number;rating:number;reviews:number;upheld:number;open:number;band:string;tone:string}
function dashCredit(org:string):DashCredit{
 const ratings=dashboardFeedback.filter(f=>f.organization===org).map(f=>f.rating);
 const reports=dashboardReports.filter(r=>r.organization===org);
 const upheld=reports.filter(r=>r.status==='Upheld').length;
 const rating=ratings.length?ratings.reduce((sum,r)=>sum+r,0)/ratings.length:0;
 const base=Math.round(rating*20);
 const score=ratings.length?Math.max(0,Math.min(100,base-upheld*dashReportPenalty)):null;
 const band=score===null?'New':score>=90?'Excellent':score>=75?'Good':score>=60?'Fair':'At risk';
 return {score,base,rating,reviews:ratings.length,upheld,open:reports.filter(r=>r.status==='Open').length,band,tone:band.toLowerCase().replace(/ /g,'-')};
}
function dashScoreBadge(org:string):string{
 const c=dashCredit(org);
 return '<span class="score-badge '+c.tone+'" title="AniBayan credit score">'+(c.score===null?'New · no ratings yet':'<strong>'+c.score+'</strong>/100 · '+c.band)+'</span>';
}
function dashRatingText(org:string):string{
 const c=dashCredit(org);
 return c.reviews?'<span class="rating"><b aria-hidden="true">★</b> '+c.rating.toFixed(1)+' <small>('+dashPlural(c.reviews,'review')+')</small></span>':'<span class="rating">No reviews yet</span>';
}
const dashStars=(rating:number)=>'<span class="stars" role="img" aria-label="Rated '+rating+' out of 5">'+'★'.repeat(rating)+'<span class="stars-off">'+'★'.repeat(5-rating)+'</span></span>';
function dashScoreExplainer(org:string):string{
 const c=dashCredit(org);
 const ring='<div class="score-ring '+c.tone+'" style="--score:'+(c.score??0)+'"><span><strong>'+(c.score??'–')+'</strong><small>'+(c.score===null?'New':'of 100')+'</small></span></div>';
 if(c.score===null)return '<div class="score-explainer">'+ring+'<p class="score-empty">No buyer ratings yet. The credit score appears after the first rating.</p></div>';
 return '<div class="score-explainer">'+ring+'<dl class="score-lines"><div><dt>Average rating '+c.rating.toFixed(1)+' ★ × 20</dt><dd>'+c.base+'</dd></div><div><dt>Upheld reports ('+c.upheld+' × −'+dashReportPenalty+')</dt><dd>'+(c.upheld?'−'+c.upheld*dashReportPenalty:'0')+'</dd></div><div class="score-total"><dt>Credit score</dt><dd>'+c.score+' · '+c.band+'</dd></div></dl></div>';
}
const dashRated=(orderId:string)=>dashboardFeedback.some(f=>f.order===orderId);
const dashMyReport=(orderId:string)=>dashboardReports.find(r=>r.order===orderId&&r.customer===dashConsumerName);
const dashRegion=(org:string)=>dashboardOrganizations.find(o=>o.name===org)?.region||'';
const dashOpenReports=()=>dashboardReports.filter(r=>r.status==='Open').length;
const dashPendingApplications=()=>dashboardOrganizations.filter(o=>o.status==='Pending review').length;
const dashListingCount=(org:string)=>dashboardCrops.filter(c=>c.organization===org&&dashIsBuyable(c)).length;

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
// Services AniBayan will connect to, with their current state.
const dashIntegrations=[['PayMongo payments','Online payments','Test mode','Card and GCash payments are simulated; no money is charged.'],['Tawk.to live chat','Customer support chat','Not connected','Live chat is not set up yet.'],['Email notifications','Order and account emails','Not connected','Email sending is not set up yet.']];
async function dashRunHealthChecks():Promise<void>{
 if(dashChecking)return;
 dashChecking=true;dashRender();
 const results:DashboardHealthResult[]=[];
 for(const [service,,run] of dashHealthChecks){
  try{results.push({service,ok:true,latency:Math.round(await run())});}
  catch(error){results.push({service,ok:false,latency:0,error:error instanceof Error?error.message:String(error)});}
 }
 dashboardHealthLog.push({time:new Date().toISOString(),results});
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
  nav:[['overview','grid','Overview'],['accounts','people','Accounts'],['reports','flag','User reports'],['applications','clipboard','Applications'],['health','pulse','Site health']],
  settingsNav:['settings','settings','Settings'],
  user:dashUserName,userRole:'Platform administrator',initials:'AD',
  search:'Search accounts, reports, applications…',
  cardIcon:'shield',cardTitle:'Platform oversight',cardText:'Accounts, user reports, organization applications and site health.',
  shortcut:['Public homepage','index.html','home'],
  titles:{overview:['Admin overview','Accounts, user reports, organization applications and site health.'],accounts:['Account management','Consumer, representative and administrator accounts.'],reports:['User reports','Reports buyers filed about organizations. Upheld reports lower the organization’s credit score.'],applications:['Organization applications','Farmer organizations asking to sell on AniBayan.'],health:['Site health','Live checks of AniBayan’s services, plus the history of recent checks.'],settings:['Workspace settings','Your administrator account and preferences.'],help:dashHelpTitle},
 },
 organization:{
  page:'organization.html',workspace:'Organization workspace',navLabel:'Your organization',
  nav:[['overview','grid','Overview'],['orders','bag','Incoming orders'],['listings','box','My listings'],['feedback','star','Ratings & feedback'],['members','people','Member farmers'],['payments','wallet','Payments']],
  settingsNav:['settings','store','Organization profile'],
  user:dashUserName,userRole:'Organization representative',initials:dashInitials(dashUserName),
  search:'Search your orders, listings, feedback…',
  cardIcon:'leaf',cardTitle:dashOrgName,cardText:dashOrgAtLoad?dashOrgAtLoad.region+' · '+dashOrgAtLoad.crops:'',
  shortcut:['View public storefront','consumer.html?grower='+encodeURIComponent(dashOrgName)+'#growers','store'],
  titles:{overview:[dashOrgName,'Orders, listings and members for your organization.'],orders:['Incoming orders','Confirm, prepare and complete orders from your buyers.'],listings:['My listings','The crops your organization offers. Buyers see each harvest date and shelf life.'],feedback:['Ratings & feedback','What buyers say about your organization, and how your credit score is calculated.'],members:['Member farmers','The growers who supply your organization.'],payments:['Payments','Payment status for your organization’s orders.'],settings:['Organization profile','How your organization appears on AniBayan.'],help:dashHelpTitle},
 },
 consumer:{
  page:'consumer.html',workspace:isGuest?'AniBayan market':'My AniBayan',navLabel:isGuest?'Browse':'Your account',
  nav:isGuest?[['shop','store','Shop'],['growers','leaf','Growers']]:[['overview','grid','Overview'],['shop','store','Shop'],['cart','cart','Cart'],['orders','bag','My orders'],['saved','heart','Saved harvests'],['growers','leaf','My growers'],['payments','wallet','Payment history']],
  settingsNav:isGuest?null:['settings','user','My profile'],
  user:dashUserName,userRole:isGuest?'Not signed in':'Buyer account',initials:isGuest?'?':dashInitials(dashUserName),
  search:'Search harvests, orders and growers…',
  cardIcon:'leaf',cardTitle:'Good food starts here.',cardText:'Discover fresh harvests and the communities behind them.',
  shortcut:['Shop the harvest','#shop','store'],
  titles:{overview:['Your harvest, at a glance.','Welcome back, '+dashUserName.split(' ')[0]+'. Good things are on their way.'],shop:['Shop the harvest',isGuest?'Fresh harvests from local growing communities. Sign in to order.':'Filter by price, crop type, harvest time and location.'],cart:['Your cart','Each organization fulfils its own order.'],orders:['My orders','Follow each order, then rate it or report a problem.'],saved:['Saved harvests','Crops you want to come back to.'],growers:[isGuest?'Growing communities':'Your growing communities','The organizations behind your food, with their buyer ratings and credit scores.'],payments:['Payment history','Payments for your orders.'],settings:['Your profile','Your account, delivery details and preferences.'],help:dashHelpTitle},
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
  if(dashOpenReports())notes.push([dashPlural(dashOpenReports(),'user report')+' waiting for your decision.','reports','Review user reports']);
  dashHealthSummary().down.forEach(r=>notes.push([r.service+' failed its last check.','health','View site health']));
  return notes;
 }
 if(isGuest)return [['Sign in to order fresh harvests and follow your deliveries.','shop','Shop the harvest']];
 const orders=dashRoleOrders();
 if(isOrgDashboard){
  const notes:string[][]=[];
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

function dashShell():void{
 const link=(item:string[])=>'<a href="#'+item[0]+'" data-nav="'+item[0]+'" title="'+de(item[2])+'">'+di(item[1])+'<span>'+de(item[2])+'</span><span class="nav-count" data-nav-count="'+item[0]+'" hidden></span></a>';
 const me=dashMe();
 const avatar='<span class="avatar '+dashboardRole+'-avatar">'+dashRole.initials+'</span>';
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
 return '<article class="metric"><div class="metric-top"><span>'+label+'</span>'+di(icon)+'</div><div class="metric-value"><strong>'+value+'</strong>'+(trend?'<span class="trend'+(down?' down':'')+'">'+(down?'↘ ':'↗ ')+trend+'</span>':'')+'</div><p class="metric-caption">'+caption+'</p></article>';
}
function dashPanelHead(title:string,note:string,action=''):string{
 return '<div class="panel-head"><div><h2>'+title+'</h2>'+(note?'<p>'+note+'</p>':'')+'</div>'+action+'</div>';
}
// A bar chart panel with one tab per data series; dashState.chart picks the visible series.
interface DashSeries{key:string;tab:string;title:string;note:string;legend:string;values:number[];scale:number;axis:(value:number)=>string;caption:(value:number)=>string;suffix:string}
function dashBarChart(series:DashSeries[],labels:string[],chip:string,foot:string):string{
 const s=series.find(item=>item.key===dashState.chart)||series[0];
 const selected=Math.min(dashState.bar,s.values.length-1);
 const bars=s.values.map((value,index)=>{
   const caption=s.caption(value);
   return '<div class="chart-column"><button class="chart-bar '+(selected===index?'selected':'')+'" style="--bar-height:'+Math.min(100,Math.round(value/s.scale*100))+'%" data-bar="'+index+'" aria-pressed="'+(selected===index)+'" aria-label="'+labels[index]+': '+caption+s.suffix+'"><span>'+caption+'</span></button><span class="chart-day">'+labels[index]+'</span></div>';
 }).join('');
 return '<section class="panel">'+dashPanelHead(s.title,s.note,'<span class="chip">'+chip+'</span>')+'<div class="chart-tabs">'+series.map(item=>'<button data-chart="'+item.key+'" aria-pressed="'+(item===s)+'">'+item.tab+'</button>').join('')+'</div><div class="chart-body"><div class="chart-axis">'+[1,.75,.5,.25,0].map(part=>'<span>'+s.axis(Math.round(part*s.scale*100)/100)+'</span>').join('')+'</div><div class="bar-chart">'+bars+'</div></div><div class="chart-foot"><span><i class="legend-dot"></i> '+s.legend+'</span><span>'+foot+'</span></div></section>';
}
function dashChart(period:DashboardPeriod,valueNote:string,volumeNote:string):string{
 return dashBarChart([
  {key:'value',tab:'Order value',title:'Order value',note:valueNote,legend:'Order value',values:period.values,scale:period.valueScale,axis:value=>'₱'+value+'k',caption:value=>dp(value*1000),suffix:''},
  {key:'orders',tab:'Order volume',title:'Order activity',note:volumeNote,legend:'Placed orders',values:period.orderValues,scale:period.orderScale,axis:value=>String(value),caption:value=>String(value),suffix:' orders'},
 ],period.labels,dashState.period==='week'?'Last 7 days':'Last 4 weeks',period.label);
}
function dashMatching(text:string):boolean{return text.toLowerCase().includes(dashState.query.trim().toLowerCase());}
function dashEmpty(title:string,description:string):string{return '<div class="empty-state"><h2>'+title+'</h2><p>'+description+'</p></div>';}
function dashFilters(options:string[],summary:string):string{
 return '<div class="filters">'+options.map(f=>'<button class="filter-chip" data-filter="'+f+'" aria-pressed="'+(dashState.filter===f)+'">'+f+'</button>').join('')+'<span class="filter-summary">'+summary+'</span></div>';
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
const dashAvatarClass=(role:string)=>role==='Administrator'?'admin-avatar':role==='Representative'?'organization-avatar':'consumer-avatar';
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
 return '<section class="panel">'+head+(limit?'':dashFilters(['All','Open','Upheld','Dismissed'],dashPlural(reports.length,'report')))+'<div class="table-wrap">'+table+'</div></section>';
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
 const rows=accounts.map(a=>'<tr><td><div class="table-product"><span class="avatar '+dashAvatarClass(a.role)+'">'+dashInitials(a.name)+'</span><div><strong>'+de(a.name)+'</strong><small>'+de(a.email)+'</small></div></div></td><td>'+(a.role==='Consumer'?'Buyer':a.role)+(a.organization?'<small class="cell-note">'+de(a.organization)+'</small>':'')+'</td><td>'+dfull(a.joined)+'</td><td>'+dd(a.lastActive)+'</td><td>'+ds(a.status)+'</td><td><div class="row-actions"><button class="control small" data-account="'+de(a.email)+'">Manage</button></div></td></tr>').join('');
 const table=accounts.length?'<table><thead><tr><th scope="col">Account</th><th scope="col">Role</th><th scope="col">Joined</th><th scope="col">Last active</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>'+rows+'</tbody></table>':dashEmpty('No matching accounts','Try a different name, email, role or status.');
 return metrics+'<section class="panel">'+dashPanelHead('Accounts','')+dashFilters(['All','Buyer','Representative','Administrator','Pending','Suspended'],dashPlural(accounts.length,'account'))+'<div class="table-wrap">'+table+'</div></section>';
}
function dashReportsView():string{
 const n=(status:string)=>dashboardReports.filter(r=>r.status===status).length;
 return '<div class="metric-grid three">'+dashMetric('Open reports',String(n('Open')),'flag','Waiting for your decision')+dashMetric('Upheld',String(n('Upheld')),'check','Each lowers the credit score by '+dashReportPenalty)+dashMetric('Dismissed',String(n('Dismissed')),'clock','No effect on the credit score')+'</div><p class="sample-callout">Credit score = average buyer rating × 20, minus '+dashReportPenalty+' points for every upheld report. Open reports don’t count until you decide.</p>'+dashReportTable(0);
}
function dashApplicationsView():string{
 const n=(status:string)=>dashboardOrganizations.filter(o=>dashAppStatus(o)===status).length;
 const apps=dashApplicationList();
 const table=apps.length?'<table><thead><tr><th scope="col">Organization</th><th scope="col">Representative</th><th scope="col">Members</th><th scope="col">Documents</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>'+apps.map(o=>{
  const pending=o.status==='Pending review';
  return '<tr><td><div class="table-product"><img class="round" src="'+dashImg(o.image)+'" alt=""><div><strong>'+de(o.name)+'</strong><small>'+de(o.region)+'</small></div></div></td><td>'+de(o.representative)+'</td><td>'+o.members+'</td><td>'+dashPlural(o.documents.length,'file')+'</td><td>'+dfull(o.applied)+'</td><td>'+ds(dashAppStatus(o))+'</td><td><div class="row-actions"><button class="control small'+(pending?' primary':'')+'" data-organization="'+de(o.name)+'">'+(pending?'Review application':'View')+'</button></div></td></tr>';
 }).join('')+'</tbody></table>':dashEmpty('No matching applications','Try a different name, place or status.');
 return '<div class="metric-grid three">'+dashMetric('Awaiting review',String(n('Pending review')),'clock','Organizations asking to sell')+dashMetric('Approved',String(n('Approved')),'check','Selling on AniBayan')+dashMetric('Declined',String(n('Declined')),'flag','Can apply again with complete documents')+'</div><section class="panel">'+dashPanelHead('Applications','')+dashFilters(['All','Pending review','Approved','Declined'],dashPlural(apps.length,'application'))+'<div class="table-wrap">'+table+'</div></section>';
}
function dashHealthView():string{
 const summary=dashHealthSummary();
 const failures:{time:string;result:DashboardHealthResult}[]=[];
 dashboardHealthLog.slice().reverse().forEach(run=>run.results.filter(r=>!r.ok).forEach(result=>failures.push({time:run.time,result})));
 const shown=failures.filter(f=>dashMatching(f.result.service+' '+(f.result.error||''))).slice(0,10);
 const incidents='<section class="panel">'+dashPanelHead('Failed checks','Most recent first')+'<div class="incident-list">'+(shown.length?shown.map(f=>'<article class="incident-row"><div class="incident-top"><strong>'+de(f.result.service)+' check failed</strong>'+ds('Down')+'</div><small>'+dtime(f.time)+'</small><p>'+de(f.result.error||'No details were recorded.')+'</p></article>').join(''):dashEmpty('No failed checks','Every recorded check passed.'))+'</div></section>';
 return '<div class="metric-grid">'+dashMetric('Checks passed',summary.uptime,'pulse',summary.runs?'Across the last '+dashPlural(summary.runs,'run'):'No checks yet')+dashMetric('Average response',summary.average===null?'–':dashLatency(summary.average),'clock','Web application, across recorded checks')+dashMetric('Failure rate',summary.errorRate,'flag',dashPlural(summary.failures,'failed check')+' recorded')+dashMetric('Services down',String(summary.down.length),'bell',summary.down.length?summary.down.map(r=>r.service).join(', '):'All checked services are up')+'</div><div class="split">'+dashHealthChart()+dashServicesPanel()+'</div>'+incidents;
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
 return metrics+'<div class="split">'+dashChart(p,'Placed order totals for your organization','Orders placed with your organization')+queue+'</div><div class="split">'+dashOrderTable('recent')+stock+'</div>';
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
 return '<article class="feedback-row"><header>'+dashStars(f.rating)+'<small>'+dd(f.date)+'</small></header><p>'+(f.comment?'“'+de(f.comment)+'”':'No comment left.')+'</p><small>'+de(f.customer)+(f.order?' · order '+dashOrderNo(f.order):'')+'</small></article>';
}
function dashOrgFeedback():string{
 const c=dashCredit(dashOrgName);
 const feedback=dashOrgFeedbackList();
 const reports=dashboardReports.filter(r=>r.organization===dashOrgName).sort((a,b)=>b.date.localeCompare(a.date));
 const metrics='<div class="metric-grid">'+dashMetric('Credit score',c.score===null?'New':c.score+'<small class="metric-unit">/100</small>','shield',c.score===null?'Appears after your first rating':c.band+' standing with buyers')+dashMetric('Average rating',c.reviews?c.rating.toFixed(1)+' ★':'–','star','From '+dashPlural(c.reviews,'buyer review'))+dashMetric('Reports under review',String(c.open),'clock','Not counted until an administrator decides')+dashMetric('Upheld reports',String(c.upheld),'flag','−'+dashReportPenalty+' points each')+'</div>';
 const list='<section class="panel">'+dashPanelHead('Buyer feedback','Newest first','<span class="filter-summary">'+dashPlural(feedback.length,'review')+'</span>')+'<div class="feedback-list">'+(feedback.length?feedback.map(dashFeedbackRow).join(''):dashEmpty(c.reviews?'No matching feedback':'No ratings yet',c.reviews?'Try a different search.':'Buyers can rate their orders once you complete them.'))+'</div></section>';
 const explainer='<section class="panel">'+dashPanelHead('How your credit score works','')+dashScoreExplainer(dashOrgName)+'<p class="score-help">Buyers rate completed orders from 1 to 5 stars. Reports go to AniBayan administrators first: only upheld reports lower your score, and dismissed reports never count.</p></section>';
 const table=reports.length?'<table><thead><tr><th scope="col">Report</th><th scope="col">Reason</th><th scope="col">Details</th><th scope="col">Status</th></tr></thead><tbody>'+reports.map(r=>'<tr><td><strong>'+r.id+'</strong><small class="cell-note">'+dfull(r.date)+'</small></td><td>'+de(r.reason)+'</td><td class="wrap">'+de(r.details)+'</td><td>'+ds(r.status)+'</td></tr>').join('')+'</tbody></table>':dashEmpty('No reports','Buyers haven’t reported a problem with your organization.');
 return metrics+'<div class="split">'+list+explainer+'</div><section class="panel">'+dashPanelHead('Reports about your organization','Reviewed by AniBayan administrators')+'<div class="table-wrap">'+table+'</div></section>';
}
const dashMyMembers=()=>dashboardMembers.filter(m=>m.organization===dashOrgName);
function dashMembers():string{
 const all=dashMyMembers();
 const members=all.filter(m=>dashMatching([m.name,m.place,m.crops,m.status].join(' ')));
 const area=all.reduce((sum,m)=>sum+m.area,0);
 const province=dashOrgProfile().region.split(', ')[0];
 const actions=(m:DashboardMember)=>'<div class="row-actions">'+(m.status==='Pending'?'<button class="control small primary" data-member-confirm="'+m.id+'">'+di('check')+'Confirm</button>':'')+'<button class="control small" data-member-remove="'+m.id+'">Remove</button></div>';
 return '<div class="metric-grid three">'+dashMetric('Member farmers',String(all.length),'people','Growers supplying your organization')+dashMetric('Farmed area',area.toFixed(1)+' ha','pin','Across all member farms')+dashMetric('Pending membership',String(all.filter(m=>m.status==='Pending').length),'clock','Awaiting your confirmation')+'</div><section class="panel">'+dashPanelHead('Members','','<span class="filter-summary">'+dashPlural(members.length,'member')+'</span>')+'<div class="table-wrap">'+(members.length?'<table><thead><tr><th scope="col">Farmer</th><th scope="col">Location</th><th scope="col">Crops</th><th scope="col">Area</th><th scope="col">Member since</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>'+members.map(m=>'<tr><td><div class="table-product"><span class="avatar organization-avatar">'+dashInitials(m.name)+'</span><strong>'+de(m.name)+'</strong></div></td><td>'+de(m.place)+', '+de(province)+'</td><td>'+de(m.crops)+'</td><td>'+m.area.toFixed(1)+' ha</td><td>'+de(m.joined)+'</td><td>'+ds(m.status)+'</td><td>'+actions(m)+'</td></tr>').join('')+'</tbody></table>':dashEmpty(all.length?'No matching members':'No member farmers yet',all.length?'Try a different name, place or crop.':'Add the farmers who supply your organization.'))+'</div></section>';
}
function dashOrgPayments():string{
 const orders=dashRoleOrders().filter(o=>o.status!=='Cancelled');
 const sum=(payment:string)=>orders.filter(o=>o.payment===payment).reduce((total,o)=>total+o.total,0);
 return '<div class="metric-grid three">'+dashMetric('Paid orders',dp(sum('Paid')),'check',dashPlural(orders.filter(o=>o.payment==='Paid').length,'order')+' paid')+dashMetric('Awaiting payment',dp(sum('Unpaid')),'clock',dashPlural(orders.filter(o=>o.payment==='Unpaid').length,'order')+' unpaid')+dashMetric('Open orders',String(orders.filter(o=>o.status!=='Completed').length),'bag','Not yet completed')+'</div><p class="sample-callout">Cash-on-delivery orders are marked paid when you complete them. Card and GCash orders are paid by the buyer at checkout.</p>'+dashOrderTable('payments');
}

/* ---------- Consumer: shop, cart, saved harvests and growers ---------- */
const dashShopCrops=()=>dashboardCrops.filter(dashIsBuyable);
const dashShopSorts:Record<string,[string,(a:DashboardCrop,b:DashboardCrop)=>number]>={
 fresh:['Freshest harvest first',(a,b)=>dashFreshness(a).age-dashFreshness(b).age],
 'price-asc':['Price: low to high',(a,b)=>a.price-b.price],
 'price-desc':['Price: high to low',(a,b)=>b.price-a.price],
 score:['Highest credit score',(a,b)=>(dashCredit(b.organization).score??-1)-(dashCredit(a.organization).score??-1)],
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
function dashConsumerTile(c:DashboardCrop):string{
 const saved=dashIsSaved(c.id);
 const buyable=dashIsBuyable(c);
 const badge=buyable?dashFreshBadge(c):ds(c.stock===0?'Out of stock':c.status!=='Active'?'Paused':'Past shelf life');
 return '<article class="product-tile"><img src="'+dashImg(c.image)+'" alt="'+de(c.name)+'"><div class="product-tile-copy"><div class="product-tile-head"><h2>'+de(c.name)+'</h2><button class="save-button" data-save="'+c.id+'" aria-pressed="'+saved+'" aria-label="'+(saved?'Unsave ':'Save ')+de(c.name)+'">'+di('heart')+'</button></div><p>'+de(c.organization)+' · '+dashRatingText(c.organization)+'<br>'+de(c.category)+' · '+de(dashRegion(c.organization))+'</p><div class="product-price"><strong>'+dp(c.price)+'</strong> / '+de(c.unit)+'</div>'+dashHarvestLine(c)+'<div class="product-bottom">'+badge+'<span class="row-actions"><button class="control small" data-product="'+c.id+'">Details</button>'+(buyable?'<button class="control small primary" data-add-cart="'+c.id+'">'+di('cart')+'Add to cart</button>':'')+'</span></div></div></article>';
}
const dashShopSummary=(shown:number)=>shown+' of '+dashPlural(dashShopCrops().length,'harvest');
function dashShopGrid(crops:DashboardCrop[]):string{
 if(crops.length)return '<div class="product-grid">'+crops.map(dashConsumerTile).join('')+'</div>';
 const [min,max]=dashPriceBounds();
 const reversed=min!==null&&max!==null&&min>max;
 const unavailable=dashState.query.trim()?dashboardCrops.filter(c=>!dashIsBuyable(c)&&dashMatching(c.name+' '+c.organization+' '+c.category)):[];
 const description=reversed?'Swap the two prices or clear one of them.':unavailable.length?unavailable.map(c=>c.name+' is '+(c.stock===0?'out of stock':c.status!=='Active'?'paused by its grower':'past its shelf life')).join('. ')+' right now.':'Try a wider price range, another crop type, harvest time or location.';
 return '<section class="panel">'+dashEmpty(reversed?'The minimum price is higher than the maximum.':'No harvests match these filters.',de(description))+'<div class="empty-action"><button class="control" data-shop-reset>Clear filters</button></div></section>';
}
function dashShop():string{
 const s=dashState.shop;
 const crops=dashShopList();
 const prices=dashShopCrops().map(c=>c.price);
 const opt=(value:string,label:string,current:string)=>'<option value="'+de(value)+'"'+(value===current?' selected':'')+'>'+de(label)+'</option>';
 const types=[...new Set(dashboardCrops.map(c=>c.category))].sort();
 const regions=[...new Set(dashboardOrganizations.filter(o=>o.status==='Active').map(o=>o.region))].sort();
 const price=(key:'min'|'max',label:string,bound:number)=>'<input type="number" min="0" step="1" inputmode="numeric" data-shop="'+key+'" value="'+de(s[key])+'" placeholder="'+label+' '+bound+'" aria-label="'+(key==='min'?'Minimum':'Maximum')+' price in pesos">';
 return '<section class="panel shop-filters" aria-label="Filter harvests"><div class="shop-filter-grid">'
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
 const list='<section class="panel">'+dashPanelHead('Items',dashPlural(entries.length,'harvest')+' from '+dashPlural(orgs.length,'organization'),'<button class="text-button" data-cart-clear>Clear cart</button>')+'<div class="cart-list">'+orgs.map(org=>'<div class="cart-group"><div class="cart-group-head"><strong>'+de(org)+'</strong>'+dashScoreBadge(org)+'</div>'+entries.filter(e=>e.crop.organization===org).map(row).join('')+'</div>').join('')+'</div></section>';
 const summary='<section class="panel cart-summary">'+dashPanelHead('Order summary','')+'<dl class="summary-lines">'+orgs.map(org=>'<div><dt>'+de(org)+'</dt><dd>'+dp(subtotal(org))+'</dd></div>').join('')+'<div class="summary-total"><dt>Total</dt><dd>'+dp(total)+'</dd></div></dl><p class="summary-note">'+(orgs.length>1?'You’ll place '+orgs.length+' orders, one with each organization.':'Your order goes straight to '+de(orgs[0])+'.')+' Delivery is arranged with each organization.</p>'+(problems?'<p class="cart-problem summary-problem">Remove or update '+dashPlural(problems,'item')+' before checking out.</p>':'')+'<div class="summary-actions"><button class="control primary" data-checkout'+(problems?' disabled':'')+'>Check out '+di('arrow')+'</button></div></section>';
 return '<div class="split cart-split">'+list+summary+'</div>';
}
function dashSavedView():string{
 const crops=dashboardCrops.filter(c=>dashIsSaved(c.id)&&dashMatching(c.name+' '+c.organization+' '+c.category));
 return '<div class="filters bare"><button class="text-button" data-go="shop">Browse the shop '+di('arrow')+'</button><span class="filter-summary">'+dashPlural(dashSavedList().length,'saved harvest')+'</span></div>'+(crops.length?'<div class="product-grid">'+crops.map(dashConsumerTile).join('')+'</div>':'<section class="panel">'+dashEmpty('No saved harvests here yet.','Save a harvest from the shop to see it here.')+'</section>');
}
function dashOrganizationGrid():string{
 const orgs=dashboardOrganizations.filter(o=>o.status==='Active'&&dashMatching(o.name+' '+o.region+' '+o.crop));
 return orgs.length?'<div class="org-grid">'+orgs.map(o=>'<article class="org-card"><img src="'+dashImg(o.image)+'" alt="'+de(o.name)+'"><div><h2>'+de(o.name)+'</h2><p>'+de(o.region)+' · '+de(o.crop)+'</p><p class="org-score">'+dashScoreBadge(o.name)+dashRatingText(o.name)+'</p><footer><span class="filter-summary">'+dashPlural(dashListingCount(o.name),'listing')+'</span><button class="control" data-organization="'+de(o.name)+'">View community '+di('up')+'</button></footer></div></article>').join('')+'</div>':'<section class="panel">'+dashEmpty('No matching communities','Try a different place or name.')+'</section>';
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
 return '<section class="consumer-banner"><div class="eyebrow">Rooted in community. Grown for you.</div><h2>Fresh from their fields.<br>A little closer to your table.</h2><p>Meet the people behind your everyday food.</p><button class="control primary" data-go="shop">Explore the harvest '+di('arrow')+'</button><img class="banner-harvest" src="assets/vegetable-cutout.png" alt=""><img class="banner-leaf" src="assets/mango-branch.png" alt=""></section><div class="metric-grid">'+dashMetric('Active orders',String(own.filter(o=>!['Completed','Cancelled'].includes(o.status)).length),'bag','Being prepared by your growers')+dashMetric('Completed orders',String(own.filter(o=>o.status==='Completed').length),'check','Local harvests brought home')+dashMetric('Saved harvests',String(saved.length),'heart','Good things to come back to')+dashMetric('Growing connections',String(new Set(own.map(o=>o.organization)).size),'leaf','Communities you’ve ordered from')+'</div><div class="split">'+dashActiveOrder()+'<section class="panel grower-mini"><img src="assets/grower.png" alt="A grower in the Benguet highlands"><div class="grower-mini-copy"><small>The people behind your harvest</small><h2>Rooted in the<br>Benguet highlands.</h2><a href="#growers">Meet your growing community '+di('up')+'</a></div></section></div><div class="split">'+dashOrderTable('recent')+'<section class="panel">'+dashPanelHead('Saved for later','','<button class="text-button" data-go="saved">View all '+di('arrow')+'</button>')+'<div class="saved-mini">'+saved.slice(0,4).map(c=>'<div class="saved-row"><img src="'+dashImg(c.image)+'" alt=""><div><strong>'+de(c.name)+'</strong><p>'+dp(c.price)+' / '+de(c.unit)+' · harvested '+dd(c.harvested)+'</p></div><button class="save-button" data-save="'+c.id+'" aria-pressed="true" aria-label="Unsave '+de(c.name)+'">'+di('heart')+'</button></div>').join('')+(saved.length?'':dashEmpty('Nothing saved yet','Your saved harvests will appear here.'))+'</div></section></div>';
}
function dashSettings():string{
 const appearance='<section class="panel settings-panel"><h2>Appearance</h2><p>Adjust the dashboard to your preferred reading density. Saved in this browser.</p><div class="settings-row"><label for="density">Compact table rows</label><input type="checkbox" id="density" '+(document.body.classList.contains('compact-density')?'checked':'')+'></div><div class="settings-row"><label for="contrast">Stronger contrast</label><input type="checkbox" id="contrast" '+(document.body.classList.contains('contrast-mode')?'checked':'')+'></div><h2 class="settings-subhead">Data</h2><p>AniBayan keeps its accounts, listings, orders, ratings and reports in this browser, shared by every AniBayan page you open here.</p><div class="detail-actions"><button class="control danger" data-reset-data>Reset all data</button></div></section>';
 const facts=(rows:string[][])=>'<dl class="detail-facts">'+rows.map(r=>'<div><dt>'+r[0]+'</dt><dd>'+de(r[1])+'</dd></div>').join('')+'</dl>';
 const me=dashAccount();
 const common='<a class="control" href="login.html" data-sign-out>'+di('logout')+'Sign out</a><button class="control" data-change-password>'+di('key')+'Change password</button>';
 let account='';
 if(isAdminDashboard)account='<section class="panel settings-panel"><h2>Administrator account</h2>'+facts([['Name',me.name],['Email',me.email],['Role','Platform administrator'],['Administrator since',dmonth(me.joined)]])+'<div class="detail-actions">'+common+'</div></section>';
 else if(isOrgDashboard){
  const o=dashOrgProfile();const credit=dashCredit(o.name);
  account='<section class="panel settings-panel"><h2>'+de(o.name)+'</h2><p>'+ds('Active')+' &nbsp;'+de(o.verified)+'</p>'+(o.description?'<p>'+de(o.description)+'</p>':'')+facts([['Location',o.region],['Main crops',o.crops],['Representative',o.representative],['Contact email',o.email],['Contact number',o.phone||'Not added yet'],['Credit score',credit.score===null?'New · no ratings yet':credit.score+'/100 · '+credit.band]])+'<div class="detail-actions">'+common+'<a class="control" href="consumer.html?grower='+encodeURIComponent(o.name)+'#growers">View storefront '+di('up')+'</a><button class="control primary" data-edit-org-profile>'+di('edit')+'Edit profile</button></div></section>';
 }else account='<section class="panel settings-panel"><h2>Your account</h2>'+facts([['Name',me.name],['Email',me.email],['Mobile number',me.phone||'Not added yet'],['Member since',dmonth(me.joined)],['Delivery address',me.address||'Not added yet']])+'<div class="detail-actions">'+common+'<button class="control primary" data-edit-profile>'+di('edit')+'Edit delivery details</button></div></section>';
 return '<div class="settings-grid">'+account+appearance+'</div>';
}
function dashHelp():string{
 const rows=isAdminDashboard?[['Suspend, reactivate or reset accounts','accounts','Accounts'],['Uphold or dismiss reports from buyers','reports','User reports'],['Approve or decline organization applications','applications','Applications'],['Check that AniBayan’s services are up','health','Site health']]
  :isOrgDashboard?[['Confirm and prepare incoming orders','orders','Incoming orders'],['Add, edit or pause crop listings','listings','My listings'],['See your ratings and credit score','feedback','Ratings & feedback'],['Add or confirm member farmers','members','Member farmers'],['Update your organization profile','settings','Organization profile']]
  :isGuest?[['Browse and filter harvests','shop','Shop'],['Meet the growing communities','growers','Growers']]
  :[['Browse and filter harvests','shop','Shop'],['Check out your cart','cart','Cart'],['Follow, pay, rate or report your orders','orders','My orders'],['Update your delivery details','settings','My profile']];
 return '<section class="panel settings-panel"><h2>Here to help you grow.</h2><p>Where to go for each task.</p>'+rows.map(r=>'<div class="settings-row"><span>'+r[0]+'</span><button class="control" data-go="'+r[1]+'">'+r[2]+' '+di('arrow')+'</button></div>').join('')+(isGuest?'<div class="settings-row"><span>Order harvests, save favourites and rate growers</span><a class="control primary" href="login.html" data-sign-in>Sign in '+di('arrow')+'</a></div>':'')+'</section>';
}
// Sidebar badges: open reports and pending applications for admins, orders needing attention otherwise, cart lines for buyers.
function dashNavCounts():Record<string,number>{
 if(isAdminDashboard)return {reports:dashOpenReports(),applications:dashPendingApplications()};
 const orders=dashRoleOrders();
 if(isOrgDashboard)return {orders:orders.filter(o=>o.status==='Pending').length,members:dashMyMembers().filter(m=>m.status==='Pending').length};
 return {orders:orders.filter(o=>!['Completed','Cancelled'].includes(o.status)).length,cart:dashCart().length};
}
let dashStorageWarned=false;
function dashRender():void{
 const search=document.getElementById('dashboard-search') as HTMLInputElement;
 if(search.value!==dashState.query)search.value=dashState.query;
 document.querySelectorAll<HTMLElement>('[data-nav]').forEach(a=>{if(a.dataset.nav===dashState.view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
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
 else content=dashHelp();
 document.getElementById('dashboard-content')!.innerHTML=(blocked.length?'':dashHeading())+content+'<footer class="design-note"><span>AniBayan · '+dashRole.workspace+'</span><span>'+(dashMe()?'Signed in as '+de(dashMe()!.email):'Browsing as a guest')+'</span></footer>';
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
 dashOpen('<p class="detail-kicker">'+(isOrgDashboard?'Incoming order':'Your order')+'</p><h2 id="detail-title">'+order.id+'</h2><p class="detail-subtitle">'+de(order.organization)+'</p><div class="detail-hero"><img src="'+dashImg(order.image)+'" alt="'+de(order.crop)+'"><div><h3>'+de(order.crop)+'</h3><p>'+de(order.quantity)+' · '+dp(order.total)+'</p></div></div><dl class="detail-facts">'+dashFact('Order status',ds(order.status))+dashFact('Payment',ds(order.payment))+dashFact('Placed on',dfull(order.date))+dashFact('Buyer',de(order.customer))+delivery+'</dl>'+items+timeline+notes+'<div class="detail-actions">'+actions+'</div>');
}
function dashProductDetails(id:string):void{
 const crop=dashboardCrops.find(c=>c.id===id);
 if(!crop)return;
 const f=dashFreshness(crop);
 const harvest=dashFact('Harvested',dfull(crop.harvested)+' · '+dashAgeText(f.age))+dashFact('Shelf life',dashPlural(crop.shelfLife,'day')+' after harvest')+dashFact('Best before',dfull(dashAddDays(crop.harvested,crop.shelfLife)))+dashFact('Freshness',dashFreshBadge(crop));
 const hero=(note:string)=>'<div class="detail-hero"><img src="'+dashImg(crop.image)+'" alt="'+de(crop.name)+'"><div><h3>'+dp(crop.price)+' / '+de(crop.unit)+'</h3><p>'+note+'</p></div></div>';
 if(isOrgDashboard){
  dashOpen('<p class="detail-kicker">Product listing · '+crop.id+'</p><h2 id="detail-title">'+de(crop.name)+'</h2><p class="detail-subtitle">'+de(crop.organization)+'</p>'+hero(de(crop.category))+'<dl class="detail-facts">'+dashFact('Available quantity',crop.stock+' '+de(crop.unit))+dashFact('Listing status',ds(dashCropStatus(crop)))+harvest+'</dl><p class="detail-note">Buyers see the harvest date, shelf life and best-before date on this listing.</p><div class="detail-actions"><button class="control" data-toggle-listing="'+crop.id+'"'+(crop.stock===0?' disabled':'')+'>'+(crop.status==='Active'?'Pause listing':'Resume listing')+'</button><button class="control primary" data-edit-listing="'+crop.id+'">'+di('edit')+'Edit listing</button></div>');
  return;
 }
 const saved=dashIsSaved(crop.id);
 const buyable=dashIsBuyable(crop);
 const inCart=dashCart().find(l=>l.crop===crop.id);
 const buy=!buyable?'':isGuest?'<div class="qty-add"><p>Sign in with a buyer account to order this harvest.</p><a class="control primary" href="login.html" data-sign-in-buyer>Sign in to order '+di('arrow')+'</a></div>':'<div class="qty-add"><label for="detail-qty">Quantity ('+de(crop.unit)+')</label><input type="number" id="detail-qty" min="1" max="'+crop.stock+'" step="1" value="1" inputmode="numeric"><button class="control primary" data-add-cart="'+crop.id+'" data-qty-from="detail-qty">'+di('cart')+'Add to cart</button></div>';
 dashOpen('<p class="detail-kicker">Harvest listing</p><h2 id="detail-title">'+de(crop.name)+'</h2><p class="detail-subtitle">'+de(crop.organization)+' · '+de(dashRegion(crop.organization))+'</p>'+hero(de(crop.category)+' · '+(buyable?crop.stock+' '+de(crop.unit)+' available':'Not available right now'))+'<dl class="detail-facts">'+harvest+dashFact('Grower credit score',dashScoreBadge(crop.organization))+dashFact('Buyer rating',dashRatingText(crop.organization))+'</dl><p class="detail-note">The organization enters the harvest date when it lists a crop. Shelf life is its estimate for produce stored as recommended, so plan to use it before the best-before date.'+(inCart?' Your cart has '+inCart.quantity+' '+de(crop.unit)+'.':'')+'</p>'+buy+'<div class="detail-actions"><button class="control" data-organization="'+de(crop.organization)+'">About the grower</button>'+(isGuest?'':'<button class="control" data-save="'+crop.id+'" aria-pressed="'+saved+'">'+di('heart')+(saved?'Saved':'Save harvest')+'</button>')+(inCart?'<button class="control" data-go="cart">View cart '+di('arrow')+'</button>':'')+'</div>');
}
function dashGrowerDetails(name:string):void{
 const org=dashboardOrganizations.find(o=>o.name===name&&o.status==='Active');
 if(!org)return;
 const orders=dashRoleOrders().filter(o=>o.organization===org.name);
 const toRate=orders.find(o=>o.status==='Completed'&&!dashRated(o.id));
 const toReport=orders.find(o=>!dashMyReport(o.id));
 const feedback=dashboardFeedback.filter(f=>f.organization===org.name).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
 dashOpen('<p class="detail-kicker">Growing community</p><h2 id="detail-title">'+de(org.name)+'</h2><p class="detail-subtitle">'+de(org.region)+' · '+de(org.crop)+' · '+dashPlural(dashListingCount(org.name),'listing')+'</p>'+(org.description?'<p class="detail-lead">'+de(org.description)+'</p>':'')+dashScoreExplainer(org.name)+(feedback.length?'<h3 class="detail-section">Recent buyer feedback</h3><div class="feedback-list compact">'+feedback.map(dashFeedbackRow).join('')+'</div>':'')+'<p class="detail-note">Credit score = average buyer rating × 20, minus '+dashReportPenalty+' points for each report upheld by AniBayan administrators.'+(orders.length||isGuest?'':' You can rate or report a community after ordering from it.')+'</p><div class="detail-actions">'+(toReport?'<button class="control" data-report-order="'+toReport.id+'">'+di('flag')+'Report a problem</button>':'')+(toRate?'<button class="control" data-rate="'+toRate.id+'">'+di('star')+'Rate your order</button>':'')+'<button class="control primary" data-shop-region="'+de(org.region)+'">Shop this community '+di('arrow')+'</button></div>');
}
function dashAccountDetails(email:string):void{
 const a=dashAccountByEmail(email);
 if(!a)return;
 const self=a.email===dashMeEmail;
 const org=a.organization?dashboardOrganizations.find(o=>o.name===a.organization):undefined;
 const toggle=!self&&a.role!=='Administrator'&&(a.status==='Active'||a.status==='Suspended')?(a.status==='Suspended'?'<button class="control primary" data-suspend="'+de(a.email)+'">'+di('check')+'Reactivate account</button>':'<button class="control danger" data-suspend="'+de(a.email)+'">'+di('lock')+'Suspend account</button>'):'';
 const review=a.status==='Pending'&&org?'<button class="control primary" data-organization="'+de(org.name)+'">Review application</button>':'';
 const note=a.status==='Pending'?'This representative account activates when the organization application is approved.':self?'This is your own account. Change your password under Settings.':a.role==='Administrator'?'Other administrator accounts can be reset but not suspended.':'Suspended accounts are signed out and can’t sign in, order or sell.';
 dashOpen('<p class="detail-kicker">'+(a.role==='Consumer'?'Buyer':a.role)+' account</p><h2 id="detail-title">'+de(a.name)+'</h2><p class="detail-subtitle">'+de(a.email)+'</p><dl class="detail-facts">'+dashFact('Role',a.role==='Consumer'?'Buyer':a.role)+dashFact('Status',ds(a.status))+dashFact('Joined',dfull(a.joined))+dashFact('Last active',dfull(a.lastActive))+(a.organization?dashFact('Organization',de(a.organization)):'')+(a.phone?dashFact('Mobile number',de(a.phone)):'')+'</dl>'+(a.note?'<p class="detail-note">'+de(a.note)+'</p>':'')+'<p class="detail-note">'+note+'</p><div class="detail-actions">'+(self?'':'<button class="control" data-reset-password="'+de(a.email)+'">'+di('key')+'Reset password</button>')+toggle+review+'</div>');
}
// Sets a new temporary password and shows it once so the administrator can pass it on.
function dashResetPassword(email:string):void{
 const a=dashAccountByEmail(email);
 if(!a)return;
 const chars='abcdefghjkmnpqrstuvwxyz23456789';const random=new Uint32Array(8);crypto.getRandomValues(random);
 const temporary='ab-'+Array.from(random,value=>chars[value%chars.length]).join('');
 a.password=temporary;
 dashRender();
 dashOpen('<p class="detail-kicker">Password reset</p><h2 id="detail-title">Temporary password for '+de(a.name)+'</h2><p class="detail-subtitle">Their old password no longer works. Share this one privately; they can change it under their profile after signing in.</p><div class="temp-password"><code id="temp-password">'+temporary+'</code><button class="control small" data-copy="temp-password">Copy</button></div><div class="detail-actions"><button class="control" data-account="'+de(a.email)+'">Back to account</button><button class="control primary" data-close-dialog>Done</button></div>');
}
function dashReportDetails(id:string):void{
 const r=dashboardReports.find(x=>x.id===id);
 if(!r)return;
 const c=dashCredit(r.organization);
 const open=r.status==='Open';
 const reporter=dashboardAccounts.find(a=>a.name===r.customer);
 const effect=open?(c.score===null?'Applies after the first rating':Math.max(0,c.score-dashReportPenalty)+'/100 (−'+dashReportPenalty+')'):r.status==='Upheld'?'−'+dashReportPenalty+' points':'None';
 const actions=open?'<button class="control" data-decide="Dismissed" data-report-id="'+r.id+'">Dismiss report</button><button class="control danger" data-decide="Upheld" data-report-id="'+r.id+'">'+di('flag')+'Uphold report</button>':'<button class="control" data-decide="Open" data-report-id="'+r.id+'">Reopen report</button><button class="control primary" data-close-dialog>Close</button>';
 dashOpen('<p class="detail-kicker">User report · '+r.id+'</p><h2 id="detail-title">'+de(r.reason)+'</h2><p class="detail-subtitle">'+de(r.customer)+' about '+de(r.organization)+' · '+dfull(r.date)+'</p><blockquote class="report-quote">'+de(r.details)+'</blockquote><dl class="detail-facts">'+dashFact('Status',ds(r.status))+dashFact('Related order',r.order?dashOrderNo(r.order):'Not specified')+dashFact('Credit score now',dashScoreBadge(r.organization))+dashFact(open?'If upheld':'Effect on score',effect)+(reporter?dashFact('Reporter account',ds(reporter.status)):'')+'</dl><p class="detail-note">'+(open?'Uphold the report when the evidence supports it, or dismiss it.':'This report was '+r.status.toLowerCase()+'. Reopen it to change the decision.')+'</p><div class="detail-actions">'+actions+'</div>');
}
function dashApplicationDetails(name:string):void{
 const o=dashboardOrganizations.find(x=>x.name===name);
 if(!o)return;
 const pending=o.status==='Pending review';
 const rep=dashboardAccounts.find(a=>a.organization===o.name);
 dashOpen('<p class="detail-kicker">Organization application</p><h2 id="detail-title">'+de(o.name)+'</h2><p class="detail-subtitle">'+de(o.region)+' · submitted '+dfull(o.applied)+'</p><div class="detail-hero"><img src="'+dashImg(o.image)+'" alt="'+de(o.name)+'"><div><h3>'+de(o.crop)+'</h3><p>'+dashPlural(o.members,'member farmer')+' · '+ds(dashAppStatus(o))+'</p></div></div><dl class="detail-facts">'+dashFact('Representative',de(o.representative)+(rep?'<small class="fact-note">'+de(rep.email)+'</small>':''))+dashFact('Submitted documents',o.documents.map(de).join(', '))+(o.phone?dashFact('Contact number',de(o.phone)):'')+(o.approved?dashFact('Approved on',dfull(o.approved)):'')+'</dl><p class="detail-note">'+(pending?'Approving opens the organization’s storefront and activates its representative account. Declining keeps both closed.':'This application was '+dashAppStatus(o).toLowerCase()+'.')+'</p><div class="detail-actions">'+(pending?'<button class="control danger" data-review="Declined" data-review-name="'+de(o.name)+'">Decline</button><button class="control primary" data-review="Active" data-review-name="'+de(o.name)+'">'+di('check')+'Approve organization</button>':'<button class="control primary" data-close-dialog>Close</button>')+'</div>');
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
 dashOpen('<p class="detail-kicker">PayMongo · test mode</p><h2 id="detail-title">Pay '+dp(total)+' with '+de(method)+'</h2><p class="detail-subtitle">'+orders.map(o=>dashOrderNo(o.id)+' · '+de(o.organization)).join('<br>')+'</p><div class="pay-box">'+di('shield')+'<p>AniBayan’s PayMongo account runs in test mode, so completing this payment marks the order paid without charging any money.</p></div><div class="detail-actions"><button class="control" data-pay-later>Pay later</button><button class="control primary" data-pay="'+orders.map(o=>o.id).join(',')+'">'+di('check')+'Complete payment</button></div>');
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
  +dashField('name','Crop name'+dashRequired,'<input required maxlength="80" autocomplete="off" placeholder="e.g. Highland cabbage"'+value(crop?.name)+'>','',true)
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
// Shrinks an uploaded photo to at most 640 px so it fits in browser storage.
async function dashReadPhoto(file:File):Promise<string>{
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  const scale=Math.min(1,640/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);
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
  Object.assign(editing,fields);
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
  +dashField('place','Municipality'+dashRequired,'<input required maxlength="60" placeholder="e.g. La Trinidad">')
  +dashField('area','Farm area (hectares)'+dashRequired,'<input type="number" required min="0.1" max="500" step="0.1" inputmode="decimal">')
  +dashField('crops','Crops grown'+dashRequired,'<input required maxlength="80" placeholder="e.g. Carrots, cabbage">','',true)
  +'</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+di('plus')+'Add member</button></div></form>');
 dashFocusField('#field-name');
}
function dashSubmitMember(form:HTMLFormElement):void{
 const data=new FormData(form);
 const value=(name:string)=>String(data.get(name)??'').trim();
 const area=Number(value('area'));
 const errors:Record<string,string>={};
 if(value('name').length<3)errors.name='Enter the farmer’s full name.';
 if(value('place').length<3)errors.place='Enter the municipality.';
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
 const [province,region]=org.region.split(', ');
 dashOpen('<p class="detail-kicker">Organization profile</p><h2 id="detail-title">'+de(org.name)+'</h2><p class="detail-subtitle">Buyers see this on your storefront and listings.</p><form class="dash-form" id="org-profile-form" novalidate><div class="form-grid">'
  +dashField('crop','Main crops'+dashRequired,'<input required maxlength="80" value="'+de(org.crop)+'">','',true)
  +dashField('province','Province'+dashRequired,'<input required maxlength="60" value="'+de(province||'')+'">')
  +dashField('region','Region'+dashRequired,'<select required><option value="">Choose a region…</option>'+dashRegions.map(r=>'<option'+dashSelected(r,region||'')+'>'+de(r)+'</option>').join('')+'</select>')
  +dashField('phone','Contact number'+dashRequired,'<input type="tel" required maxlength="20" autocomplete="tel" value="'+de(org.phone||'')+'">','',true)
  +dashField('description','About your organization','<textarea rows="3" maxlength="240">'+de(org.description||'')+'</textarea>','',true)
  +'</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+di('check')+'Save profile</button></div></form>');
 dashFocusField('#field-crop');
}
function dashSubmitOrgProfile(form:HTMLFormElement):void{
 const data=new FormData(form);
 const value=(name:string)=>String(data.get(name)??'').trim();
 const errors:Record<string,string>={};
 if(value('crop').length<3)errors.crop='Enter your main crops.';
 if(value('province').length<3)errors.province='Enter your province.';
 if(!dashRegions.includes(value('region')))errors.region='Choose your region.';
 if(!dashPhonePattern.test(value('phone')))errors.phone='Enter a mobile number like 0917 555 0148.';
 if(!dashShowErrors(form,errors))return;
 const org=dashMyOrg();
 if(!org)return;
 Object.assign(org,{crop:value('crop'),region:value('province')+', '+value('region'),phone:value('phone'),description:value('description')});
 dashDialog.close();dashRender();
 dashToast('Organization profile saved.');
}
function dashProfileForm():void{
 const me=dashAccount();
 dashOpen('<p class="detail-kicker">Your profile</p><h2 id="detail-title">Delivery details</h2><p class="detail-subtitle">Used to fill in checkout. Your name and email can’t be changed here.</p><form class="dash-form" id="profile-form" novalidate><div class="form-grid single">'
  +dashField('phone','Mobile number'+dashRequired,'<input type="tel" required maxlength="20" autocomplete="tel" value="'+de(me.phone||'')+'">')
  +dashField('address','Delivery address'+dashRequired,'<textarea rows="3" required maxlength="200" autocomplete="street-address">'+de(me.address||'')+'</textarea>','House number, street, barangay, city or municipality, and province.')
  +'</div><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+di('check')+'Save details</button></div></form>');
 dashFocusField('#field-phone');
}
function dashSubmitProfile(form:HTMLFormElement):void{
 const data=new FormData(form);
 const phone=String(data.get('phone')??'').trim(),address=String(data.get('address')??'').trim();
 const errors:Record<string,string>={};
 if(!dashPhonePattern.test(phone))errors.phone='Enter a mobile number like 0917 555 0148.';
 if(address.length<10)errors.address='Enter your full delivery address.';
 if(!dashShowErrors(form,errors))return;
 Object.assign(dashAccount(),{phone,address});
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
  +dashField('address','Delivery address'+dashRequired,'<textarea rows="3" required maxlength="200" autocomplete="street-address">'+de(me.address||'')+'</textarea>')
  +dashField('phone','Mobile number'+dashRequired,'<input type="tel" required maxlength="20" autocomplete="tel" value="'+de(me.phone||'')+'">','The organization calls this number to arrange delivery.')
  +'<div class="form-field"><span class="form-label" id="method-label">Payment method'+dashRequired+'</span><div class="choice-list" role="radiogroup" aria-labelledby="method-label">'+dashPaymentMethods.map((m,i)=>'<label class="choice"><input type="radio" name="method" value="'+m[0]+'"'+(i===0?' checked':'')+'><span><strong>'+m[0]+'</strong><small>'+m[1]+'</small></span></label>').join('')+'</div></div>'
  +dashField('note','Note for the organization','<textarea rows="2" maxlength="200" placeholder="Gate code, preferred delivery time…"></textarea>')
  +'<label class="check-row"><input type="checkbox" name="remember" checked> Save this address and number to my profile</label>'
  +'</div><p class="form-error" id="checkout-error" role="alert" hidden></p><div class="detail-actions"><button type="button" class="control" data-close-dialog>Back to cart</button><button type="submit" class="control primary">Place order'+(orgs.length>1?'s':'')+' · '+dp(total)+'</button></div></form>');
 dashFocusField(me.address?'[type=submit]':'#field-address');
}
function dashSubmitCheckout(form:HTMLFormElement):void{
 const data=new FormData(form);
 const address=String(data.get('address')??'').trim(),phone=String(data.get('phone')??'').trim(),note=String(data.get('note')??'').trim();
 const method=String(data.get('method')||'Cash on delivery');
 const errors:Record<string,string>={};
 if(address.length<10)errors.address='Enter your full delivery address.';
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
 dashOpen('<p class="detail-kicker">Rate your order · '+dashOrderNo(o.id)+'</p><h2 id="detail-title">How was your order?</h2><p class="detail-subtitle">'+de(o.crop)+' · '+de(o.quantity)+' from '+de(o.organization)+'</p><form class="dash-form" id="feedback-form" data-order="'+o.id+'" novalidate><div class="form-grid single"><div class="form-field"><span class="form-label" id="rating-label">Your rating'+dashRequired+'</span><div class="star-input" role="radiogroup" aria-labelledby="rating-label" aria-describedby="rating-caption error-rating">'+stars+'</div><small class="form-hint" id="rating-caption">Choose 1 to 5 stars.</small><small class="field-error" id="error-rating" data-error-for="rating"></small></div>'+dashField('comment','Comment (optional)','<textarea rows="3" maxlength="300" placeholder="What did you like? What could be better?"></textarea>')+'</div><p class="detail-note">Your rating becomes part of '+de(o.organization)+'’s credit score.</p><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+di('star')+'Submit rating</button></div></form>');
 dashFocusField('#rating-1');
}
function dashSubmitFeedback(form:HTMLFormElement):void{
 const data=new FormData(form);
 const rating=Number(data.get('rating'));
 if(!dashShowErrors(form,rating>=1&&rating<=5?{}:{rating:'Choose a rating from 1 to 5 stars.'}))return;
 const order=dashboardOrders.find(o=>o.id===form.dataset.order);
 if(!order)return;
 const next=Math.max(0,...dashboardFeedback.map(f=>Number(f.id.slice(3))||0))+1;
 dashboardFeedback.unshift({id:'FB-'+next,organization:order.organization,customer:dashConsumerName,rating,comment:String(data.get('comment')??'').trim(),date:dashToday,order:order.id});
 dashDialog.close();dashRender();
 dashToast('Thanks for rating! '+order.organization+'’s credit score is now '+dashCredit(order.organization).score+'.');
}
const dashReportReasons=['Short or wrong quantity','Poor quality or spoiled','Harvest date not as listed','Late or no fulfillment','Payment or refund problem','Other'];
function dashReportForm(orderId:string):void{
 const o=dashRoleOrders().find(x=>x.id===orderId);
 if(!o||dashMyReport(o.id))return;
 dashOpen('<p class="detail-kicker">Report a problem · '+dashOrderNo(o.id)+'</p><h2 id="detail-title">What went wrong?</h2><p class="detail-subtitle">'+de(o.crop)+' · '+de(o.quantity)+' from '+de(o.organization)+'</p><form class="dash-form" id="report-form" data-order="'+o.id+'" novalidate><div class="form-grid single">'
  +dashField('reason','Reason'+dashRequired,'<select required><option value="">Choose a reason…</option>'+dashReportReasons.map(r=>'<option>'+de(r)+'</option>').join('')+'</select>')
  +dashField('details','Details'+dashRequired,'<textarea rows="4" required maxlength="500" placeholder="What did you receive, and when?"></textarea>','At least 20 characters.')
  +'</div><p class="detail-note">AniBayan administrators review every report. Only upheld reports lower the organization’s credit score.</p><div class="detail-actions"><button type="button" class="control" data-close-dialog>Cancel</button><button type="submit" class="control primary">'+di('flag')+'Send report</button></div></form>');
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
 dashDialog.close();dashRender();
 dashToast('Report sent. Administrators review it before it affects '+order.organization+'’s credit score.');
}

let dashToastTimeout:number|undefined;
function dashToast(message:string):void{const el=document.getElementById('dashboard-toast')!;el.textContent=message;el.classList.add('visible');window.clearTimeout(dashToastTimeout);dashToastTimeout=window.setTimeout(()=>el.classList.remove('visible'),3600);}
function dashExportRows():[string,(string|number)[][]]{
 const view=dashState.view;
 if(isAdminDashboard){
  if(view==='reports')return ['user-reports',[['Report ID','Organization','Reported by','Reason','Details','Order','Filed','Status'],...dashReportList().map(r=>[r.id,r.organization,r.customer,r.reason,r.details,r.order||'',r.date,r.status])]];
  if(view==='applications')return ['organization-applications',[['Organization','Region','Main crops','Representative','Members','Documents','Submitted','Status'],...dashApplicationList().map(o=>[o.name,o.region,o.crop,o.representative,o.members,o.documents.join('; '),o.applied,dashAppStatus(o)])]];
  if(view==='health')return ['health-checks',[['Checked at','Service','Result','Response time (ms)','Error'],...dashboardHealthLog.slice().reverse().flatMap(run=>run.results.map(r=>[run.time,r.service,r.ok?'Passed':'Failed',r.latency,r.error||'']))]];
  return ['accounts',[['Name','Email','Role','Organization','Joined','Last active','Status'],...dashAccountList().map(a=>[a.name,a.email,a.role==='Consumer'?'Buyer':a.role,a.organization||'',a.joined,a.lastActive,a.status])]];
 }
 if(view==='listings')return ['listings',[['Product ID','Name','Category','Price PHP','Unit','Available quantity','Harvest date','Shelf life (days)','Best before','Status'],...dashListingCrops().map(c=>[c.id,c.name,c.category,c.price,c.unit,c.stock,c.harvested,c.shelfLife,dashAddDays(c.harvested,c.shelfLife),dashCropStatus(c)])]];
 if(view==='members')return ['members',[['Farmer','Municipality','Crops','Area ha','Member since','Status'],...dashMyMembers().filter(m=>dashMatching([m.name,m.place,m.crops,m.status].join(' '))).map(m=>[m.name,m.place,m.crops,m.area,m.joined,m.status])]];
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
 dashState.view=allowed.includes(requested)?requested:dashRole.nav[0][0];
 dashState.filter=dashState.nextFilter||'All';dashState.nextFilter='';dashState.query='';
 dashClosePopovers();document.body.classList.remove('sidebar-open');dashRender();window.scrollTo(0,0);
}

/* ---------- Start: sign-in check, events ---------- */
function dashStart():void{
 dashShell();
 window.addEventListener('hashchange',dashReadHash);dashReadHash();
 // Links from the homepage and storefront: consumer.html?q=rice#shop searches the shop; ?grower=Name opens that community.
 const params=new URLSearchParams(location.search);
 if(isConsumerDashboard&&params.get('q')){dashState.query=params.get('q')!.replace(/-/g,' ');dashRender();}
 if(isConsumerDashboard&&params.get('grower'))dashGrowerDetails(params.get('grower')!);
 if(isAdminDashboard)void dashRunHealthChecks();
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
  if(event.key==='Escape'){dashClosePopovers();document.body.classList.remove('sidebar-open');return;}
  if(event.key==='/'&&!el.closest('input,select,textarea')&&!dashDialog.open){event.preventDefault();document.getElementById('dashboard-search')!.focus();}
 });
 document.addEventListener('click',dashHandleClick);
 document.addEventListener('input',event=>{
  const input=event.target as HTMLInputElement;
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
 document.addEventListener('change',event=>{
  const input=event.target as HTMLInputElement;
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
 if(el.closest('[data-sign-out]')){dashClearSession();return;}
 if(el.closest('[data-sign-in]')){event.preventDefault();dashGoToSignIn('signin');return;}
 if(el.closest('[data-sign-in-buyer]')){event.preventDefault();dashGoToSignIn('buyer');return;}
 const target=el.closest<HTMLElement>('button,[data-go]');if(!target)return;
 const data=target.dataset;
 if(data.go){dashState.nextFilter=data.goFilter||'';if(dashDialog.open)dashDialog.close();dashNavigate(data.go);return;}
 if(data.advance||data.decline||data.cancelOrder){
  const order=dashboardOrders.find(o=>o.id===(data.advance||data.decline||data.cancelOrder))!;
  dashSetOrderStatus(order,data.advance?dashNextStep[order.status][0]:'Cancelled');
  dashRender();if(dashDialog.open)dashOrderDetails(order.id);
  dashToast('Order '+dashOrderNo(order.id)+' '+(data.cancelOrder?'cancelled.':'marked '+order.status.toLowerCase()+'.'));return;
 }
 if(data.toggleListing){
  const crop=dashboardCrops.find(c=>c.id===data.toggleListing)!;
  crop.status=crop.status==='Active'?'Unavailable':'Active';dashRender();
  if(dashDialog.open)dashProductDetails(crop.id);
  dashToast(crop.name+(crop.status==='Active'?' is visible to buyers again.':' is paused. Buyers can’t order it until you resume it.'));return;
 }
 if(data.editListing){dashListingForm(data.editListing);return;}
 if(data.removeListing){dashConfirmRemoveListing(data.removeListing);return;}
 if(data.confirmRemove){
  const index=dashboardCrops.findIndex(c=>c.id===data.confirmRemove);
  if(index<0)return;
  const [crop]=dashboardCrops.splice(index,1);
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
  dashDialog.close();dashRender();
  dashToast(org.name+(data.review==='Active'?' approved. '+(representative?representative.name+' can now sign in.':''):' declined.'));return;
 }
 if(data.decide&&data.reportId){
  const report=dashboardReports.find(r=>r.id===data.reportId)!;
  report.status=data.decide;
  dashRender();dashReportDetails(report.id);
  const score=dashCredit(report.organization).score;
  dashToast(report.id+(report.status==='Open'?' reopened. ':' '+report.status.toLowerCase()+'. ')+report.organization+(score===null?' has no credit score yet.':'’s credit score is now '+score+'.'));return;
 }
 if(data.reportId){dashReportDetails(data.reportId);return;}
 if(data.suspend){
  const account=dashAccountByEmail(data.suspend)!;
  account.status=account.status==='Suspended'?'Active':'Suspended';
  account.note=account.status==='Suspended'?'Suspended by '+dashAccount().name+' on '+dfull(dashToday)+'.':undefined;
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
  const paid=data.pay.split(',').map(id=>dashboardOrders.find(o=>o.id===id)).filter((o):o is DashboardOrder=>!!o);
  paid.forEach(o=>{o.payment='Paid';});
  dashDialog.close();
  dashNavigate('orders');
  dashToast('Payment complete for '+paid.map(o=>dashOrderNo(o.id)).join(', ')+'.');return;
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
 if(data.organization){if(isAdminDashboard)dashApplicationDetails(data.organization);else dashGrowerDetails(data.organization);return;}
 if(data.filter){dashState.filter=data.filter;dashRender();return;}
 if(data.chart){dashState.chart=data.chart;dashRender();return;}
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
