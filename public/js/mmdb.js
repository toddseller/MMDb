var bindListeners = function () {
  $('#sign-in-form').on('submit', validate)
  $('.close').on('click', clearForm)
  $('.modal').on('shown.bs.modal', autoFocus)
  $('#add').on('click', showSearchBar)
  $('#movie-search').on('submit', getMovie)
  $('#create-movie').on('submit', addMovie)
  $('#more').on('click', showYear)
  $('.movie-edit').on('click', editMovie)
  $('.edit-form').on('click', '#edit-button', submitUpdate)
  $('#delete-button').on('submit', deleteMovie)
}

var validate = function (event) {
  event.preventDefault()
  var formData = $('#sign-in-form :input').filter(checkValue).serialize()
  console.log(formData)
  if (formData === '') {
    $('p.login-errors').show()
  } else {
    $.post('/sessions', formData, displayLogin)
  }
}

var clearForm = function (event) {
  $('#sign-in-form').trigger('reset')
  $('p.login-errors').hide()
}

var checkValue = function (index, element) {
  return $(element).val() != ''
}

var displayLogin = function (response) {
  if (response.status === 'true') {
    window.location.replace('/users/' + response.user_id)
    $('#sign-in-form').trigger('reset')
  } else {
    $('p.login-errors').show()
    $('#sign-in-form').trigger('reset')
  }
}

var autoFocus = function () {
  $(this).find('[autofocus]').focus()
}

var showSearchBar = function () {
  $('#add').hide()
  $('#search').show()
}

var showYear = function () {
  $('#search-year').show()
  $('#search-title').css('right', '81px')
  $('.input-group-btn').css('top', '-17px')
  $('#more').hide()
}

var getMovie = function (event) {
  event.preventDefault()
  var title = $(this).serialize()
  var itunesTitle = $('#search-title').serialize().replace('t=', '')
  console.log(itunesTitle)
  var route = 'https://www.omdbapi.com/?' + title + '&plot=full&r=json'
  $.get(route, displayMovie)
}

var displayMovie = function (response) {
  console.log(response)
  $('#preview').show()
  $('#create-movie').closest('div').slideDown('slow')
  if (response.Poster === 'N/A') {
    $('#poster').append().attr('src', 'http/mmdb.online/imgs/default_image.png').attr('alt', 'No Image Available')
  } else {
    $('#poster').append().attr('src', response.Poster).attr('alt', response.Title + ' Poster')
  }
  $('#title').append(response.Title)
  $('#genre').append(response.Genre)
  $('#year').append(response.Year)
  $('input[name="movie[title]"]').val(response.Title)
  $('input[name="movie[year]"]').val(response.Year)
  $('input[name="movie[rating]"]').val(response.Rated)
  $('textarea[name="movie[plot]"]').val(response.Plot)
  $('textarea[name="movie[actors]"]').val(response.Actors)
  $('input[name="movie[director]"]').val(response.Director)
  $('input[name="movie[writer]"]').val(response.Writer)
  $('input[name="movie[genre]"]').val(response.Genre)
  $('input[name="movie[runtime]"]').val(response.Runtime)
  $('input[name="movie[poster]"]').val(response.Poster)
}

var addMovie = function (event) {
  event.preventDefault()
  console.log('YAY!')
  var movie = $(this).serialize()
  var route = $(this).attr('action')
  $.post(route, movie, listMovie)
}

var listMovie = function (response) {
  if (response.status === 'true') {
    document.location.reload(true)
  }
}

var editMovie = function (event) {
  event.preventDefault()
  var route = $(this).attr('href')
  $.get(route, displayEditForm)
}

var displayEditForm = function (response) {
  $('.modal-body').replaceWith(response)
  $('.modal-footer').hide()
}

var submitUpdate = function (event) {
  event.preventDefault()
  console.log('FUCK!')
  var formRoute = $(this).attr('action')
  var formData = $(this).serialize()
  $.ajax({
    url: formRoute,
    data: formData,
    type: 'PUT',
    success: displayUpdatedMovie
  })
}

var displayUpdatedMovie = function (response) {
  console.log(response)
}

var deleteMovie = function (event) {
  event.preventDefault()
  var formRoute = $(this).attr('action')
  $.ajax({
    url: formRoute,
    type: 'DELETE'
  })
  document.location.reload(true)
}
