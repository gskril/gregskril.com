/* The photos on a bake page open in the shared lightbox. */
import { createLightbox } from './lightbox.js'

const buttons = [...document.querySelectorAll('.bk-print')]
const lightbox = createLightbox(
  buttons.map((el) => {
    const thumb = el.querySelector('img')
    return {
      el,
      src: el.dataset.full,
      w: Number(el.dataset.w) || 1200,
      h: Number(el.dataset.h) || 1600,
      alt: thumb?.alt || '',
      preview: () => thumb?.currentSrc || '',
    }
  })
)
buttons.forEach((el, i) => el.addEventListener('click', () => lightbox?.open(i)))
