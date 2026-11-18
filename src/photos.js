/*
  The photos in the pile on the homepage.

  The pictures live on files.gregskril.com, not in this repo. To add one (up to ~20), make a
  full size (1600px on the long side), an 800px copy and a 480px thumbnail as .webp, upload
  them with the files CLI (`files a.webp a-md.webp a-sm.webp`), and add a line here with the
  id from the end of each link. `place` is optional.
*/
export const PHOTOS = [
  {
    w: 1200,
    h: 1600,
    place: 'Agra, India',
    alt: 'The marble arches of the Taj Mahal in the evening light',
    full: '5a86ac86681c14cc453962074fd4ffedaf9205e0853764d3ec2877f2d72f2687',
    md: 'b7716ccd915a08bb886108de9fc4db0218f80d0199689209ac0542068dc01e68',
    sm: '0558c28ca12506a24d3d0097d8c9617335d049b20040c3b7cf553b3a0efa403e',
  },
  {
    w: 1200,
    h: 1600,
    place: 'Jaipur, India',
    alt: 'Looking down from the walls of Amber Fort over the town and hills',
    full: '46a02094250e6c2d8c39254f48044f6144b6232109740b065599138a2199ecd3',
    md: '915ce304ab349d1dc69ba288a6df30111d7cd65bb1a553cfae1f011abcfd340a',
    sm: '3d2ffe3ff3eebd470fadf9adb121797945a41dbf0e89fba7a2ff33d5c64927ee',
  },
  {
    w: 1070,
    h: 1600,
    place: 'Medellín, Colombia',
    alt: 'A painted street court with a red hoop and goal below houses on a hill',
    full: '49e8ff8448374623a943d76e82716c8db98c5d69441a7c5b36d666834fd52df4',
    md: '92fee1757f130601a7b3d563e75946f3709bb062966d713d48ecc946f0a74c70',
    sm: '28e04a9075b67274c0f722a67fae4d5c32f9911de6c22cefad9fa95af52d5b83',
  },
  {
    w: 1200,
    h: 1600,
    place: 'New York',
    alt: 'A big yellow tree in a park in autumn',
    full: '4c7ac1f7bb964d383da0c4d53afb2928a40afa91ea3ff171b3ff071a884341fa',
    md: 'b66f22d1bade3f883ff5d382d268ad7a1a5dad3e66ad0d88088b86486127ef41',
    sm: 'ebe457716fb1787526769624e41626ffb5e4add53a9a6e70c5bcee067abc2696',
  },
  {
    w: 1600,
    h: 1070,
    place: 'Agra, India',
    alt: 'The Taj Mahal at dusk with the moon up',
    full: 'e2f138858441490c47771aaffa5e7cd6a2fc64aa91f1e947cea44dce70a169af',
    md: '45b59c1108206b4c6c945d78e83951d17a55a25e1742a0e44fd4fdc01d143950',
    sm: '3982473dd1e44edf5d87cad8c7f5d03eb234aa039320fe0f40586f60beb8b796',
  },
  {
    w: 1069,
    h: 1600,
    place: 'Guatapé, Colombia',
    alt: 'A french bulldog sitting in front of a striped door',
    full: '5df425c476356d8efb6ae8da4fcc2bcd6815d52f97d34540202d39dd2723f06a',
    md: 'b60b1cb9ca6b38368c90c1aa630c23753cd1820f6b401ed4b9a782884e38193f',
    sm: '490eaa145a22f085c6480888a9e9ff5ecbbdae3b9792d968dead5a838c9fcda3',
  },
  {
    w: 1600,
    h: 1070,
    place: 'Ranthambore, India',
    alt: 'A deer on a dirt road in the woods',
    full: '6c0bbd1433f227140620d0506da93374729423453f91863c05cefe490d765cd4',
    md: '4089262df1087324fbbb0218046890ffb7e1e544b1c3adc933fb1ee4a8b79553',
    sm: 'b43a126dbbe955c4cb01439eb979b1d393f877f9979654c99e3e42c9447016e0',
  },
  {
    w: 1070,
    h: 1600,
    place: 'Agra, India',
    alt: 'A minaret at dusk',
    full: '6d758d17fb378c446ce4f0eecd7b2481d6709b2e2013cc3edb50528fb1c71317',
    md: '4022c49bb2c7b9577101958473c294d280e1e333903df41b6fe869cf843e138f',
    sm: '5cd0d47b822e5420646b4f2f50c657a148b58330bdc6fd42443d5fe524af6303',
  },
  {
    w: 1600,
    h: 1070,
    place: 'Sleepy Hollow, New York',
    alt: 'A country lane with one tree and a fence',
    full: 'c5e8769f0b42884ad2935e07a5f24fc1d903f39453f2f2aa9147dd9334b39b30',
    md: '2840fe3a220b571e32e009293de6a9f69646e4478e93f5c3d04d6d7dc8aa755b',
    sm: '6328b0196acdf37144caf01f62b83d5391a12b37f0bc72c0123ff81c17d29ec3',
  },
  {
    w: 1200,
    h: 1600,
    place: 'Arashiyama, Japan',
    alt: 'Looking straight up in a bamboo forest',
    full: '79c62b80d6ab867a6995e3f6d8ede8884777364a27d64385c8f9b8e2b75e31d8',
    md: 'f1ddd3c8904fe85ed30369aa5ca090c53ed5ae133896339f9f28cc06526badf4',
    sm: 'aebec569e5c53509d90f4ed711a803cf60fde89e97f636d2453ab8d57b1454db',
  },
]
export const CDN = 'https://files.gregskril.com'
export const photoUrl = (p, size = 'full') => `${CDN}/cdn/${p[size]}`

/* thumbnails for the pile; the lightbox loads the full size */
export const srcset = (p) =>
  `${photoUrl(p, 'sm')} 480w, ${photoUrl(p, 'md')} 800w, ${photoUrl(p)} 1600w`
export const label = (p) => `Open photo: ${p.alt}${p.place ? `, ${p.place}` : ''}`
