import ART from '../art'

/* the scripts that build things in the browser (the photo stickers) read the art from here */
;(window as unknown as { GB_ART: typeof ART }).GB_ART = ART
