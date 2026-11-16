// Fictional data for the three standalone dashboard previews (admin, organization, consumer). Never used by the app.
interface DashboardPeriod { label:string; value:number; orders:number; labels:string[]; values:number[]; orderValues:number[]; valueScale:number; orderScale:number }
interface DashboardOrder { id:string; customer:string; organization:string; crop:string; image:string; quantity:string; total:number; date:string; status:string; payment:string }
interface DashboardCrop { id:string; name:string; organization:string; image:string; price:number; unit:string; category:string; stock:number; status:string }
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
 {id:'CROP-001',name:'Carabao mangoes',organization:'Guimaras Mango Farmers',image:'mango.jpg',price:130,unit:'kg',category:'Fruits',stock:180,status:'Active'},
 {id:'CROP-002',name:'Fresh carrots',organization:'Benguet Highland Growers',image:'carrot.jpg',price:70,unit:'kg',category:'Vegetables',stock:96,status:'Active'},
 {id:'CROP-003',name:'Dinorado rice',organization:'Nueva Ecija Rice Growers',image:'rice.jpg',price:58,unit:'kg',category:'Rice & grains',stock:850,status:'Active'},
 {id:'CROP-004',name:'Red onions',organization:'Benguet Highland Growers',image:'onion.jpg',price:90,unit:'kg',category:'Vegetables',stock:45,status:'Active'},
 {id:'CROP-005',name:'Purple eggplants',organization:'Benguet Highland Growers',image:'eggplant.jpg',price:65,unit:'kg',category:'Vegetables',stock:0,status:'Unavailable'},
 {id:'CROP-006',name:'Golden bananas',organization:'Guimaras Mango Farmers',image:'bananas.jpg',price:55,unit:'kg',category:'Fruits',stock:74,status:'Active'},
 {id:'CROP-007',name:'Vine-ripened tomatoes',organization:'Benguet Highland Growers',image:'tomatoes.jpg',price:80,unit:'kg',category:'Vegetables',stock:132,status:'Active'},
 {id:'CROP-008',name:'Sweet potatoes',organization:'Benguet Highland Growers',image:'sweet-potatoes.jpg',price:45,unit:'kg',category:'Vegetables',stock:28,status:'Active'},
];
const dashboardOrganizations=[
 {name:'Benguet Highland Growers',region:'Benguet, Cordillera',crop:'Highland vegetables',image:'grower.png',listings:18,status:'Active'},
 {name:'Guimaras Mango Farmers',region:'Guimaras, Western Visayas',crop:'Mangoes & fruits',image:'mango.jpg',listings:12,status:'Active'},
 {name:'Nueva Ecija Rice Growers',region:'Nueva Ecija, Central Luzon',crop:'Rice & grains',image:'rice-hero.png',listings:24,status:'Active'},
 {name:'Laguna Harvest Collective',region:'Laguna, Calabarzon',crop:'Vegetables & roots',image:'soil-story.png',listings:0,status:'Pending review'},
];
const dashboardPeople=[
 {name:'Alex Reyes',email:'alex@example.com',role:'Consumer',joined:'Nov 08, 2026',status:'Active'},
 {name:'Maria Santos',email:'maria@example.com',role:'Consumer',joined:'Nov 07, 2026',status:'Active'},
 {name:'Carlo Mendoza',email:'carlo@example.com',role:'Representative',joined:'Nov 06, 2026',status:'Active'},
 {name:'Isabel Cruz',email:'isabel@example.com',role:'Consumer',joined:'Nov 05, 2026',status:'Active'},
 {name:'Ramon Dulnuan',email:'ramon@example.com',role:'Representative',joined:'Oct 12, 2026',status:'Active'},
 {name:'AniBayan Admin',email:'admin@example.com',role:'Administrator',joined:'Oct 01, 2026',status:'Active'},
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
const dashboardPeriods={
 week:{label:'Nov 02 – Nov 08, 2026',value:184650,orders:146,growers:36,reviews:7,labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],values:[18.2,26.8,21.45,36.7,28.3,29.9,23.3],orderValues:[14,21,17,29,22,24,19],valueScale:40,orderScale:40},
 month:{label:'Nov 01 – Nov 30, 2026',value:692480,orders:538,growers:36,reviews:12,labels:['Week 1','Week 2','Week 3','Week 4'],values:[138.48,182,165,207],orderValues:[102,141,126,169],valueScale:250,orderScale:200},
};
