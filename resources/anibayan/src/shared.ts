// Shared by every AniBayan page (homepage, sign-in and the three dashboards): text helpers, form helpers,
// and talking to AniBayan's server, which holds the data.
const de=(value:string|number)=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const dashPlural=(count:number,word:string)=>count+' '+word+(count===1?'':'s');
const dashPhonePattern=/^(\+63[\s-]?|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;
// Phone fields take digits, spaces, dashes and a leading +, and stop at 12 digits (+63 917 555 0148).
const dashPhoneMaxDigits=12;
const dashPhoneInput='type="tel" required maxlength="16" autocomplete="tel"';
function dashLimitPhone(input:HTMLInputElement):void{
 let digits=0;
 const kept=input.value.replace(/[^\d+\s-]/g,'').replace(/(?!^)\+/g,'').split('').filter(c=>!/\d/.test(c)||++digits<=dashPhoneMaxDigits).join('');
 if(kept!==input.value)input.value=kept;
}

/* ---------- Forms ---------- */
const dashRequired=' <b aria-hidden="true">*</b>';
// A labelled control with an optional hint and an error slot that dashShowErrors fills.
function dashField(name:string,label:string,control:string,hint='',wide=false):string{
 const described=(hint?'hint-'+name+' ':'')+'error-'+name;
 return '<div class="form-field'+(wide?' wide':'')+'"><label for="field-'+name+'">'+label+'</label>'+control.replace(/^<(\w+)/,'<$1 id="field-'+name+'" name="'+name+'" aria-describedby="'+described+'"')+(hint?'<small class="form-hint" id="hint-'+name+'">'+hint+'</small>':'')+'<small class="field-error" id="error-'+name+'" data-error-for="'+name+'"></small></div>';
}
// Shows each message next to its field, marks the field invalid and focuses the first one. Returns true when there are no errors.
function dashShowErrors(form:HTMLFormElement,errors:Record<string,string>):boolean{
 const invalid:HTMLElement[]=[];
 form.querySelectorAll<HTMLElement>('[data-error-for]').forEach(slot=>{
  const name=slot.dataset.errorFor!;const message=errors[name]||'';
  slot.textContent=message;
  form.querySelectorAll<HTMLElement>('[name="'+name+'"]').forEach(field=>{if(message){field.setAttribute('aria-invalid','true');invalid.push(field);}else field.removeAttribute('aria-invalid');});
 });
 invalid[0]?.focus();
 return invalid.length===0;
}
// Clears a field's error as soon as it is edited; forms are validated again on submit.
function dashClearFieldError(input:HTMLInputElement):void{
 const form=input.form;
 if(!form||!input.name)return;
 const slot=form.querySelector<HTMLElement>('[data-error-for="'+input.name+'"]');
 if(slot&&slot.textContent){slot.textContent='';form.querySelectorAll('[name="'+input.name+'"]').forEach(field=>field.removeAttribute('aria-invalid'));}
}

const dashPasswordEye='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
const dashPasswordEyeOff='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a16.2 16.2 0 0 1-3.2 3.9"/><path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.1-.9"/></svg>';
function dashSetupPasswordToggles(root:ParentNode):void{
 root.querySelectorAll<HTMLInputElement>('input[type="password"][data-password-toggle-input]').forEach(input=>{
  if(input.closest('.password-control'))return;
  const parent=input.parentElement;
  if(!parent)return;
  const wrapper=document.createElement('span');wrapper.className='password-control';
  parent.insertBefore(wrapper,input);wrapper.append(input);
  const button=document.createElement('button');button.type='button';button.className='password-toggle';
  button.dataset.passwordToggle='true';button.setAttribute('aria-label','Show password');button.setAttribute('aria-pressed','false');
  if(input.id)button.setAttribute('aria-controls',input.id);
  button.title='Show password';button.innerHTML=dashPasswordEye;wrapper.append(button);
 });
}
dashSetupPasswordToggles(document);
document.addEventListener('click',event=>{
 const target=event.target;
 if(!(target instanceof Element))return;
 const button=target.closest<HTMLButtonElement>('button[data-password-toggle]');
 const input=button?.parentElement?.querySelector<HTMLInputElement>('input[data-password-toggle-input]');
 if(!button||!input)return;
 const show=input.type==='password';input.type=show?'text':'password';
 button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',show?'Hide password':'Show password');
 button.title=show?'Hide password':'Show password';button.innerHTML=show?dashPasswordEyeOff:dashPasswordEye;
});

/* ---------- AniBayan's data lives on the server (Laravel + MySQL) ---------- */
// Pages load the signed-in person's data from /api/state and send every change to /api/actions/…; the server
// checks who may do it, saves it to the database and answers with the fresh data. Nothing is kept in the browser:
// signing in uses the server's session cookie.
interface DashServerState{me:string|null;blocked?:string;blockedReason?:string|null;barangays?:string[];preferences?:{compact?:boolean;contrast?:boolean};orders:DashboardOrder[];crops:DashboardCrop[];organizations:DashboardOrganization[];accounts:DashboardAccount[];feedback:DashboardFeedback[];reports:DashboardReport[];warnings:DashboardWarning[];activity:DashboardActivity[];members:DashboardMember[];saved:Record<string,string[]>;carts:Record<string,DashboardCartLine[]>;healthLog:DashboardHealthRun[]}
let dashSessionMe='';
// Set when the server signed this person out because the account is no longer active ("suspended", "terminated").
let dashBlockedStatus='';
let dashBlockedReason='';
// True when the server couldn't be reached when the page loaded.
let dashOffline=false;
let dashPrefs:{compact?:boolean;contrast?:boolean}={};
function dashReplaceList<T>(target:T[],source:unknown):void{target.splice(0,target.length,...(Array.isArray(source)?source as T[]:[]));}
function dashReplaceRecord<T>(target:Record<string,T>,source:unknown):void{
 Object.keys(target).forEach(key=>delete target[key]);
 if(source&&typeof source==='object')Object.assign(target,source);
}
function dashApplyState(s:DashServerState):void{
 dashReplaceList(dashboardOrders,s.orders);dashReplaceList(dashboardCrops,s.crops);dashReplaceList(dashboardOrganizations,s.organizations);
 dashReplaceList(dashboardAccounts,(s.accounts||[]).map(a=>({...a,email:a.email||'',joined:a.joined||'',lastActive:a.lastActive||''})));dashReplaceList(dashboardFeedback,s.feedback);dashReplaceList(dashboardReports,s.reports);
 dashReplaceList(dashboardWarnings,s.warnings);dashReplaceList(dashboardActivity,s.activity);dashReplaceList(dashboardMembers,s.members);
 dashReplaceList(dashboardHealthLog,s.healthLog);dashReplaceRecord(dashboardSaved,s.saved);dashReplaceRecord(dashboardCarts,s.carts);
 dashSessionMe=s.me||'';dashBlockedStatus=s.blocked||'';dashBlockedReason=s.blockedReason||'';if(Array.isArray(s.barangays)&&s.barangays.length)dashReplaceList(dashBarangays,s.barangays);dashPrefs=s.preferences||{};
}
// The dashboards' loader (in their HTML) fetches the data before the script runs; this applies it.
function dashLoadStore():void{
 const state=(window as unknown as {anibayanState?:DashServerState|null}).anibayanState;
 if(state&&Array.isArray(state.orders))dashApplyState(state);else dashOffline=true;
}
interface DashResponse{ok:boolean;status:number;data:Record<string,any>}
// What the pages say when something goes wrong that isn't about what the person typed. Server errors never reach the
// page as they are: the server only sends messages AniBayan wrote (bootstrap/app.php), and the page shows a generic
// one for anything else.
const dashGenericError='Something went wrong. Try again in a moment.';
const dashOfflineError='AniBayan can’t be reached right now. Check your connection and try again.';
function dashMessage(r:DashResponse,fallback=dashGenericError):string{
 const message=typeof r.data.message==='string'?r.data.message:'';
 return message&&(r.status===0||(r.status>=400&&r.status<500))?message:fallback;
}
function dashCookie(name:string):string{const match=document.cookie.match(new RegExp('(?:^|; )'+name+'=([^;]*)'));return match?decodeURIComponent(match[1]):'';}
// GET when there is no body, otherwise a POST with the anti-forgery token Laravel set as the XSRF-TOKEN cookie.
// A FormData body (files) goes as multipart; anything else as JSON.
async function dashApi(path:string,body?:unknown,retried=false):Promise<DashResponse>{
 const headers:Record<string,string>={Accept:'application/json'};
 const multipart=body instanceof FormData;
 if(body!==undefined){if(!multipart)headers['Content-Type']='application/json';headers['X-XSRF-TOKEN']=dashCookie('XSRF-TOKEN');}
 try{
  const response=await fetch('../api/'+path,{method:body===undefined?'GET':'POST',headers,credentials:'same-origin',cache:'no-store',body:body===undefined?undefined:multipart?body as FormData:JSON.stringify(body)});
  // 419: the anti-forgery token expired; fetching the data renews it.
  if(response.status===419&&!retried){await dashApi('state');return dashApi(path,body,true);}
  const data=await response.json().catch(()=>({})) as Record<string,any>;
  return {ok:response.ok,status:response.status,data};
 }catch{return {ok:false,status:0,data:{message:dashOfflineError}};}
}
async function dashFetchState():Promise<boolean>{
 const r=await dashApi('state');
 if(r.ok&&Array.isArray(r.data.orders)){dashOffline=false;dashApplyState(r.data as DashServerState);return true;}
 dashOffline=true;return false;
}
const dashSessionEmail=()=>dashSessionMe;
// Laravel's field errors ({field:["message"]}) as one message per field, for dashShowErrors.
function dashFieldErrors(errors:unknown):Record<string,string>{
 const out:Record<string,string>={};
 if(errors&&typeof errors==='object')Object.entries(errors as Record<string,unknown>).forEach(([key,value])=>{out[key.replace(/\.\d+$/,'')]=Array.isArray(value)?String(value[0]):String(value);});
 return out;
}
// Public profiles carry no email, so an empty email never matches.
const dashAccountByEmail=(email:string)=>email.trim()?dashboardAccounts.find(a=>a.email.toLowerCase()===email.trim().toLowerCase()):undefined;
const dashHomeForRole=(role:string)=>role==='Administrator'?'admin.html':role==='Representative'?'organization.html':'consumer.html';
const dashHomeFor=(account:DashboardAccount)=>dashHomeForRole(account.role);
