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
// Homepage community stories, separate from the live marketplace data. Every community is in Calapan City;
// longitude/latitude is the centre of its barangay (Philippines JSON Maps), where its map pin goes.
const previewGrowers:PreviewGrower[]=[
  {
    id:'bucayao',name:'Bucayao Rice Farmers',region:'Bucayao',
    art:'rice-foliage.png',artAlt:'Rice stalks with golden grain',cropLabel:'Rice & grains',photo:'rice-hero.png',photoAlt:'A rice-field scene',
    landscape:'Rice fields',storyTitle:'Rooted in rice-growing country.',
    story:'Get to know the families behind a familiar part of the Filipino table. Bucayao’s rice fields connect a local harvest with everyday meals across Calapan.',
    longitude:121.1868,latitude:13.3079,
  },
  {
    id:'managpi',name:'Managpi Fruit Growers',region:'Managpi',
    art:'mango-cutout.png',artAlt:'Golden mangoes with fresh green leaves',cropLabel:'Mangoes & fruits',photo:'mango.jpg',photoAlt:'Golden carabao mangoes',
    landscape:'Island harvests',storyTitle:'An island chapter in every harvest.',
    story:'Discover the mango and banana harvests of Managpi and the growers behind them—a little Mindoro sunshine in the story of local food.',
    longitude:121.2005,latitude:13.3269,
  },
  {
    id:'canubing',name:'Canubing Vegetable Growers',region:'Canubing I',
    art:'vegetable-cutout.png',artAlt:'A woven basket of fresh vegetables',cropLabel:'Vegetables & root crops',photo:'grower.png',photoAlt:'A vegetable grower at work',
    landscape:'Vegetable gardens',storyTitle:'Good things grow close to home.',
    story:'Meet the growers behind familiar vegetables, from fields a short trip from the city centre. Every harvest carries a connection to the barangay it comes from.',
    longitude:121.1346,latitude:13.3600,
  },
];
// The edges of assets/calapan-home.svg, so a pin's longitude/latitude becomes a position on the map.
const previewMapEdges={west:121.0966,east:121.293,north:13.4388,south:13.2935};
