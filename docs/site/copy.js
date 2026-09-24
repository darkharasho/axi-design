for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const code = document.getElementById(button.dataset.copy)
    await navigator.clipboard.writeText(code.textContent)
    const previous = button.textContent
    button.textContent = 'Copied'
    setTimeout(() => { button.textContent = previous }, 1200)
  })
}
