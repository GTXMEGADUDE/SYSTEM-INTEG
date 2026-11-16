// Fictional data for the three standalone dashboard previews (admin, organization, consumer). Never used by the app.
interface DashboardPeriod { label:string; value:number; orders:number; labels:string[]; values:number[]; orderValues:number[]; valueScale:number; orderScale:number }
interface DashboardOrder { id:string; customer:string; organization:string; crop:string; image:string; quantity:string; total:number; date:string; status:string; payment:string }
// harvested: date the crop was harvested (required on every new listing). shelfLife: days the produce keeps well after harvest.
interface DashboardCrop { id:string; name:string; organization:string; image:string; price:number; unit:string; category:string; stock:number; status:string; harvested:string; shelfLife:number }
// status: 'Active' (approved and selling), 'Pending review' (application waiting for an administrator) or 'Declined'.
interface DashboardOrganization { name:string; region:string; crop:string; image:string; listings:number; status:string; representative:string; applied:string; members:number; documents:string[] }
interface DashboardAccount { name:string; email:string; role:string; organization?:string; joined:string; lastActive:string; status:string; note?:string }
// Buyer feedback (1–5 stars) and buyer reports feed each organization's credit score.
interface DashboardFeedback { id:string; organization:string; customer:string; rating:number; comment:string; date:string; order?:string }
// status: 'Open' (waiting for an administrator), 'Upheld' (lowers the credit score) or 'Dismissed'.
interface DashboardReport { id:string; organization:string; customer:string; reason:string; details:string; date:string; status:string; order?:string }
interface DashboardService { name:string; detail:string; status:string; latency:string; uptime:string }
interface DashboardIncident { date:string; title:string; detail:string; status:string }
// The fixed "today" of the preview data; harvest age, freshness and "new this week" are measured from this date.
const dashToday='2026-11-08';
const dashboardOrders:DashboardOrder[]=[
 {id:'AB-2026-1048',customer:'Alex Reyes',organization:'Benguet Highland Growers',crop:'Highland vegetable basket',image:'vegetable-cutout.png',quantity:'3 items',total:485,date:'2026-11-08',status:'Processing',payment:'Paid'},
 {id:'AB-2026-1047',customer:'Maria Santos',organization:'Guimaras Mango Farmers',crop:'Carabao mangoes',image:'mango.jpg',quantity:'5 kg',total:650,date:'2026-11-08',status:'Pending',payment:'Unpaid'},
 {id:'AB-2026-1046',customer:'Carlo Mendoza',organization:'Nueva Ecija Rice Growers',crop:'Dinorado rice',image:'rice.jpg',quantity:'25 kg',total:1450,date:'2026-11-07',status:'Confirmed',payment:'Paid'},
 {id:'AB-2026-1045',customer:'Alex Reyes',organization:'Guimaras Mango Farmers',crop:'Carabao mangoes',image:'mango.jpg',quantity:'2 kg',total:260,date:'2026-11-06',status:'Completed',payment:'Paid'},
 {id:'AB-2026-1044',customer:'Isabel Cruz',organization:'Benguet Highland Growers',crop:'Fresh carrots',image:'carrot.jpg',quantity:'4 kg',total:280,date:'2026-11-06',status:'Completed',payment:'Paid'},
 {id:'AB-2026-1043',customer:'Alex Reyes',organization:'Nueva Ecija Rice Growers',crop:'Dinorado rice',image:'rice.jpg',quantity:'10 kg',total:580,date:'2026-11-04',status:'Completed',payment:'Paid'},
 {id:'AB-2026-1042',customer:'Daniel Tan',organization:'Benguet Highland Growers',crop:'Red onions',image:'onion.jpg',quantity:'2 kg',total:180,date:'2026-11-03',status:'Cancelled',payment:'Unpaid'},
 {id:'AB-2026-1041',customer:'Alex Reyes',organization:'Benguet Highland Growers',crop:'Fresh carrots',image:'carrot.jpg',quantity:'2 kg',total:140,date:'2026-11-02',status:'Pending',payment:'Unpaid'},
 {id:'AB-2026-1040',customer:'Maria Santos',organization:'Benguet Highland Growers',crop:'Vine-ripened tomatoes',image:'tomatoes.jpg',quantity:'6 kg',total:480,date:'2026-11-02',status:'Confirmed',payment:'Paid'},
 {id:'AB-2026-1039',customer:'Isabel Cruz',organization:'Benguet Highland Growers',crop:'Sweet potatoes',image:'sweet-potatoes.jpg',quantity:'8 kg',total:360,date:'2026-11-01',status:'Completed',payment:'Paid'},
 {id:'AB-2026-1038',customer:'Carlo Mendoza',organization:'Benguet Highland Growers',crop:'Red onions',image:'onion.jpg',quantity:'5 kg',total:450,date:'2026-11-01',status:'Completed',payment:'Paid'},
];
const dashboardCrops:DashboardCrop[]=[
 {id:'CROP-001',name:'Carabao mangoes',organization:'Guimaras Mango Farmers',image:'mango.jpg',price:130,unit:'kg',category:'Fruits',stock:180,status:'Active',harvested:'2026-11-05',shelfLife:7},
 {id:'CROP-002',name:'Fresh carrots',organization:'Benguet Highland Growers',image:'carrot.jpg',price:70,unit:'kg',category:'Vegetables',stock:96,status:'Active',harvested:'2026-11-06',shelfLife:21},
 {id:'CROP-003',name:'Dinorado rice',organization:'Nueva Ecija Rice Growers',image:'rice.jpg',price:58,unit:'kg',category:'Rice & grains',stock:850,status:'Active',harvested:'2026-10-20',shelfLife:180},
 {id:'CROP-004',name:'Red onions',organization:'Benguet Highland Growers',image:'onion.jpg',price:90,unit:'kg',category:'Vegetables',stock:45,status:'Active',harvested:'2026-10-28',shelfLife:30},
 {id:'CROP-005',name:'Purple eggplants',organization:'Benguet Highland Growers',image:'eggplant.jpg',price:65,unit:'kg',category:'Vegetables',stock:0,status:'Unavailable',harvested:'2026-10-30',shelfLife:7},
 {id:'CROP-006',name:'Golden bananas',organization:'Guimaras Mango Farmers',image:'bananas.jpg',price:55,unit:'kg',category:'Fruits',stock:74,status:'Active',harvested:'2026-11-04',shelfLife:6},
 {id:'CROP-007',name:'Vine-ripened tomatoes',organization:'Benguet Highland Growers',image:'tomatoes.jpg',price:80,unit:'kg',category:'Vegetables',stock:132,status:'Active',harvested:'2026-11-07',shelfLife:7},
 {id:'CROP-008',name:'Sweet potatoes',organization:'Benguet Highland Growers',image:'sweet-potatoes.jpg',price:45,unit:'kg',category:'Vegetables',stock:28,status:'Active',harvested:'2026-10-25',shelfLife:28},
];
const dashboardOrganizations:DashboardOrganization[]=[
 {name:'Benguet Highland Growers',region:'Benguet, Cordillera',crop:'Highland vegetables',image:'grower.png',listings:18,status:'Active',representative:'Ramon Dulnuan',applied:'2026-10-09',members:6,documents:['CDA registration','Barangay endorsement','Representative ID']},
 {name:'Guimaras Mango Farmers',region:'Guimaras, Western Visayas',crop:'Mangoes & fruits',image:'mango.jpg',listings:12,status:'Active',representative:'Carlo Mendoza',applied:'2026-10-06',members:14,documents:['CDA registration','Barangay endorsement','Representative ID']},
 {name:'Nueva Ecija Rice Growers',region:'Nueva Ecija, Central Luzon',crop:'Rice & grains',image:'rice-hero.png',listings:24,status:'Active',representative:'Teodoro Pascual',applied:'2026-10-02',members:31,documents:['CDA registration','Barangay endorsement','Representative ID']},
 {name:'Laguna Harvest Collective',region:'Laguna, Calabarzon',crop:'Vegetables & roots',image:'soil-story.png',listings:0,status:'Pending review',representative:'Joel Malabanan',applied:'2026-11-06',members:9,documents:['CDA registration','Barangay endorsement']},
 {name:'Quezon Coconut Farmers Association',region:'Quezon, Calabarzon',crop:'Coconuts & root crops',image:'seedlings-story.png',listings:0,status:'Pending review',representative:'Edna Villareal',applied:'2026-11-07',members:22,documents:['SEC registration','Barangay endorsement','Representative ID']},
 {name:'Tarlac Vegetable Growers',region:'Tarlac, Central Luzon',crop:'Lowland vegetables',image:'field-detail.jpg',listings:0,status:'Declined',representative:'Ben Soriano',applied:'2026-10-24',members:4,documents:['Representative ID']},
];
const dashboardAccounts:DashboardAccount[]=[
 {name:'Alex Reyes',email:'alex@example.com',role:'Consumer',joined:'2026-10-03',lastActive:'2026-11-08',status:'Active'},
 {name:'Maria Santos',email:'maria@example.com',role:'Consumer',joined:'2026-10-05',lastActive:'2026-11-08',status:'Active'},
 {name:'Isabel Cruz',email:'isabel@example.com',role:'Consumer',joined:'2026-10-07',lastActive:'2026-11-07',status:'Active'},
 {name:'Daniel Tan',email:'daniel@example.com',role:'Consumer',joined:'2026-10-12',lastActive:'2026-11-03',status:'Active'},
 {name:'Jessa Bautista',email:'jessa@example.com',role:'Consumer',joined:'2026-10-20',lastActive:'2026-10-22',status:'Suspended',note:'Suspended Oct 22, 2026 after repeated abusive messages to growers.'},
 {name:'Ramon Dulnuan',email:'ramon@example.com',role:'Representative',organization:'Benguet Highland Growers',joined:'2026-10-09',lastActive:'2026-11-08',status:'Active'},
 {name:'Carlo Mendoza',email:'carlo@example.com',role:'Representative',organization:'Guimaras Mango Farmers',joined:'2026-10-06',lastActive:'2026-11-07',status:'Active'},
 {name:'Teodoro Pascual',email:'teodoro@example.com',role:'Representative',organization:'Nueva Ecija Rice Growers',joined:'2026-10-02',lastActive:'2026-11-06',status:'Active'},
 {name:'Joel Malabanan',email:'joel@example.com',role:'Representative',organization:'Laguna Harvest Collective',joined:'2026-11-06',lastActive:'2026-11-06',status:'Pending'},
 {name:'Edna Villareal',email:'edna@example.com',role:'Representative',organization:'Quezon Coconut Farmers Association',joined:'2026-11-07',lastActive:'2026-11-07',status:'Pending'},
 {name:'AniBayan Admin',email:'admin@example.com',role:'Administrator',joined:'2026-10-01',lastActive:'2026-11-08',status:'Active'},
];
const dashboardFeedback:DashboardFeedback[]=[
 {id:'FB-118',organization:'Guimaras Mango Farmers',customer:'Alex Reyes',rating:5,comment:'Sweet, ripe mangoes and very well packed.',date:'2026-11-07',order:'AB-2026-1045'},
 {id:'FB-117',organization:'Nueva Ecija Rice Growers',customer:'Daniel Tan',rating:5,comment:'Clean grains, exactly as described.',date:'2026-11-05'},
 {id:'FB-116',organization:'Benguet Highland Growers',customer:'Isabel Cruz',rating:5,comment:'Carrots were crisp and arrived quickly.',date:'2026-11-07',order:'AB-2026-1044'},
 {id:'FB-115',organization:'Benguet Highland Growers',customer:'Carlo Mendoza',rating:4,comment:'Good onions; one bag was slightly bruised.',date:'2026-11-02',order:'AB-2026-1038'},
 {id:'FB-114',organization:'Benguet Highland Growers',customer:'Isabel Cruz',rating:5,comment:'Sweet potatoes were fresh and well sorted.',date:'2026-11-02',order:'AB-2026-1039'},
 {id:'FB-113',organization:'Nueva Ecija Rice Growers',customer:'Maria Santos',rating:4,comment:'Good rice. Delivery took one day longer than expected.',date:'2026-10-30'},
 {id:'FB-112',organization:'Guimaras Mango Farmers',customer:'Daniel Tan',rating:3,comment:'Tasty, but a few mangoes were overripe.',date:'2026-10-28'},
 {id:'FB-111',organization:'Benguet Highland Growers',customer:'Maria Santos',rating:5,comment:'Tomatoes were vine-ripe as promised.',date:'2026-10-26'},
 {id:'FB-110',organization:'Guimaras Mango Farmers',customer:'Isabel Cruz',rating:4,comment:'Lovely fruit; the order was confirmed late.',date:'2026-10-21'},
 {id:'FB-109',organization:'Nueva Ecija Rice Growers',customer:'Carlo Mendoza',rating:5,comment:'Will order again.',date:'2026-10-18'},
 {id:'FB-108',organization:'Benguet Highland Growers',customer:'Daniel Tan',rating:4,comment:'Fresh vegetables, fair prices.',date:'2026-10-15'},
 {id:'FB-107',organization:'Guimaras Mango Farmers',customer:'Maria Santos',rating:2,comment:'Received fewer kilos than ordered.',date:'2026-10-11'},
];
const dashboardReports:DashboardReport[]=[
 {id:'RP-031',organization:'Guimaras Mango Farmers',customer:'Maria Santos',reason:'Short or wrong quantity',details:'The order weighed 4.2 kg instead of the 5 kg I paid for.',date:'2026-10-11',status:'Upheld'},
 {id:'RP-032',organization:'Guimaras Mango Farmers',customer:'Daniel Tan',reason:'Poor quality or spoiled',details:'Several mangoes were overripe and bruised on arrival.',date:'2026-10-28',status:'Open'},
 {id:'RP-033',organization:'Benguet Highland Growers',customer:'Carlo Mendoza',reason:'Late or no fulfillment',details:'The organization took more than two days to confirm my order.',date:'2026-11-01',status:'Dismissed',order:'AB-2026-1038'},
];
// Site health for the admin preview: the last 7 days from a (fictional) uptime monitor.
const dashboardHealth={
 checked:'Nov 08, 2026 · 9:42 AM',uptime:'99.94%',uptimeNote:'Last 30 days · 26 min of downtime',errorRate:'0.08%',
 labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],responseTimes:[198,205,187,236,412,224,212],errorCounts:[3,2,1,4,19,5,2],
};
const dashboardServices:DashboardService[]=[
 {name:'Web application',detail:'Pages and dashboards',status:'Operational',latency:'184 ms',uptime:'99.98%'},
 {name:'Database',detail:'Accounts, listings and orders',status:'Operational',latency:'12 ms',uptime:'100%'},
 {name:'Authentication',detail:'Sign-in and sessions',status:'Operational',latency:'96 ms',uptime:'99.99%'},
 {name:'File storage',detail:'Product and organization photos',status:'Operational',latency:'143 ms',uptime:'99.95%'},
 {name:'PayMongo payments',detail:'Payment confirmations (webhooks)',status:'Degraded',latency:'1.8 s',uptime:'99.71%'},
 {name:'Tawk.to live chat',detail:'Customer support widget',status:'Operational',latency:'',uptime:'99.90%'},
 {name:'Email notifications',detail:'Order and account emails',status:'Operational',latency:'',uptime:'99.96%'},
];
const dashboardIncidents:DashboardIncident[]=[
 {date:'2026-11-08',title:'Slow payment confirmations',detail:'PayMongo webhooks are arriving up to 3 minutes late. Affected orders stay Unpaid until the confirmation arrives.',status:'Monitoring'},
 {date:'2026-11-06',title:'Error spike during photo uploads',detail:'Uploads larger than 5 MB failed for 22 minutes on Friday. The size limit is now checked before upload, and uploads recovered.',status:'Resolved'},
 {date:'2026-10-29',title:'Scheduled database maintenance',detail:'Planned 20-minute maintenance window. Dashboards were read-only during the update.',status:'Resolved'},
];
// Organization dashboard preview: the signed-in representative's organization and its members.
const dashboardOrgProfile={name:'Benguet Highland Growers',region:'Benguet, Cordillera',crops:'Highland vegetables',representative:'Ramon Dulnuan',email:'ramon@example.com',verified:'Verified by AniBayan · Oct 14, 2026'};
const dashboardMembers=[
 {name:'Ramon Dulnuan',place:'La Trinidad',crops:'Carrots, cabbage',area:1.2,joined:'2021',status:'Active'},
 {name:'Josefa Baniwas',place:'Atok',crops:'Potatoes, carrots',area:0.8,joined:'2021',status:'Active'},
 {name:'Marlon Pocding',place:'Buguias',crops:'Onions, tomatoes',area:1.5,joined:'2022',status:'Active'},
 {name:'Teresita Lumbag',place:'Kibungan',crops:'Sweet potatoes',area:0.6,joined:'2023',status:'Active'},
 {name:'Norma Calatan',place:'La Trinidad',crops:'Lettuce, carrots',area:0.7,joined:'2024',status:'Active'},
 {name:'Alfredo Sagayo',place:'Tublay',crops:'Eggplants, tomatoes',area:0.9,joined:'2026',status:'Pending'},
];
const dashboardOrgPeriods={
 week:{label:'Nov 02 – Nov 08, 2026',value:28450,orders:34,labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],values:[3.2,4.6,3.1,5.4,4.2,4.9,3.05],orderValues:[4,5,4,7,5,6,3],valueScale:8,orderScale:8},
 month:{label:'Nov 01 – Nov 30, 2026',value:109800,orders:131,labels:['Week 1','Week 2','Week 3','Week 4'],values:[22.4,29.1,26.3,32],orderValues:[27,35,31,38],valueScale:40,orderScale:40},
};
