/* Review-only: the palette and hero pickers, shown when the URL has ?review. Remove once decided. */
;(() => {
  'use strict'
  const root = document.documentElement
  const picks = [...document.querySelectorAll('#review button[data-theme]')]
  const markPick = () =>
    picks.forEach((b) =>
      b.setAttribute(
        'aria-pressed',
        String((root.dataset.theme || '') === b.dataset.theme)
      )
    )
  picks.forEach((b) =>
    b.addEventListener('click', () => {
      if (b.dataset.theme) root.dataset.theme = b.dataset.theme
      else delete root.dataset.theme
      try {
        if (b.dataset.theme) localStorage.setItem('gb-theme', b.dataset.theme)
        else localStorage.removeItem('gb-theme')
      } catch (e) {}
      markPick()
    })
  )
  markPick()
  document
    .querySelectorAll('#review a[data-hero]')
    .forEach((a) =>
      a.setAttribute('aria-current', String((root.dataset.hero || '') === a.dataset.hero))
    )
})()
