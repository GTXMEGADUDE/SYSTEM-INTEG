// Sign-in and create-account page (login.html). Accounts live on AniBayan's server: buyers can sign up and shop
// right away; organization representatives apply and can sign in once an administrator approves.
const authRoot=document.getElementById('auth-content')!;
const authParams=new URLSearchParams(location.search);
const authEmailPattern=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
type AuthView='signin'|'register'|'submitted'|'forgot'|'reset';
let authView:AuthView=authParams.get('reset')==='1'&&location.hash==='#reset'?'reset':location.hash==='#forgot'?'forgot':location.hash==='#register'?'register':'signin';
let authSubmitted:{organization:string;email:string;requestedBarangay?:boolean}|undefined;
let authForgotEmail='';
let authForgotSent=false;
const authResetToken=authParams.get('token')||'';
const authResetEmail=authParams.get('email')||'';
const authNotices:Record<string,string>={
 signin:'Sign in to continue.',
 buyer:'Sign in with a buyer account to order, save harvests and rate growers.',
 admin:'Sign in with an administrator account to open the admin workspace.',
 organization:'Sign in with your organization representative account to open your workspace.',
 suspended:'You were signed out because an AniBayan administrator suspended that account.',
 terminated:'You were signed out because your organization was terminated.',
 pending:'That organization application is still being reviewed.',
 declined:'That organization application was declined.',
 'password-reset':'Your password has been reset. Sign in with your new password.',
};
// Where to go after signing in: back to the page that asked (when it suits the account's role), otherwise the role's home.
function authDestination(role:string):string{
 const next=authParams.get('next')||'';
 const roles:Record<string,string>={'consumer.html':'Consumer','organization.html':'Representative','admin.html':'Administrator'};
 return roles[next.split(/[?#]/)[0]]===role?next:dashHomeForRole(role);
}
// The documents an organization attaches (keys match App\Support\Documents::TYPES on the server). Only
// administrators can open them.
const authDocuments:[string,string][]=[['registration','CDA or SEC registration'],['endorsement','Barangay endorsement'],['id','Representative ID']];
const authDocumentTypes=['application/pdf','image/jpeg','image/png','image/webp'];
const authDocumentMaxBytes=5*1024*1024;
const authDocumentHint='PDF, JPG, PNG or WebP · up to 5 MB';
const authFileSize=(bytes:number)=>bytes<1024*1024?Math.max(1,Math.round(bytes/1024))+' KB':(bytes/1024/1024).toFixed(1)+' MB';
function authSignInView():string{
  const notice=authNotices[authParams.get('notice')||''];
  const reason=authParams.get('reason');
  return '<form class="auth-form" id="signin-form" novalidate><h1>Welcome back</h1><p class="auth-lead">Sign in to shop fresh harvests or manage your organization.</p>'+(notice?'<p class="auth-notice">'+de(notice)+(reason?' Reason: '+de(reason):'')+'</p>':'')+'<div class="form-grid single">'
  +dashField('email','Email','<input type="email" required autocomplete="email" placeholder="name@example.com">')
  +dashField('password','Password','<input type="password" data-password-toggle-input required autocomplete="current-password">')
  +'</div><p class="auth-forgot"><button type="button" class="text-button" data-auth-view="forgot">Forgot password?</button></p><p class="form-error" id="signin-error" role="alert" hidden></p><button type="submit" class="control primary auth-submit">Sign in</button><p class="auth-switch">New to AniBayan? <button type="button" class="text-button" data-auth-view="register">Create an account</button></p></form>';
}
function authForgotView():string{
 return '<form class="auth-form" id="forgot-form" novalidate><h1>Forgot password?</h1><p class="auth-lead">Enter the email address on your account and we’ll send a reset link.</p>'+(authForgotSent?'<p class="auth-notice" role="status">If an account exists for that email, we sent a password reset link.</p>':'')+'<div class="form-grid single">'+dashField('email','Email','<input type="email" required maxlength="160" autocomplete="email" placeholder="name@example.com" value="'+de(authForgotEmail)+'">')+'</div><p class="form-error" id="forgot-error" role="alert" hidden></p><button type="submit" class="control primary auth-submit">Send reset link</button><p class="auth-switch"><button type="button" class="text-button" data-auth-view="signin">Back to sign in</button></p></form>';
}
function authResetView():string{
 if(!authResetToken||!authResetEmail)return '<div class="auth-done"><h1>Reset link unavailable</h1><p>Request a new password reset link to continue.</p><div class="detail-actions"><button type="button" class="control primary" data-auth-view="forgot">Request a new link</button></div></div>';
 return '<form class="auth-form" id="reset-form" novalidate><h1>Choose a new password</h1><p class="auth-lead">Set a new password for '+de(authResetEmail)+'.</p><div class="form-grid single">'+dashField('password','New password','<input type="password" data-password-toggle-input required minlength="8" maxlength="200" autocomplete="new-password">','At least 8 characters.')+dashField('password_confirmation','Confirm new password','<input type="password" data-password-toggle-input required minlength="8" maxlength="200" autocomplete="new-password">')+'</div><p class="form-error" id="reset-error" role="alert" hidden></p><button type="submit" class="control primary auth-submit">Reset password</button><p class="auth-switch"><button type="button" class="text-button" data-auth-view="signin">Back to sign in</button></p></form>';
}
function authRegisterView():string{
 const organization=authParams.get('type')==='organization';
 const choice=(value:string,title:string,text:string,checked:boolean)=>'<label class="choice"><input type="radio" name="type" value="'+value+'"'+(checked?' checked':'')+'><span><strong>'+title+'</strong><small>'+text+'</small></span></label>';
 const barangayOther=dashField('barangayOther','Barangay name'+dashRequired,'<input required minlength="2" maxlength="80" autocomplete="address-level3">','An administrator will check it with your application.',true).replace('<div class="form-field wide">','<div class="form-field wide" id="barangay-other-wrap" hidden>');
 return '<form class="auth-form" id="register-form" novalidate><h1>Create your account</h1><p class="auth-lead">Buy fresh harvests, or apply to sell for your farmer organization.</p>'
  +'<div class="form-field auth-type"><span class="form-label" id="type-label">I want to</span><div class="choice-list two" role="radiogroup" aria-labelledby="type-label">'+choice('buyer','Buy harvests','Shop from local growing communities.',!organization)+choice('organization','Sell for my organization','An administrator reviews new organizations.',organization)+'</div></div>'
  +'<div class="form-grid">'
  +dashField('name','Full name'+dashRequired,'<input required maxlength="80" autocomplete="name">','',true)
  +dashField('email','Email'+dashRequired,'<input type="email" required maxlength="120" autocomplete="email" placeholder="name@example.com">')
  +dashField('phone','Mobile number'+dashRequired,'<input '+dashPhoneInput+' placeholder="0917 555 0148">')
  +dashField('password','Password'+dashRequired,'<input type="password" data-password-toggle-input required minlength="8" maxlength="200" autocomplete="new-password">','At least 8 characters.')
  +dashField('password_confirmation','Confirm password'+dashRequired,'<input type="password" data-password-toggle-input required minlength="8" maxlength="200" autocomplete="new-password">')
  +'</div><div class="form-grid org-fields"'+(organization?'':' hidden')+'><h2 class="form-section">Your organization</h2>'
  +dashField('orgName','Organization name'+dashRequired,'<input required maxlength="80">','',true)
  +dashField('barangayChoice','Barangay, '+dashCityName+dashRequired,'<select required>'+dashBarangayOptions('')+'<option value="__other__">My barangay is not listed</option></select>','If it is missing, choose the last option to request it.')
  +barangayOther
  +dashField('crops','Main crops'+dashRequired,'<input required maxlength="80" placeholder="e.g. Rice, calamansi">','',true)
  +'<div class="form-field wide"><span class="form-label" id="documents-label">Documents'+dashRequired+'</span><div class="choice-list" role="group" aria-labelledby="documents-label" aria-describedby="error-documents">'+authDocuments.map(([key,label])=>'<div class="choice doc-upload" data-doc="'+key+'"><span><strong>'+de(label)+'</strong><small data-doc-file>'+authDocumentHint+'</small></span><label class="control small file-button"><span data-doc-action>Attach</span><input type="file" name="documents['+key+']" accept="'+authDocumentTypes.join(',')+'" aria-label="Attach '+de(label)+'"></label><button type="button" class="control small" data-doc-remove="'+key+'" aria-label="Remove '+de(label)+'" hidden>Remove</button></div>').join('')+'</div><small class="field-error" id="error-documents" data-error-for="documents"></small></div>'
  +'</div><p class="form-error" id="register-error" role="alert" hidden></p><button type="submit" class="control primary auth-submit" id="register-submit">'+(organization?'Submit application':'Create account')+'</button><p class="auth-switch">Already have an account? <button type="button" class="text-button" data-auth-view="signin">Sign in</button></p></form>';
}
function authSubmittedView():string{
 const account=authSubmitted!;
 return '<div class="auth-done"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg><h1>Application submitted</h1><p><strong>'+de(account.organization)+'</strong> is waiting for review. An AniBayan administrator checks your documents, then approves or declines the application.</p>'+(account.requestedBarangay?'<p class="auth-notice">Your barangay was not in the list. It will be added to AniBayan’s options if your application is approved.</p>':'')+'<p>Once it’s approved, sign in as <strong>'+de(account.email)+'</strong> to add your crop listings.</p><div class="detail-actions"><a class="control" href="index.html">Back to homepage</a><button class="control primary" data-auth-view="signin">Go to sign in</button></div></div>';
}
function authRender():void{
 const current=dashAccountByEmail(dashSessionEmail());
 const banner=current&&current.status==='Active'&&authView!=='submitted'?'<div class="auth-signed-in"><span>Signed in as <strong>'+de(current.name)+'</strong></span><a href="'+dashHomeFor(current)+'">Go to your dashboard</a><button type="button" data-auth-sign-out>Sign out</button></div>':'';
 const tabs=authView==='signin'||authView==='register'?'<div class="auth-tabs" role="tablist" aria-label="Account"><button role="tab" id="tab-signin" aria-selected="'+(authView==='signin')+'" aria-controls="auth-panel" data-auth-view="signin">Sign in</button><button role="tab" id="tab-register" aria-selected="'+(authView==='register')+'" aria-controls="auth-panel" data-auth-view="register">Create account</button></div>':'';
 const panel=authView==='signin'?authSignInView():authView==='register'?authRegisterView():authView==='forgot'?authForgotView():authView==='reset'?authResetView():authSubmittedView();
 authRoot.innerHTML=banner+tabs+'<div id="auth-panel"'+(tabs?' role="tabpanel" aria-labelledby="tab-'+(authView==='register'?'register':'signin')+'"':'')+'>'+panel+'</div>';
 dashSetupPasswordToggles(authRoot);
 document.title='AniBayan — '+(authView==='register'?'Create an account':authView==='forgot'?'Forgot password':authView==='reset'?'Reset password':'Sign in');
}
function authSetView(view:AuthView):void{
 authView=view;
 const url=new URL(location.href);
 if(view!=='reset'&&authResetToken){url.searchParams.delete('reset');url.searchParams.delete('token');url.searchParams.delete('email');}
 url.hash=view==='register'?'#register':view==='forgot'?'#forgot':view==='reset'?'#reset':'';
 history.replaceState(null,'',url.pathname+url.search+url.hash);
 authRender();
 document.querySelector<HTMLElement>('#auth-panel input')?.focus();
}
// The server checks the password (stored only as a hash), logs the attempt and starts the session.
async function authSignIn(form:HTMLFormElement):Promise<void>{
 const data=new FormData(form);
 const email=String(data.get('email')??'').trim(),password=String(data.get('password')??'');
 const errors:Record<string,string>={};
 if(!authEmailPattern.test(email))errors.email='Enter your email address.';
 if(!password)errors.password='Enter your password.';
 if(!dashShowErrors(form,errors))return;
 const error=document.getElementById('signin-error')!;
 error.hidden=true;
 const r=await dashApi('login',{email,password});
 if(r.ok){location.href=authDestination(String(r.data.role));return;}
 const fields=dashFieldErrors(r.data.errors);
 if(Object.keys(fields).length)dashShowErrors(form,fields);
 else{error.hidden=false;error.textContent=dashMessage(r);}
}
async function authForgotPassword(form:HTMLFormElement):Promise<void>{
 const email=String(new FormData(form).get('email')??'').trim();
 if(!authEmailPattern.test(email)){dashShowErrors(form,{email:'Enter your email address.'});return;}
 const submit=form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
 const error=document.getElementById('forgot-error')!;
 submit.disabled=true;error.hidden=true;
 const r=await dashApi('password/forgot',{email});
 submit.disabled=false;
 if(!r.ok){error.hidden=false;error.textContent=dashMessage(r);return;}
 authForgotEmail=email;authForgotSent=true;authRender();
}
async function authResetPassword(form:HTMLFormElement):Promise<void>{
 const data=new FormData(form),password=String(data.get('password')??''),confirm=String(data.get('password_confirmation')??'');
 const errors:Record<string,string>={};
 if(password.length<8)errors.password='Use at least 8 characters.';
 if(!confirm)errors.password_confirmation='Enter your password again.';
 else if(confirm!==password)errors.password_confirmation='The passwords do not match.';
 if(!dashShowErrors(form,errors))return;
 const submit=form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
 const error=document.getElementById('reset-error')!;
 submit.disabled=true;error.hidden=true;
 const r=await dashApi('password/reset',{email:authResetEmail,token:authResetToken,password,password_confirmation:confirm});
 submit.disabled=false;
 if(!r.ok){const fields=dashFieldErrors(r.data.errors);if(Object.keys(fields).length)dashShowErrors(form,fields);else{error.hidden=false;error.textContent=dashMessage(r);}return;}
 location.href=location.pathname+'?notice=password-reset';
}
// The file inputs of the document slots.
function authDocumentInputs(form:HTMLFormElement):HTMLInputElement[]{return Array.from(form.querySelectorAll<HTMLInputElement>('.doc-upload input[type=file]'));}
// Shows the chosen file in its slot, or turns it away (wrong kind of file, too big) with a message under the list.
function authDocumentChosen(input:HTMLInputElement):void{
 const slot=input.closest<HTMLElement>('.doc-upload')!;
 const file=input.files?.[0];
 if(file&&(!authDocumentTypes.includes(file.type)||file.size>authDocumentMaxBytes||file.size===0)){
  input.value='';
  dashShowErrors(input.form!,{documents:'Choose a PDF, JPG, PNG or WebP file of up to 5 MB.'});
 }
 const kept=input.files?.[0];
 slot.classList.toggle('is-attached',!!kept);
 slot.querySelector('[data-doc-file]')!.textContent=kept?kept.name+' · '+authFileSize(kept.size):authDocumentHint;
 slot.querySelector('[data-doc-action]')!.textContent=kept?'Replace':'Attach';
 slot.querySelector<HTMLElement>('[data-doc-remove]')!.hidden=!kept;
}
async function authRegister(form:HTMLFormElement):Promise<void>{
 const data=new FormData(form);
 const value=(name:string)=>String(data.get(name)??'').trim();
 const organization=value('type')==='organization';
 const barangayChoice=value('barangayChoice');
 const barangay=barangayChoice==='__other__'?value('barangayOther').replace(/\s+/g,' '):barangayChoice;
 const password=String(data.get('password')??''),confirm=String(data.get('password_confirmation')??'');
 const files=organization?authDocumentInputs(form).filter(input=>input.files?.length):[];
 const errors:Record<string,string>={};
 if(value('name').length<3)errors.name='Enter your full name.';
 if(!authEmailPattern.test(value('email')))errors.email='Enter an email address like name@example.com.';
 if(!dashPhonePattern.test(value('phone')))errors.phone='Enter a mobile number like 0917 555 0148.';
 if(password.length<8)errors.password='Use at least 8 characters.';
 if(!confirm)errors.password_confirmation='Enter your password again.';
 else if(confirm!==password)errors.password_confirmation='The passwords don’t match.';
 if(organization){
  if(value('orgName').length<3)errors.orgName='Enter your organization’s name.';
  if(barangayChoice==='__other__'){
   if(barangay.length<2)errors.barangayOther='Enter your barangay name.';
   else if(dashBarangays.some(name=>name.toLocaleLowerCase()===barangay.toLocaleLowerCase()))errors.barangayOther='This barangay is already listed. Choose it from the list.';
  }else if(!dashBarangays.includes(barangayChoice))errors.barangayChoice='Choose your barangay.';
  if(value('crops').length<3)errors.crops='Enter your main crops.';
  if(!files.length)errors.documents='Attach at least one document.';
 }
 const error=document.getElementById('register-error')!;
 error.hidden=true;
 // The documents list has no single field to mark, so its first slot gets the focus when it's the only problem.
 if(!dashShowErrors(form,errors)||errors.documents){
  if(errors.documents&&Object.keys(errors).length===1)authDocumentInputs(form)[0]?.focus();
  return;
 }
 const body=new FormData();
 (organization?['type','name','email','phone','orgName','crops']:['type','name','email','phone']).forEach(name=>body.append(name,value(name)));
 if(organization)body.append('barangay',barangay);
 body.append('password',password);body.append('password_confirmation',confirm);
 files.forEach(input=>body.append(input.name,input.files![0]));
 const submit=document.getElementById('register-submit') as HTMLButtonElement;
 submit.disabled=true;
 // The server checks everything again; whatever it turns down gets one generic message (AuthController::register).
 const r=await dashApi('register',body);
 submit.disabled=false;
 if(!r.ok){error.hidden=false;error.textContent=dashMessage(r);return;}
 if(!organization){const next=authDestination('Consumer');location.href=next==='consumer.html'?'consumer.html#shop':next;return;}
 authSubmitted={organization:String(r.data.organization),email:String(r.data.email),requestedBarangay:barangayChoice==='__other__'};authView='submitted';authRender();
 window.scrollTo(0,0);
}
document.addEventListener('click',event=>{
 const el=(event.target as Element).closest<HTMLElement>('button');
 if(!el)return;
 if(el.dataset.authView){
  const next=el.dataset.authView as AuthView;
  if(!['signin','register','forgot','reset'].includes(next))return;
  if(next==='forgot'){
   const email=document.querySelector<HTMLInputElement>('#signin-form [name="email"]');
   authForgotEmail=email?.value.trim()||'';authForgotSent=false;
  }
  authSetView(next);
  return;
 }
 if(el.dataset.docRemove){
  const input=el.closest('.doc-upload')!.querySelector<HTMLInputElement>('input[type=file]')!;
  input.value='';authDocumentChosen(input);input.focus();
  return;
 }
 if(el.hasAttribute('data-auth-sign-out'))void dashApi('logout',{}).then(()=>dashFetchState()).then(()=>authRender());
});
document.addEventListener('input',event=>{
 const input=event.target as HTMLInputElement;
 if(input.type==='tel')dashLimitPhone(input);
 dashClearFieldError(input);
 if(input.name==='type'){
  const organization=input.value==='organization';
  document.querySelector<HTMLElement>('.org-fields')!.hidden=!organization;
  document.getElementById('register-submit')!.textContent=organization?'Submit application':'Create account';
 }
});
document.addEventListener('change',event=>{
 const input=event.target as HTMLInputElement;
 if(input.name==='barangayChoice'){
  const other=document.getElementById('barangay-other-wrap');
  const show=input.value==='__other__';
  if(other)other.hidden=!show;
  const field=document.getElementById('field-barangayOther') as HTMLInputElement|null;
  if(field){field.required=show;if(show)field.focus();}
 }
 if(input.type==='file'&&input.closest('.doc-upload')){
  const slot=input.form?.querySelector('[data-error-for="documents"]');
  if(slot)slot.textContent='';
  authDocumentChosen(input);
 }
});
document.addEventListener('submit',event=>{
 const form=event.target as HTMLFormElement;
 event.preventDefault();
 if(form.id==='signin-form')void authSignIn(form);
 else if(form.id==='register-form')void authRegister(form);
 else if(form.id==='forgot-form')void authForgotPassword(form);
 else if(form.id==='reset-form')void authResetPassword(form);
});
window.addEventListener('hashchange',()=>{authView=location.hash==='#register'?'register':location.hash==='#forgot'?'forgot':location.hash==='#reset'&&authResetToken?'reset':'signin';authRender();});
// Asking the server who is signed in also gives the page its anti-forgery cookie for signing in.
void dashFetchState().then(()=>authRender());
