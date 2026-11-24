# Asset credits

- `assets/rice-field.mp4`: actual rice-field footage by **Panya Niyomtham**, from [Lush Green Rice Field Swaying in the Wind on Pexels](https://www.pexels.com/video/lush-green-rice-field-swaying-in-the-wind-34182477/), offered under the [Pexels license](https://www.pexels.com/license/). Locally transcoded for web playback. This is illustrative stock footage, not a verified AniBayan cooperative location or a claim that the clip was shot in the Philippines. Original source metadata is retained in `assets/video-source.json`.
- `assets/rice-hero.png`, `assets/field-detail.jpg`, `assets/grower.png`, and the rice/mango/onion/carrot photographs: original generated assets from the rebuilt AniBayan SVG direction. The JPGs are individual crop extractions from the original 1536×1024 photographic asset sheet. These are illustrative concept images, not verified people or live inventory.
- `assets/sweet-potatoes.jpg`: existing repository stock image by Anthony Camp. [Original source](https://unsplash.com/photos/iyY6U6TAXoM). Original image credits remain in `PHOTO-CREDITS.md`.
- `assets/satellite.jpg`: [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Attribution: Esri, Vantor, Earthstar Geographics and the GIS User Community. The same attribution is displayed on the map.
- `assets/boundary.svg` and `assets/philippines.svg`: geographic outlines from [Philippines JSON Maps](https://github.com/faeldon/philippines-json-maps), extracted from the supplied rebuilt SVG. The outlined area is the **Science City of Muñoz municipal boundary**, PSGC 304917000; it is not a fabricated cooperative property boundary. See the bundled map-data license.
- The Muñoz anchor uses 120.90° E, 15.71° N, from the [city government's location page](https://sciencecityofmunoz.gov.ph/government/location/). Imagery and the boundary share the original Web Mercator export extent.
- Plus Jakarta Sans: bundled local font files, with the [SIL Open Font License](https://github.com/google/fonts/tree/main/ofl/plusjakartasans) retained in `assets/OFL-Plus-Jakarta-Sans.txt`.

The source design is `C:/Users/PC/Desktop/anibayan-figma/mockups/01-home-rebuilt.svg`. No Dribbble shot or reference-video UI is embedded as the page.

## New homepage reference pass

- `assets/soil-story.png`: original generated editorial farming image of hands, soil and a seedling. Illustrative photography, not a verified AniBayan farmer portrait or a certification claim.
- `assets/rice-foliage.png`: original generated transparent rice-leaf and panicle asset used as decorative section framing.
- `assets/philippines-home.svg`: geographic outline derived from the previously credited Philippines JSON Maps asset. Its markers are editable HTML buttons positioned with the same longitude/latitude transform. They show approximate sample regions, not cooperative parcel boundaries.
- `assets/calapan-home.svg` (the homepage map since AniBayan was limited to Calapan City): the 62 barangays of Calapan City, Oriental Mindoro, from [Philippines JSON Maps](https://github.com/faeldon/philippines-json-maps) `latest/geojson/municities/medres/bgysubmuns-municity-1705205000.0.01.json` (PSGC 2026-3q), drawn as SVG paths. Map pins sit at the centre of each sample community's barangay; they are not farm locations.
- New composition references are the two Freshvegetables and Lampung Gardening images attached by the owner in this conversation. Their artwork is not embedded in the website.

## Stronger reference composition

- `assets/broad-leaves.png`, `assets/mango-cutout.png`, `assets/vegetable-cutout.png`: generated with the built-in image generation tool, with alpha transparency preserved. Decorative illustrative assets, not photographs of actual inventory. Prompts are retained in `assets/GENERATED-ASSETS.md`.
- `assets/tomatoes.jpg`, `assets/bananas.jpg`, `assets/eggplant.jpg`: copied from the repository's existing stock photography. Original photographer and source credits remain in `PHOTO-CREDITS.md`.

- `assets/mango-branch.png`: original generated transparent botanical branch, used to connect the editorial sections visually.
- `assets/seedlings-story.png`: original generated photograph of seedlings and tending hands. Illustrative farming photography, not a verified farm or person. Both assets were created with the built-in image generation tool; full prompts are in `assets/GENERATED-ASSETS.md`.

- `assets/anibayan-logo.png`: the AniBayan logo supplied by the team, with its cream background made transparent and scaled to 300 px, for the Excel and PDF exports.
- `assets/calapan-barangays.json`: the 62 barangay outlines of Calapan City (PSGC 1705205000) from [Philippines JSON Maps](https://github.com/faeldon/philippines-json-maps), the same source as `calapan-home.svg`; used to find which barangay a delivery pin is in.
- `assets/calapan-streets.json`: named streets and places in Calapan City from © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL), taken through the Overpass API on 2026-11-24; used to name the street or landmark at a delivery pin.
- Map tiles: © OpenStreetMap contributors, shown with [Leaflet](https://leafletjs.com/) 1.9.4. Exports use [jsPDF](https://github.com/parallax/jsPDF) 2.5.2 with jspdf-autotable 3.8.4, and [ExcelJS](https://github.com/exceljs/exceljs) 4.4.0 (all MIT licensed), loaded from unpkg with integrity hashes.
