// Starting data for AniBayan. shared.ts keeps the working copy in the browser, so every page sees the same accounts,
// listings and orders. Dates are relative to the day the data is created, so a fresh copy is always current.
interface DashboardPeriod { label:string; value:number; orders:number; labels:string[]; values:number[]; orderValues:number[]; valueScale:number; orderScale:number }
interface DashboardOrderItem { crop:string; name:string; quantity:number; unit:string; price:number }
// Orders placed through checkout also carry their items, delivery details and payment method.
// checkout: the PayMongo checkout opened for an unpaid order; paymentRef: PayMongo's payment id once it is paid.
interface DashboardOrder { id:string; customer:string; organization:string; crop:string; image:string; quantity:string; total:number; date:string; status:string; payment:string; items?:DashboardOrderItem[]; address?:string; phone?:string; method?:string; note?:string; checkout?:string; paymentRef?:string }
// harvested: date the crop was harvested (required on every listing). shelfLife: days the produce keeps well after harvest.
// image: a file in assets/ or an uploaded photo stored as a data URL.
interface DashboardCrop { id:string; name:string; organization:string; image:string; price:number; unit:string; category:string; stock:number; status:string; harvested:string; shelfLife:number }
// status: 'Active' (approved and selling), 'Pending review' (application waiting for an administrator), 'Declined', or
// 'Terminated' (removed after its final warning; terminated is the date and terminatedFor the offence that ended it).
// A profile's picture and banner: uploaded photos stored as data URLs. bannerX/bannerY: the banner's focal point in %.
interface DashboardLook { avatar?:string; banner?:string; bannerX?:number; bannerY?:number }
// What a buyer's profile shows to others. Every option is on until the buyer turns it off.
interface DashboardPrivacy { profile:boolean; reviews:boolean; city:boolean; growers:boolean }
interface DashboardOrganization extends DashboardLook { name:string; region:string; crop:string; image:string; listings:number; status:string; representative:string; applied:string; members:number; documents:string[]; approved?:string; phone?:string; description?:string; terminated?:string; terminatedFor?:string }
// Starting accounts use dashDemoPassword until their password is changed or reset.
interface DashboardAccount extends DashboardLook { name:string; email:string; role:string; organization?:string; joined:string; lastActive:string; status:string; note?:string; phone?:string; address?:string; password?:string; privacy?:Partial<DashboardPrivacy> }
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

