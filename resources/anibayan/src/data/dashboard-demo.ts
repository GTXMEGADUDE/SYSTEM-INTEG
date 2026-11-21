// The shapes of AniBayan's data as the server sends it (App\Support\AppState), plus date helpers and Calapan's barangays.
interface DashboardPeriod { label:string; value:number; orders:number; labels:string[]; values:number[]; orderValues:number[]; valueScale:number; orderScale:number }
interface DashboardOrderItem { crop:string; name:string; quantity:number; unit:string; price:number }
// Orders placed through checkout also carry their items, delivery details and payment method.
// checkout: the PayMongo checkout opened for an unpaid order; paymentRef: PayMongo's payment id once it is paid.
interface DashboardOrder { id:string; customer:string; organization:string; crop:string; image:string; quantity:string; total:number; date:string; status:string; payment:string; items?:DashboardOrderItem[]; address?:string; phone?:string; method?:string; note?:string; checkout?:string; paymentRef?:string }
// harvested: date the crop was harvested (required on every listing). shelfLife: days the produce keeps well after harvest.
// image: a file in assets/ or an uploaded photo saved on the server ("uploads/listings/….jpg").
interface DashboardCrop { id:string; name:string; organization:string; image:string; price:number; unit:string; category:string; stock:number; status:string; harvested:string; shelfLife:number }
// status: 'Active' (approved and selling), 'Pending review' (application waiting for an administrator), 'Declined', or
// 'Terminated' (removed after its final warning; terminated is the date and terminatedFor the offence that ended it).
// A profile's picture and banner: uploaded photos saved on the server. bannerX/bannerY: the banner's focal point in %.
interface DashboardLook { avatar?:string; banner?:string; bannerX?:number; bannerY?:number }
// What a buyer's profile shows to others. Every option is on until the buyer turns it off.
interface DashboardPrivacy { profile:boolean; reviews:boolean; city:boolean; growers:boolean }
// completedOrders: worked out by the server for the public profile.
interface DashboardOrganization extends DashboardLook { name:string; region:string; crop:string; image:string; listings:number; status:string; representative:string; applied:string; members:number; documents:string[]; approved?:string; phone?:string; description?:string; terminated?:string; terminatedFor?:string; completedOrders?:number }
// Starting accounts use dashDemoPassword until their password is changed or reset. Only administrators and the person
// themself get email, phone, address and last-active; others get the public profile, trimmed by the buyer's privacy
// settings. city, completedOrders and growers: a buyer's public profile details, worked out by the server.
// On a public profile the page sets the missing email, joined and lastActive to ''.
interface DashboardAccount extends DashboardLook { name:string; email:string; role:string; organization?:string; joined:string; lastActive:string; status:string; note?:string; phone?:string; address?:string; privacy?:Partial<DashboardPrivacy>; city?:string; completedOrders?:number; growers?:string[] }
// Buyer feedback: 1–5 stars for a completed order, with an optional comment.
interface DashboardFeedback { id:string; organization:string; customer:string; rating:number; comment:string; date:string; order?:string }
// status: 'Open' (waiting for an administrator), 'Upheld' (counts as a warning against the organization) or 'Dismissed'.
// decided: the day an administrator upheld or dismissed it.
interface DashboardReport { id:string; organization:string; customer:string; reason:string; details:string; date:string; status:string; order?:string; decided?:string }
// A warning an administrator gave an organization directly. Upheld reports are warnings too; see dashWarningsFor.
interface DashboardWarning { id:string; organization:string; reason:string; details:string; date:string; by:string }
// One event in the administrators' activity log. actor: the email that did it (also an unknown email that tried to
// sign in). target: the account an administrator acted on. type: a key of dashActivityTypes in dashboards.ts.
interface DashboardActivity { time:string; actor:string; type:string; detail:string; target?:string }
interface DashboardMember { id:string; organization:string; name:string; place:string; crops:string; area:number; joined:string; status:string }
interface DashboardCartLine { crop:string; quantity:number }
// One run of the admin site-health checks.
interface DashboardHealthResult { service:string; ok:boolean; latency:number; error?:string }
// CPU (% in use), memory and storage (bytes) of the machine serving AniBayan; null when it can't be read.
interface DashboardHardware { cpu:number|null; cores:number|null; memoryUsed:number|null; memoryTotal:number|null; storageUsed:number|null; storageTotal:number|null }
interface DashboardHealthRun { time:string; results:DashboardHealthResult[]; hardware?:DashboardHardware; hardwareError?:string }

