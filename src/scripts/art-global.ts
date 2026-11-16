import { babka, baguette, loaf } from '../art'

/* the scripts that build things in the browser (the bread stickers) read their art from here.
   Only the stickers: the big "holding" drawing is already in the page's HTML, so it stays out of the script. */
;(window as unknown as { GB_ART: Record<string, string> }).GB_ART = { babka, baguette, loaf }