// Orders: [number, buyer, organization, crop, image, quantity, total, days ago, status, payment]
const dashboardOrders:DashboardOrder[]=([
 [1048,'Alex Reyes','Benguet Highland Growers','Highland vegetable basket','vegetable-cutout.png','3 items',485,0,'Processing','Paid'],
 [1047,'Maria Santos','Guimaras Mango Farmers','Carabao mangoes','mango.jpg','5 kg',650,0,'Pending','Unpaid'],
 [1046,'Carlo Mendoza','Nueva Ecija Rice Growers','Dinorado rice','rice.jpg','25 kg',1450,1,'Confirmed','Paid'],
 [1045,'Alex Reyes','Guimaras Mango Farmers','Carabao mangoes','mango.jpg','2 kg',260,2,'Completed','Paid'],
 [1044,'Isabel Cruz','Benguet Highland Growers','Fresh carrots','carrot.jpg','4 kg',280,2,'Completed','Paid'],
 [1043,'Alex Reyes','Nueva Ecija Rice Growers','Dinorado rice','rice.jpg','10 kg',580,4,'Completed','Paid'],
 [1042,'Daniel Tan','Benguet Highland Growers','Red onions','onion.jpg','2 kg',180,5,'Cancelled','Unpaid'],
 [1041,'Alex Reyes','Benguet Highland Growers','Fresh carrots','carrot.jpg','2 kg',140,6,'Pending','Unpaid'],
 [1040,'Maria Santos','Benguet Highland Growers','Vine-ripened tomatoes','tomatoes.jpg','6 kg',480,6,'Confirmed','Paid'],
 [1039,'Isabel Cruz','Benguet Highland Growers','Sweet potatoes','sweet-potatoes.jpg','8 kg',360,7,'Completed','Paid'],
 [1038,'Carlo Mendoza','Benguet Highland Growers','Red onions','onion.jpg','5 kg',450,7,'Completed','Paid'],
 [1037,'Daniel Tan','Nueva Ecija Rice Growers','Dinorado rice','rice.jpg','15 kg',870,9,'Completed','Paid'],
 [1036,'Maria Santos','Benguet Highland Growers','Fresh carrots','carrot.jpg','5 kg',350,10,'Completed','Paid'],
 [1035,'Isabel Cruz','Guimaras Mango Farmers','Golden bananas','bananas.jpg','4 kg',220,11,'Completed','Paid'],
 [1034,'Alex Reyes','Benguet Highland Growers','Vine-ripened tomatoes','tomatoes.jpg','3 kg',240,12,'Completed','Paid'],
 [1033,'Carlo Mendoza','Nueva Ecija Rice Growers','Dinorado rice','rice.jpg','20 kg',1160,13,'Completed','Paid'],
 [1032,'Daniel Tan','Guimaras Mango Farmers','Carabao mangoes','mango.jpg','3 kg',390,14,'Completed','Paid'],
 [1031,'Maria Santos','Benguet Highland Growers','Sweet potatoes','sweet-potatoes.jpg','6 kg',270,15,'Completed','Paid'],
 [1030,'Isabel Cruz','Nueva Ecija Rice Growers','Dinorado rice','rice.jpg','10 kg',580,17,'Completed','Paid'],
 [1029,'Alex Reyes','Benguet Highland Growers','Red onions','onion.jpg','3 kg',270,18,'Cancelled','Unpaid'],
 [1028,'Maria Santos','Guimaras Mango Farmers','Carabao mangoes','mango.jpg','4 kg',520,19,'Completed','Paid'],
 [1027,'Daniel Tan','Benguet Highland Growers','Fresh carrots','carrot.jpg','6 kg',420,21,'Completed','Paid'],
 [1026,'Carlo Mendoza','Benguet Highland Growers','Vine-ripened tomatoes','tomatoes.jpg','4 kg',320,23,'Completed','Paid'],
 [1025,'Isabel Cruz','Nueva Ecija Rice Growers','Dinorado rice','rice.jpg','25 kg',1450,24,'Completed','Paid'],
 [1024,'Alex Reyes','Guimaras Mango Farmers','Golden bananas','bananas.jpg','3 kg',165,26,'Completed','Paid'],
 [1023,'Maria Santos','Benguet Highland Growers','Red onions','onion.jpg','4 kg',360,27,'Completed','Paid'],
 [1022,'Daniel Tan','Nueva Ecija Rice Growers','Dinorado rice','rice.jpg','10 kg',580,30,'Completed','Paid'],
 [1021,'Isabel Cruz','Benguet Highland Growers','Sweet potatoes','sweet-potatoes.jpg','10 kg',450,33,'Completed','Paid'],
 [1020,'Carlo Mendoza','Guimaras Mango Farmers','Carabao mangoes','mango.jpg','5 kg',650,36,'Completed','Paid'],
] as [number,string,string,string,string,string,number,number,string,string][]).map(([n,customer,organization,crop,image,quantity,total,days,status,payment])=>({id:'AB-2026-'+n,customer,organization,crop,image,quantity,total,date:dashDaysAgo(days),status,payment}));
const dashboardCrops:DashboardCrop[]=[
 {id:'CROP-001',name:'Carabao mangoes',organization:'Guimaras Mango Farmers',image:'mango.jpg',price:130,unit:'kg',category:'Fruits',stock:180,status:'Active',harvested:dashDaysAgo(3),shelfLife:7},
 {id:'CROP-002',name:'Fresh carrots',organization:'Benguet Highland Growers',image:'carrot.jpg',price:70,unit:'kg',category:'Vegetables',stock:96,status:'Active',harvested:dashDaysAgo(2),shelfLife:21},
 {id:'CROP-003',name:'Dinorado rice',organization:'Nueva Ecija Rice Growers',image:'rice.jpg',price:58,unit:'kg',category:'Rice & grains',stock:850,status:'Active',harvested:dashDaysAgo(19),shelfLife:180},
 {id:'CROP-004',name:'Red onions',organization:'Benguet Highland Growers',image:'onion.jpg',price:90,unit:'kg',category:'Vegetables',stock:45,status:'Active',harvested:dashDaysAgo(11),shelfLife:30},
 {id:'CROP-005',name:'Purple eggplants',organization:'Benguet Highland Growers',image:'eggplant.jpg',price:65,unit:'kg',category:'Vegetables',stock:0,status:'Unavailable',harvested:dashDaysAgo(9),shelfLife:7},
 {id:'CROP-006',name:'Golden bananas',organization:'Guimaras Mango Farmers',image:'bananas.jpg',price:55,unit:'kg',category:'Fruits',stock:74,status:'Active',harvested:dashDaysAgo(4),shelfLife:6},
 {id:'CROP-007',name:'Vine-ripened tomatoes',organization:'Benguet Highland Growers',image:'tomatoes.jpg',price:80,unit:'kg',category:'Vegetables',stock:132,status:'Active',harvested:dashDaysAgo(1),shelfLife:7},
 {id:'CROP-008',name:'Sweet potatoes',organization:'Benguet Highland Growers',image:'sweet-potatoes.jpg',price:45,unit:'kg',category:'Vegetables',stock:28,status:'Active',harvested:dashDaysAgo(14),shelfLife:28},
];
const dashboardOrganizations:DashboardOrganization[]=[
 {name:'Benguet Highland Growers',region:'Benguet, Cordillera',crop:'Highland vegetables',image:'grower.png',listings:0,status:'Active',representative:'Ramon Dulnuan',applied:dashDaysAgo(39),members:6,documents:['CDA registration','Barangay endorsement','Representative ID'],approved:dashDaysAgo(34),phone:'0917 555 0110',description:'Smallholder vegetable growers from the highland municipalities of Benguet.'},
 {name:'Guimaras Mango Farmers',region:'Guimaras, Western Visayas',crop:'Mangoes & fruits',image:'mango.jpg',listings:0,status:'Active',representative:'Carlo Mendoza',applied:dashDaysAgo(42),members:14,documents:['CDA registration','Barangay endorsement','Representative ID'],approved:dashDaysAgo(38),phone:'0918 555 0122',description:'Mango and banana farmers from across Guimaras island.'},
 {name:'Nueva Ecija Rice Growers',region:'Nueva Ecija, Central Luzon',crop:'Rice & grains',image:'rice-hero.png',listings:0,status:'Active',representative:'Teodoro Pascual',applied:dashDaysAgo(46),members:31,documents:['CDA registration','Barangay endorsement','Representative ID'],approved:dashDaysAgo(43),phone:'0919 555 0133',description:'Rice farming families from the plains of Central Luzon.'},
 {name:'Laguna Harvest Collective',region:'Laguna, Calabarzon',crop:'Vegetables & roots',image:'soil-story.png',listings:0,status:'Pending review',representative:'Joel Malabanan',applied:dashDaysAgo(2),members:9,documents:['CDA registration','Barangay endorsement']},
 {name:'Quezon Coconut Farmers Association',region:'Quezon, Calabarzon',crop:'Coconuts & root crops',image:'seedlings-story.png',listings:0,status:'Pending review',representative:'Edna Villareal',applied:dashDaysAgo(1),members:22,documents:['SEC registration','Barangay endorsement','Representative ID']},
 {name:'Tarlac Vegetable Growers',region:'Tarlac, Central Luzon',crop:'Lowland vegetables',image:'field-detail.jpg',listings:0,status:'Declined',representative:'Ben Soriano',applied:dashDaysAgo(15),members:4,documents:['Representative ID']},
];
const dashboardAccounts:DashboardAccount[]=[
 {name:'Alex Reyes',email:'alex@example.com',role:'Consumer',joined:dashDaysAgo(44),lastActive:dashToday,status:'Active',phone:'0917 555 0148',address:'12 Mabini Street, Barangay San Isidro, Quezon City, Metro Manila'},
 {name:'Maria Santos',email:'maria@example.com',role:'Consumer',joined:dashDaysAgo(42),lastActive:dashToday,status:'Active',phone:'0927 555 0161',address:'45 Rizal Avenue, Barangay Poblacion, Calamba, Laguna'},
 {name:'Isabel Cruz',email:'isabel@example.com',role:'Consumer',joined:dashDaysAgo(40),lastActive:dashDaysAgo(1),status:'Active',phone:'0939 555 0172',address:'8 Session Road, Baguio City, Benguet'},
 {name:'Daniel Tan',email:'daniel@example.com',role:'Consumer',joined:dashDaysAgo(35),lastActive:dashDaysAgo(5),status:'Active',phone:'0945 555 0183',address:'23 Luna Street, Barangay 5, Iloilo City, Iloilo'},
 {name:'Jessa Bautista',email:'jessa@example.com',role:'Consumer',joined:dashDaysAgo(27),lastActive:dashDaysAgo(25),status:'Suspended',note:'Suspended after repeated abusive messages to growers.'},
 {name:'Ramon Dulnuan',email:'ramon@example.com',role:'Representative',organization:'Benguet Highland Growers',joined:dashDaysAgo(39),lastActive:dashToday,status:'Active',phone:'0917 555 0110'},
 {name:'Carlo Mendoza',email:'carlo@example.com',role:'Representative',organization:'Guimaras Mango Farmers',joined:dashDaysAgo(42),lastActive:dashDaysAgo(1),status:'Active',phone:'0918 555 0122'},
 {name:'Teodoro Pascual',email:'teodoro@example.com',role:'Representative',organization:'Nueva Ecija Rice Growers',joined:dashDaysAgo(46),lastActive:dashDaysAgo(2),status:'Active',phone:'0919 555 0133'},
 {name:'Joel Malabanan',email:'joel@example.com',role:'Representative',organization:'Laguna Harvest Collective',joined:dashDaysAgo(2),lastActive:dashDaysAgo(2),status:'Pending'},
 {name:'Edna Villareal',email:'edna@example.com',role:'Representative',organization:'Quezon Coconut Farmers Association',joined:dashDaysAgo(1),lastActive:dashDaysAgo(1),status:'Pending'},
 {name:'AniBayan Admin',email:'admin@example.com',role:'Administrator',joined:dashDaysAgo(47),lastActive:dashToday,status:'Active'},
];
const dashboardFeedback:DashboardFeedback[]=[
 {id:'FB-118',organization:'Guimaras Mango Farmers',customer:'Alex Reyes',rating:5,comment:'Sweet, ripe mangoes and very well packed.',date:dashDaysAgo(1),order:'AB-2026-1045'},
 {id:'FB-117',organization:'Nueva Ecija Rice Growers',customer:'Daniel Tan',rating:5,comment:'Clean grains, exactly as described.',date:dashDaysAgo(3),order:'AB-2026-1037'},
 {id:'FB-116',organization:'Benguet Highland Growers',customer:'Isabel Cruz',rating:5,comment:'Carrots were crisp and arrived quickly.',date:dashDaysAgo(1),order:'AB-2026-1044'},
 {id:'FB-115',organization:'Benguet Highland Growers',customer:'Carlo Mendoza',rating:4,comment:'Good onions; one bag was slightly bruised.',date:dashDaysAgo(6),order:'AB-2026-1038'},
 {id:'FB-114',organization:'Benguet Highland Growers',customer:'Isabel Cruz',rating:5,comment:'Sweet potatoes were fresh and well sorted.',date:dashDaysAgo(6),order:'AB-2026-1039'},
 {id:'FB-113',organization:'Nueva Ecija Rice Growers',customer:'Isabel Cruz',rating:4,comment:'Good rice. Delivery took one day longer than expected.',date:dashDaysAgo(15),order:'AB-2026-1030'},
 {id:'FB-112',organization:'Guimaras Mango Farmers',customer:'Daniel Tan',rating:3,comment:'Tasty, but a few mangoes were overripe.',date:dashDaysAgo(11),order:'AB-2026-1032'},
 {id:'FB-111',organization:'Benguet Highland Growers',customer:'Maria Santos',rating:5,comment:'Carrots were fresh and the order was well packed.',date:dashDaysAgo(8),order:'AB-2026-1036'},
 {id:'FB-110',organization:'Guimaras Mango Farmers',customer:'Isabel Cruz',rating:4,comment:'Lovely fruit; the order was confirmed late.',date:dashDaysAgo(9),order:'AB-2026-1035'},
 {id:'FB-109',organization:'Nueva Ecija Rice Growers',customer:'Carlo Mendoza',rating:5,comment:'Will order again.',date:dashDaysAgo(11),order:'AB-2026-1033'},
 {id:'FB-108',organization:'Benguet Highland Growers',customer:'Daniel Tan',rating:4,comment:'Fresh vegetables, fair prices.',date:dashDaysAgo(19),order:'AB-2026-1027'},
 {id:'FB-107',organization:'Guimaras Mango Farmers',customer:'Maria Santos',rating:2,comment:'Received fewer kilos than ordered.',date:dashDaysAgo(17),order:'AB-2026-1028'},
];
const dashboardReports:DashboardReport[]=[
 {id:'RP-031',organization:'Guimaras Mango Farmers',customer:'Maria Santos',reason:'Short or wrong quantity',details:'The order weighed 3.4 kg instead of the 4 kg I paid for.',date:dashDaysAgo(17),status:'Upheld',order:'AB-2026-1028',decided:dashDaysAgo(16)},
 {id:'RP-032',organization:'Guimaras Mango Farmers',customer:'Daniel Tan',reason:'Poor quality or spoiled',details:'Several mangoes were overripe and bruised on arrival.',date:dashDaysAgo(11),status:'Open',order:'AB-2026-1032'},
 {id:'RP-033',organization:'Benguet Highland Growers',customer:'Carlo Mendoza',reason:'Late or no fulfillment',details:'The organization took more than two days to confirm my order.',date:dashDaysAgo(6),status:'Dismissed',order:'AB-2026-1038',decided:dashDaysAgo(5)},
];
const dashboardWarnings:DashboardWarning[]=[];
// Activity log: [minutes ago, actor, type, detail, target]
const dashMinutesAgo=(minutes:number)=>new Date(dashTodayDate.getTime()-minutes*60000).toISOString();
const dashboardActivity:DashboardActivity[]=([
 [23,'admin@anibayan.ph','signin-failed','No account with this email'],
 [24,'admin@anibayan.ph','signin-failed','No account with this email'],
 [24,'admin@anibayan.ph','signin-failed','No account with this email'],
 [26,'admin@anibayan.ph','signin-failed','No account with this email'],
 [40,'jessa@example.com','signin-blocked','Account suspended'],
 [41,'jessa@example.com','signin-blocked','Account suspended'],
 [43,'jessa@example.com','signin-blocked','Account suspended'],
 [50,'ramon@example.com','order-updated','#1048 → Processing'],
 [55,'ramon@example.com','signin',''],
 [67,'alex@example.com','order-paid','#1048 · ₱485'],
 [68,'alex@example.com','order-placed','#1048 · ₱485 · Benguet Highland Growers'],
 [72,'alex@example.com','signin',''],
 [170,'maria@example.com','order-placed','#1047 · ₱650 · Guimaras Mango Farmers'],
 [175,'maria@example.com','password-changed',''],
 [178,'maria@example.com','signin',''],
 [180,'maria@example.com','signin-failed','Wrong password'],
 [182,'maria@example.com','signin-failed','Wrong password'],
 [1500,'edna@example.com','register','Organization application · Quezon Coconut Farmers Association'],
 [2910,'joel@example.com','register','Organization application · Laguna Harvest Collective'],
 [3080,'ramon@example.com','price-changed','Fresh carrots · ₱65 → ₱70 /kg'],
 [7395,'admin@example.com','report-dismissed','RP-033 · Benguet Highland Growers'],
 [7500,'daniel@example.com','order-cancelled','#1042'],
 [16110,'daniel@example.com','report-filed','RP-032 · Guimaras Mango Farmers'],
 [18990,'admin@example.com','application-declined','Tarlac Vegetable Growers'],
 [23275,'admin@example.com','report-upheld','RP-031 · Guimaras Mango Farmers'],
 [24610,'maria@example.com','report-filed','RP-031 · Guimaras Mango Farmers'],
 [36260,'admin@example.com','account-suspended','Jessa Bautista','jessa@example.com'],
] as [number,string,string,string,string?][]).map(([minutes,actor,type,detail,target])=>target?{time:dashMinutesAgo(minutes),actor,type,detail,target}:{time:dashMinutesAgo(minutes),actor,type,detail});
const dashboardMembers:DashboardMember[]=[
 {id:'MB-001',organization:'Benguet Highland Growers',name:'Ramon Dulnuan',place:'La Trinidad',crops:'Carrots, cabbage',area:1.2,joined:'2021',status:'Active'},
 {id:'MB-002',organization:'Benguet Highland Growers',name:'Josefa Baniwas',place:'Atok',crops:'Potatoes, carrots',area:0.8,joined:'2021',status:'Active'},
 {id:'MB-003',organization:'Benguet Highland Growers',name:'Marlon Pocding',place:'Buguias',crops:'Onions, tomatoes',area:1.5,joined:'2022',status:'Active'},
 {id:'MB-004',organization:'Benguet Highland Growers',name:'Teresita Lumbag',place:'Kibungan',crops:'Sweet potatoes',area:0.6,joined:'2023',status:'Active'},
 {id:'MB-005',organization:'Benguet Highland Growers',name:'Norma Calatan',place:'La Trinidad',crops:'Lettuce, carrots',area:0.7,joined:'2024',status:'Active'},
 {id:'MB-006',organization:'Benguet Highland Growers',name:'Alfredo Sagayo',place:'Tublay',crops:'Eggplants, tomatoes',area:0.9,joined:'2026',status:'Pending'},
 {id:'MB-007',organization:'Guimaras Mango Farmers',name:'Lorna Gallego',place:'Jordan',crops:'Carabao mangoes',area:2.1,joined:'2020',status:'Active'},
 {id:'MB-008',organization:'Guimaras Mango Farmers',name:'Rodel Gabasa',place:'Buenavista',crops:'Mangoes, bananas',area:1.4,joined:'2022',status:'Active'},
 {id:'MB-009',organization:'Nueva Ecija Rice Growers',name:'Felipe Dizon',place:'Science City of Muñoz',crops:'Rice',area:3.5,joined:'2019',status:'Active'},
 {id:'MB-010',organization:'Nueva Ecija Rice Growers',name:'Celia Manalo',place:'Guimba',crops:'Rice, corn',area:2.8,joined:'2021',status:'Active'},
];
// Saved harvests and shopping carts, keyed by buyer email.
const dashboardSaved:Record<string,string[]>={'alex@example.com':['CROP-001','CROP-002','CROP-003']};
const dashboardCarts:Record<string,DashboardCartLine[]>={};
// Results of the admin site-health checks, oldest first; the newest 30 runs are kept.
const dashboardHealthLog:DashboardHealthRun[]=[];
const dashRegions=['Ilocos Region','Cagayan Valley','Central Luzon','Calabarzon','Mimaropa','Bicol Region','Western Visayas','Central Visayas','Eastern Visayas','Zamboanga Peninsula','Northern Mindanao','Davao Region','Soccsksargen','Caraga','Bangsamoro','Cordillera','National Capital Region'];
