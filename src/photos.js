/*
  The photos in the pile on the homepage.

  To add photos (up to ~20), drop the files in public/img/photos/ (a full size, an "-md"
  800px copy and a "-sm" 480px thumbnail, like the existing ones) and add a line here.
  `place` is optional.
*/
export const PHOTOS = [
  { file: 'photo-01', w: 1200, h: 1600, place: 'New York', alt: 'A big yellow tree in a park in autumn' },
  { file: 'photo-03', w: 1600, h: 1070, place: 'Agra, India', alt: 'The Taj Mahal at dusk with the moon up' },
  { file: 'photo-02', w: 1069, h: 1600, place: 'Guatapé, Colombia', alt: 'A french bulldog sitting in front of a striped door' },
  { file: 'photo-05', w: 1600, h: 1070, place: 'Ranthambore, India', alt: 'A deer on a dirt road in the woods' },
  { file: 'photo-04', w: 1070, h: 1600, place: 'Agra, India', alt: 'A minaret at dusk' },
  { file: 'photo-06', w: 1600, h: 1070, place: 'Sleepy Hollow, New York', alt: 'A country lane with one tree and a fence' },
  { file: 'photo-07', w: 1200, h: 1600, place: 'Arashiyama, Japan', alt: 'Looking straight up in a bamboo forest' },
];
export const DIR = '/img/photos/';

/* thumbnails for the pile; the lightbox loads the full size */
export const srcset = (p) => `${DIR}${p.file}-sm.webp 480w, ${DIR}${p.file}-md.webp 800w, ${DIR}${p.file}.webp 1600w`;
export const label = (p) => `Open photo: ${p.alt}${p.place ? `, ${p.place}` : ''}`;
