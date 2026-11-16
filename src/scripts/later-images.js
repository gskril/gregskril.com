/*
  Pictures load last. Images marked up with data-src get their real source only once the
  page has finished loading (text, fonts, and the line), so on a slow connection they never
  compete with the content. They keep loading="lazy", so ones far down the page still wait
  until you scroll near them. Without JavaScript, a <noscript> copy of each image is shown instead.
*/
function reveal() {
  document.querySelectorAll('img[data-src]').forEach((img) => {
    if (img.dataset.sizes && !img.getAttribute('sizes')) img.sizes = img.dataset.sizes; // photos.js may already know the exact size
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  });
}

if (document.readyState === 'complete') requestAnimationFrame(reveal);
else window.addEventListener('load', () => requestAnimationFrame(reveal), { once: true });