const dashTodayDate=new Date();
const dashIsoDate=(date:Date)=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
const dashToday=dashIsoDate(dashTodayDate);
const dashDaysAgo=(days:number)=>{const date=new Date(dashTodayDate);date.setDate(date.getDate()-days);return dashIsoDate(date);};
const dashDemoPassword='anibayan';

// The data itself comes from AniBayan's server (see shared.ts); these lists hold the signed-in person's copy.
// The starting data is in database/seeders/DatabaseSeeder.php.
const dashboardOrders:DashboardOrder[]=[];
const dashboardCrops:DashboardCrop[]=[];
const dashboardOrganizations:DashboardOrganization[]=[];
const dashboardAccounts:DashboardAccount[]=[];
const dashboardFeedback:DashboardFeedback[]=[];
const dashboardReports:DashboardReport[]=[];
const dashboardWarnings:DashboardWarning[]=[];
const dashboardActivity:DashboardActivity[]=[];
const dashboardMembers:DashboardMember[]=[];
// Saved harvests and shopping carts, keyed by buyer email (only the signed-in buyer's).
const dashboardSaved:Record<string,string[]>={};
const dashboardCarts:Record<string,DashboardCartLine[]>={};
// Results of the admin site-health checks, oldest first; the server keeps the newest 30 runs.
const dashboardHealthLog:DashboardHealthRun[]=[];
// AniBayan serves Calapan City, Oriental Mindoro only. Organizations and delivery addresses pick one of its
// 62 barangays (names from Philippines JSON Maps, PSGC 2026-3q). An organization's region is "<barangay>, Calapan City".
const dashCityName='Calapan City';
const dashBarangays=['Balingayan','Balite','Baruyan','Batino','Bayanan I','Bayanan II','Biga','Bondoc','Bucayao','Buhuan','Bulusan','Calero','Camansihan','Camilmil','Canubing I','Canubing II','Comunal','Guinobatan','Gulod','Gutad','Ibaba East','Ibaba West','Ilaya','Lalud','Lazareto','Libis','Lumangbayan','Mahal Na Pangalan','Maidlang','Malad','Malamig','Managpi','Masipit','Nag-Iba I','Nag-Iba II','Navotas','Pachoca','Palhi','Panggalaan','Parang','Patas','Personas','Puting Tubig','Salong','San Antonio','San Vicente Central','San Vicente East','San Vicente North','San Vicente South','San Vicente West','Sapul','Silonay','Sta. Cruz','Sta. Isabel','Sta. Maria Village','Sta. Rita','Sto. Niño','Suqui','Tawagan','Tawiran','Tibag','Wawa'];
// Delivery addresses: "<house and street>, Barangay <name>, Calapan City, Oriental Mindoro".
const dashJoinAddress=(street:string,barangay:string)=>street+', Barangay '+barangay+', '+dashCityName+', Oriental Mindoro';
function dashSplitAddress(address?:string):{street:string;barangay:string}{
 const match=/^(.*?),\s*Barangay ([^,]+),\s*Calapan City\b/i.exec(address||'');
 if(match&&dashBarangays.includes(match[2].trim()))return {street:match[1].trim(),barangay:match[2].trim()};
 return {street:(address||'').replace(/,\s*Calapan City.*$/i,'').trim(),barangay:''};
}
const dashBarangayOptions=(current:string)=>'<option value="">Choose a barangay…</option>'+dashBarangays.map(b=>'<option'+(b===current?' selected':'')+'>'+b+'</option>').join('');
