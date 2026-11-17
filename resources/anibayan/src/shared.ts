// Shared by every AniBayan page (homepage, sign-in and the three dashboards): text helpers, form helpers,
// and the browser-stored copy of the data plus the signed-in session.
const de=(value:string|number)=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const dashPlural=(count:number,word:string)=>count+' '+word+(count===1?'':'s');
const dashPhonePattern=/^(\+63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;

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

/* ---------- Browser storage: one copy of the data shared by all pages ---------- */
const dashStoreKey='anibayan-data-v1';
const dashSessionKey='anibayan-session-v1';
let dashLastSaved='';
function dashReplaceList<T>(target:T[],source:unknown):void{if(Array.isArray(source))target.splice(0,target.length,...(source as T[]));}
function dashReplaceRecord<T>(target:Record<string,T>,source:unknown):void{
 if(!source||typeof source!=='object')return;
 Object.keys(target).forEach(key=>delete target[key]);
 Object.assign(target,source);
}
function dashSnapshot():string{
 return JSON.stringify({orders:dashboardOrders,crops:dashboardCrops,organizations:dashboardOrganizations,accounts:dashboardAccounts,feedback:dashboardFeedback,reports:dashboardReports,warnings:dashboardWarnings,activity:dashboardActivity,members:dashboardMembers,saved:dashboardSaved,carts:dashboardCarts,healthLog:dashboardHealthLog});
}
// Replaces the starting data with the copy saved by any AniBayan page, if there is one.
function dashLoadStore():void{
 let raw:string|null=null;
 try{raw=localStorage.getItem(dashStoreKey);}catch{return;}
 if(!raw)return;
 try{
  const data=JSON.parse(raw);
  dashReplaceList(dashboardOrders,data.orders);dashReplaceList(dashboardCrops,data.crops);dashReplaceList(dashboardOrganizations,data.organizations);
  dashReplaceList(dashboardAccounts,data.accounts);dashReplaceList(dashboardFeedback,data.feedback);dashReplaceList(dashboardReports,data.reports);dashReplaceList(dashboardWarnings,data.warnings);dashReplaceList(dashboardActivity,data.activity);
  dashReplaceList(dashboardMembers,data.members);dashReplaceList(dashboardHealthLog,data.healthLog);
  dashReplaceRecord(dashboardSaved,data.saved);dashReplaceRecord(dashboardCarts,data.carts);
  dashLastSaved=raw;
 }catch{/* unreadable copy: keep the starting data */}
}
// Saves only when something changed, so pages listening for storage events don't echo each other.
// Returns false when the browser refused to store the data (for example, storage is full).
function dashSaveStore():boolean{
 const json=dashSnapshot();
 if(json===dashLastSaved)return true;
 try{localStorage.setItem(dashStoreKey,json);}catch{return false;}
 dashLastSaved=json;
 return true;
}
// Adds one event to the administrators' activity log, newest first. The caller saves.
function dashLog(type:string,actor:string,detail='',target=''):void{
 dashboardActivity.unshift(target?{time:new Date().toISOString(),actor,type,detail,target}:{time:new Date().toISOString(),actor,type,detail});
 if(dashboardActivity.length>1000)dashboardActivity.length=1000;
}
function dashResetStore():void{try{localStorage.removeItem(dashStoreKey);localStorage.removeItem(dashSessionKey);}catch{/* nothing stored */}}
function dashSessionEmail():string{try{return localStorage.getItem(dashSessionKey)||'';}catch{return '';}}
function dashSetSession(email:string):void{try{localStorage.setItem(dashSessionKey,email);}catch{/* the session lasts for this page only */}}
function dashClearSession():void{try{localStorage.removeItem(dashSessionKey);}catch{/* nothing stored */}}
const dashAccountByEmail=(email:string)=>dashboardAccounts.find(a=>a.email.toLowerCase()===email.trim().toLowerCase());
const dashHomeFor=(account:DashboardAccount)=>account.role==='Administrator'?'admin.html':account.role==='Representative'?'organization.html':'consumer.html';
