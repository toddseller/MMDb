$(document).ready(function () {
  console.log('Document Ready')
  $('img.lazy').lazyload()
  bindListeners()
  dynamicListener()
})
