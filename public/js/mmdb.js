var bindListeners = function () {
  $('img.lazy').lazyload({event: 'scrollstop', effect: 'fadeIn'})
  $('#sign-in-form').on('submit', validate)
  $('.close').on('click', clearForm)
  $('.modal').on('shown.bs.modal', autoFocus)
}

var dynamicListener = function () {
  $('#user-page').on('click', '#add', showSearchBar)
  $('#user-page').on('submit', '#movie-search', getMovie)
  $('#user-page').on('submit', '#create-movie', addMovie)
  $('#user-page').on('click', '#more', showYear)
  $('#user-page').on('click', '.movie-modal', getMovieModal)
  $('.movie-content').on('click', '.movie-edit', editMovie)
  $('#movie').on('click', '#edit-button', submitUpdate)
  $('#movie').on('click', '#delete-button', deleteMovie)
}

var validate = function (event) {
  event.preventDefault()
  var formData = $('#sign-in-form :input').filter(checkValue).serialize()
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
  var route = 'https://www.omdbapi.com/?' + title + '&plot=full&r=json'
  $.get(route, displayMovie)
  $(this).trigger('reset')
}

var displayMovie = function (response) {
  $('#preview').show()
  $('#create-movie').closest('div').slideDown('slow')
  if (response.Poster === 'N/A') {
    $('#poster').empty().append().attr('src', '/imgs/default_image.png').attr('alt', 'No Image Available')
  } else {
    $('#poster').empty().append().attr('src', response.Poster).attr('alt', response.Title + ' Poster')
  }
  $('#title').empty().append(response.Title)
  $('#genre').empty().append(response.Genre)
  $('#year').empty().append(response.Year)
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
  var movie = $(this).serialize()
  var route = $(this).attr('action')
  $.post(route, movie, listMovie)
}

var listMovie = function (response) {
  if (response.status === 'true') {
    $('#user-page').empty().append(response.page)
  }
}

var getMovieModal = function (event) {
  event.preventDefault()
  var user = $(this).parent().attr('id')
  var movieId = $(this).attr('id')
  var route = '/users/' + user + '/movies/' + movieId
  $.get(route, displayMovieModal)
}

var displayMovieModal = function (response) {
  $('#movie .modal-content').empty().append(response)
  $('#movie').modal('show')
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
  var formRoute = $(this).parent().attr('action')
  var formData = $(this).parent().serialize()
  $.ajax({
    url: formRoute,
    type: 'PUT',
    data: formData,
    success: displayUpdatedMovie
  })
}

var displayUpdatedMovie = function (response) {
  var title = $('#' + response.id).siblings()
  $('#movie .modal-content').empty().append(response.page)
  $('#' + response.id + ' img').attr('src', response.image)
  $(title[1]).html(response.title)
}

var deleteMovie = function (event) {
  event.preventDefault()
  var parentForm = $(this).parent().parent().children('form')
  var route = $(parentForm[0]).attr('action')
  var newRoute = $(this).attr('action', route)
  var formRoute = $(newRoute).attr('action')
  $.ajax({
    url: formRoute,
    type: 'DELETE',
    success: listMovie
  })
  $('#movie').modal('toggle')
}
