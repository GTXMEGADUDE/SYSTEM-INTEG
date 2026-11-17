// Sign-in and create-account page (login.html). Accounts are part of the browser-stored AniBayan data the dashboards share:
// buyers can sign up and shop right away; organization representatives apply and can sign in once an administrator approves.
dashLoadStore();
const authRoot=document.getElementById('auth-content')!;
const authParams=new URLSearchParams(location.search);
const authEmailPattern=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
type AuthView='signin'|'register'|'submitted';
let authView:AuthView=location.hash==='#register'?'register':'signin';
let authSubmitted:DashboardAccount|undefined;
const authSamples=[['alex@example.com','Buyer'],['ramon@example.com','Benguet Highland Growers'],['admin@example.com','Platform administrator']];
const authNotices:Record<string,string>={
 signin:'Sign in to continue.',
 buyer:'Sign in with a buyer account to order, save harvests and rate growers.',
 admin:'Sign in with an administrator account to open the admin workspace.',
 organization:'Sign in with your organization representative account to open your workspace.',
 suspended:'You were signed out because an AniBayan administrator suspended that account.',
 pending:'That organization application is still being reviewed.',
 declined:'That organization application was declined.',
};
// Where to go after signing in: back to the page that asked (when it suits the account's role), otherwise the role's home.
function authDestination(account:DashboardAccount):string{
 const next=authParams.get('next')||'';
 const roles:Record<string,string>={'consumer.html':'Consumer','organization.html':'Representative','admin.html':'Administrator'};
 return roles[next.split(/[?#]/)[0]]===account.role?next:dashHomeFor(account);
}
const authDocuments=['CDA or SEC registration','Barangay endorsement','Representative ID'];
const authAvatarClass=(role:string)=>role==='Administrator'?'admin-avatar':role==='Representative'?'organization-avatar':'consumer-avatar';
const authInitials=(name:string)=>name.split(' ').map(part=>part[0]).join('').slice(0,2).toUpperCase();
const authArrow='<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14 m-5-5 5 5-5 5"/></svg>';

function authSignInView():string{
 const notice=authNotices[authParams.get('notice')||''];
 const samples=authSamples.map(([email,label])=>{
  const account=dashAccountByEmail(email);
  if(!account)return '';
  return '<button class="demo-account" data-sample="'+de(email)+'"><span class="avatar '+authAvatarClass(account.role)+'">'+(account.role==='Administrator'?'AD':authInitials(account.name))+'</span><span><strong>'+de(account.name)+'</strong><small>'+de(label)+'</small></span>'+authArrow+'</button>';
 }).join('');
 return '<form class="auth-form" id="signin-form" novalidate><h1>Welcome back</h1><p class="auth-lead">Sign in to shop fresh harvests or manage your organization.</p>'+(notice?'<p class="auth-notice">'+notice+'</p>':'')+'<div class="form-grid single">'
  +dashField('email','Email','<input type="email" required autocomplete="email" placeholder="name@example.com">')
  +dashField('password','Password','<input type="password" required autocomplete="current-password">')
  +'</div><p class="form-error" id="signin-error" role="alert" hidden></p><button type="submit" class="control primary auth-submit">Sign in</button><p class="auth-switch">New to AniBayan? <button type="button" class="text-button" data-auth-view="register">Create an account</button></p></form>'
  +'<div class="demo-accounts"><h2>Test accounts</h2><p>Each test account uses the password <strong>'+dashDemoPassword+'</strong> until it’s changed. Choose one to sign in.</p><div class="demo-list">'+samples+'</div></div>';
}
function authRegisterView():string{
 const organization=authParams.get('type')==='organization';
 const choice=(value:string,title:string,text:string,checked:boolean)=>'<label class="choice"><input type="radio" name="type" value="'+value+'"'+(checked?' checked':'')+'><span><strong>'+title+'</strong><small>'+text+'</small></span></label>';
 return '<form class="auth-form" id="register-form" novalidate><h1>Create your account</h1><p class="auth-lead">Buy fresh harvests, or apply to sell for your farmer organization.</p>'
  +'<div class="form-field auth-type"><span class="form-label" id="type-label">I want to</span><div class="choice-list two" role="radiogroup" aria-labelledby="type-label">'+choice('buyer','Buy harvests','Shop from local growing communities.',!organization)+choice('organization','Sell for my organization','An administrator reviews new organizations.',organization)+'</div></div>'
  +'<div class="form-grid">'
  +dashField('name','Full name'+dashRequired,'<input required maxlength="80" autocomplete="name">','',true)
  +dashField('email','Email'+dashRequired,'<input type="email" required maxlength="120" autocomplete="email" placeholder="name@example.com">')
  +dashField('phone','Mobile number'+dashRequired,'<input type="tel" required maxlength="20" autocomplete="tel" placeholder="0917 555 0148">')
  +dashField('password','Password'+dashRequired,'<input type="password" required minlength="8" autocomplete="new-password">','At least 8 characters. Accounts are stored in this browser, so don’t reuse a password you use elsewhere.',true)
  +'</div><div class="form-grid org-fields"'+(organization?'':' hidden')+'><h2 class="form-section">Your organization</h2>'
  +dashField('orgName','Organization name'+dashRequired,'<input required maxlength="80">','',true)
  +dashField('province','Province'+dashRequired,'<input required maxlength="60">')
  +dashField('region','Region'+dashRequired,'<select required><option value="">Choose a region…</option>'+dashRegions.map(r=>'<option>'+de(r)+'</option>').join('')+'</select>')
  +dashField('crops','Main crops'+dashRequired,'<input required maxlength="80" placeholder="e.g. Highland vegetables">')
  +dashField('members','Member farmers'+dashRequired,'<input type="number" required min="1" step="1" inputmode="numeric">')
  +'<div class="form-field wide"><span class="form-label" id="documents-label">Documents you can submit'+dashRequired+'</span><div class="check-group" role="group" aria-labelledby="documents-label" aria-describedby="error-documents">'+authDocuments.map(d=>'<label class="check-row"><input type="checkbox" name="documents" value="'+de(d)+'"> '+de(d)+'</label>').join('')+'</div><small class="field-error" id="error-documents" data-error-for="documents"></small></div>'
  +'</div><button type="submit" class="control primary auth-submit" id="register-submit">'+(organization?'Submit application':'Create account')+'</button><p class="auth-switch">Already have an account? <button type="button" class="text-button" data-auth-view="signin">Sign in</button></p></form>';
}
function authSubmittedView():string{
 const account=authSubmitted!;
 return '<div class="auth-done"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg><h1>Application submitted</h1><p><strong>'+de(account.organization||'')+'</strong> is waiting for review. An AniBayan administrator checks your documents, then approves or declines the application.</p><p>Once it’s approved, sign in as <strong>'+de(account.email)+'</strong> to add your crop listings.</p><div class="detail-actions"><a class="control" href="index.html">Back to homepage</a><button class="control primary" data-auth-view="signin">Go to sign in</button></div></div>';
}
function authRender():void{
 const current=dashAccountByEmail(dashSessionEmail());
 const banner=current&&current.status==='Active'&&authView!=='submitted'?'<div class="auth-signed-in"><span>Signed in as <strong>'+de(current.name)+'</strong></span><a href="'+dashHomeFor(current)+'">Go to your dashboard</a><button type="button" data-auth-sign-out>Sign out</button></div>':'';
 const tabs=authView==='submitted'?'':'<div class="auth-tabs" role="tablist" aria-label="Account"><button role="tab" id="tab-signin" aria-selected="'+(authView==='signin')+'" aria-controls="auth-panel" data-auth-view="signin">Sign in</button><button role="tab" id="tab-register" aria-selected="'+(authView==='register')+'" aria-controls="auth-panel" data-auth-view="register">Create account</button></div>';
 authRoot.innerHTML=banner+tabs+'<div id="auth-panel" role="tabpanel" aria-labelledby="tab-'+(authView==='register'?'register':'signin')+'">'+(authView==='signin'?authSignInView():authView==='register'?authRegisterView():authSubmittedView())+'</div>';
 document.title='AniBayan — '+(authView==='signin'?'Sign in':'Create an account');
}
function authSignIn(form:HTMLFormElement):void{
 const data=new FormData(form);
 const email=String(data.get('email')??'').trim(),password=String(data.get('password')??'');
 const errors:Record<string,string>={};
 if(!authEmailPattern.test(email))errors.email='Enter your email address.';
 if(!password)errors.password='Enter your password.';
 if(!dashShowErrors(form,errors))return;
 const error=document.getElementById('signin-error')!;
 const fail=(message:string)=>{error.hidden=false;error.textContent=message;};
 const account=dashAccountByEmail(email);
 const refuse=(type:string,detail:string,message:string)=>{dashLog(type,account?account.email:email.toLowerCase(),detail);dashSaveStore();fail(message);};
 if(!account){refuse('signin-failed','No account with this email','The email or password is incorrect.');return;}
 if((account.password||dashDemoPassword)!==password){refuse('signin-failed','Wrong password','The email or password is incorrect.');return;}
 if(account.status==='Suspended'){refuse('signin-blocked','Account suspended','This account is suspended. Contact AniBayan support if you think this is a mistake.');return;}
 if(account.status==='Pending'){refuse('signin-waiting','Application under review','Your organization application is still being reviewed. You can sign in once an administrator approves it.');return;}
 if(account.status==='Declined'){refuse('signin-blocked','Application declined','Your organization application was declined, so this account can’t sign in.');return;}
 if(account.status==='Terminated'){refuse('signin-blocked','Organization terminated','Your organization was terminated after repeated warnings, so this account can’t sign in.');return;}
 account.lastActive=dashToday;
 dashLog('signin',account.email);
 dashSaveStore();dashSetSession(account.email);
 location.href=authDestination(account);
}
function authRegister(form:HTMLFormElement):void{
 const data=new FormData(form);
 const value=(name:string)=>String(data.get(name)??'').trim();
 const organization=value('type')==='organization';
 const errors:Record<string,string>={};
 if(value('name').length<3)errors.name='Enter your full name.';
 if(!authEmailPattern.test(value('email')))errors.email='Enter an email address like name@example.com.';
 else if(dashAccountByEmail(value('email')))errors.email='An account already uses this email. Sign in instead.';
 if(!dashPhonePattern.test(value('phone')))errors.phone='Enter a mobile number like 0917 555 0148.';
 if(String(data.get('password')??'').length<8)errors.password='Use at least 8 characters.';
 if(organization){
  if(value('orgName').length<3)errors.orgName='Enter your organization’s name.';
  else if(dashboardOrganizations.some(o=>o.name.toLowerCase()===value('orgName').toLowerCase()))errors.orgName='An organization with this name is already on AniBayan.';
  if(value('province').length<3)errors.province='Enter your province.';
  if(!dashRegions.includes(value('region')))errors.region='Choose your region.';
  if(value('crops').length<3)errors.crops='Enter your main crops.';
  const members=Number(value('members'));
  if(!Number.isInteger(members)||members<1)errors.members='Enter how many farmers are members.';
  if(!data.getAll('documents').length)errors.documents='Choose at least one document you can submit.';
 }
 if(!dashShowErrors(form,errors))return;
 const account:DashboardAccount={name:value('name'),email:value('email'),role:organization?'Representative':'Consumer',joined:dashToday,lastActive:dashToday,status:organization?'Pending':'Active',phone:value('phone'),password:String(data.get('password'))};
 if(organization){
  account.organization=value('orgName');
  dashboardOrganizations.push({name:account.organization,region:value('province')+', '+value('region'),crop:value('crops'),image:'field-detail.jpg',listings:0,status:'Pending review',representative:account.name,applied:dashToday,members:Number(value('members')),documents:data.getAll('documents').map(String),phone:account.phone});
 }
 dashboardAccounts.push(account);
 dashLog('register',account.email,organization?'Organization application · '+account.organization:'Buyer');
 dashSaveStore();
 if(!organization){dashSetSession(account.email);const next=authDestination(account);location.href=next==='consumer.html'?'consumer.html#shop':next;return;}
 authSubmitted=account;authView='submitted';authRender();
 window.scrollTo(0,0);
}
document.addEventListener('click',event=>{
 const el=(event.target as Element).closest<HTMLElement>('button');
 if(!el)return;
 if(el.dataset.authView){
  authView=el.dataset.authView==='register'?'register':'signin';
  history.replaceState(null,'',location.pathname+location.search+(authView==='register'?'#register':''));
  authRender();
  document.querySelector<HTMLElement>('#auth-panel input')?.focus();
  return;
 }
 if(el.dataset.sample){
  const form=document.getElementById('signin-form') as HTMLFormElement|null;
  if(!form)return;
  (form.elements.namedItem('email') as HTMLInputElement).value=el.dataset.sample;
  (form.elements.namedItem('password') as HTMLInputElement).value=dashDemoPassword;
  authSignIn(form);
  return;
 }
 if(el.hasAttribute('data-auth-sign-out')){dashClearSession();authRender();}
});
document.addEventListener('input',event=>{
 const input=event.target as HTMLInputElement;
 dashClearFieldError(input);
 if(input.name==='type'){
  const organization=input.value==='organization';
  document.querySelector<HTMLElement>('.org-fields')!.hidden=!organization;
  document.getElementById('register-submit')!.textContent=organization?'Submit application':'Create account';
 }
});
document.addEventListener('submit',event=>{
 const form=event.target as HTMLFormElement;
 event.preventDefault();
 if(form.id==='signin-form')authSignIn(form);
 else if(form.id==='register-form')authRegister(form);
});
window.addEventListener('hashchange',()=>{authView=location.hash==='#register'?'register':'signin';authRender();});
authRender();
