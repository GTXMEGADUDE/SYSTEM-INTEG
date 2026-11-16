interface PreviewGrower {
  id:string;
  name:string;
  region:string;
  cropLabel:string;
  photo:string;
  art:string;
  artAlt:string;
  photoAlt:string;
  landscape:string;
  storyTitle:string;
  story:string;
  longitude:number;
  latitude:number;
}
// Illustrative homepage communities, separate from the live marketplace data.
const previewGrowers:PreviewGrower[]=[
  {
    id:'nueva-ecija',name:'Nueva Ecija Rice Growers Cooperative',region:'Nueva Ecija',
    art:'rice-foliage.png',artAlt:'Rice stalks with golden grain',cropLabel:'Rice & grains',photo:'rice-hero.png',photoAlt:'Illustrative rice-field scene',
    landscape:'Central Luzon',storyTitle:'Rooted in rice-growing country.',
    story:'Get to know the communities behind a familiar part of the Filipino table. Discover the people and organizations connecting a local rice harvest with everyday meals.',
    longitude:120.90,latitude:15.71,
  },
  {
    id:'guimaras',name:'Guimaras Mango Farmers Association',region:'Guimaras',
    art:'mango-cutout.png',artAlt:'Golden mangoes with fresh green leaves',cropLabel:'Mangoes & fruits',photo:'mango.jpg',photoAlt:'Illustrative golden carabao mangoes',
    landscape:'Island harvests',storyTitle:'An island chapter in every harvest.',
    story:'Discover mango harvests and the organizations behind them. Guimaras brings a different landscape—and a little island sunshine—to the story of local food.',
    longitude:122.60,latitude:10.60,
  },
  {
    id:'benguet',name:'Benguet Highland Vegetable Growers',region:'Benguet',
    art:'vegetable-cutout.png',artAlt:'A woven basket of fresh vegetables',cropLabel:'Highland vegetables',photo:'grower.png',photoAlt:'Illustrative vegetable grower in a highland landscape',
    landscape:'Highland communities',storyTitle:'Good things grow in the highlands.',
    story:'Meet the growing communities behind familiar vegetables and explore a landscape of terraces and cooler mornings. Every harvest carries a connection to the place it comes from.',
    longitude:120.80,latitude:16.50,
  },
];
