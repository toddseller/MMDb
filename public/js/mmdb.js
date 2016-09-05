var bindListeners = function () {
  $('img.lazy').lazyload({event: 'scrollstop'})
  $('#sign-in-form').on('submit', validate)
  $('.close').on('click', clearForm)
  $('.modal').on('shown.bs.modal', autoFocus)
}

var dynamicListener = function () {
  $('#user-page').on('click', '#add', showSearchBar)
  $('#user-page').on('submit', '#movie-search', getMovie)
  $('#user-page').on('submit', '#create-movie', movieToDB)
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
  var route = 'https://api.themoviedb.org/3/search/movie?api_key=29f9cfa4c730839f8828ae772bd7d75a&' + title + '&append_to_response=credits'
  $.get(route, addMovie)
  $(this).trigger('reset')
}

var displayMovie = function (response) {
  var year = response.release_date.split('-', 1)
  var genres = getGenres(response.genres)
  var actors = getActors(response.credits.cast)
  var rating = getRating(response.releases.countries)
  var director = getDirector(response.credits.crew)
  var writer = getWriter(response.credits.crew)
  var producer = getProducer(response.credits.crew)
  console.log(producer)
  $('#preview').show()
  $('#create-movie').closest('div').slideDown('slow')
  $('#poster').empty().append().attr('src', 'https://image.tmdb.org/t/p/w342' + response.poster_path).attr('alt', response.title + ' Poster')
  $('#title').empty().append(response.title)
  $('#genre').empty().append(genres)
  $('#year').empty().append(year[0])
  $('input[name="movie[title]"]').val(response.title)
  $('input[name="movie[year]"]').val(year[0])
  $('input[name="movie[rating]"]').val(rating)
  $('textarea[name="movie[plot]"]').val(response.overview)
  $('textarea[name="movie[actors]"]').val(actors)
  $('input[name="movie[director]"]').val(director)
  $('input[name="movie[writer]"]').val(writer)
  $('input[name="movie[producer]"]').val(producer)
  $('input[name="movie[genre]"]').val(genres)
  $('input[name="movie[runtime]"]').val(response.runtime + ' min')
  $('input[name="movie[poster]"]').val('https://image.tmdb.org/t/p/w342' + response.poster_path)
}

var addMovie = function (response) {
  if (response.results.length > 0) {
    var id = response.results[0].id
    var route = 'https://api.themoviedb.org/3/movie/' + id + '?api_key=29f9cfa4c730839f8828ae772bd7d75a&append_to_response=credits,releases'
    $.get(route, displayMovie)
  } else {
    $('#preview').show()
    $('#create-movie').closest('div').slideDown('slow')
    $('#poster').empty().append().attr('src', '/imgs/loading_image.svg').attr('alt', 'No Movies Match Your Query')
  }
  console.log(response)
}

var movieToDB = function (event) {
  event.preventDefault()
  var movie = $(this).serialize()
  var route = $(this).attr('action')
  $.post(route, movie, listMovie)
}

var listMovie = function (response) {
  console.log('listMovie:', response.page)
  if (response.status === 'true') {
    // $('#user-page').empty()
    $('#movie-list').empty().append(response.page)
    $('#preview').hide()
    $('#add').show()
    $('#search').hide()
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

var getActors = function (response) {
  var actors = response.reduce(function (acc, actor) {
    acc.push(actor.name)
    return acc
  }, [])

  return actors.slice(0, 6).join(', ')
}

var getRating = function (response) {
  var rating = response.filter(function (country) {
    return country.iso_3166_1 === 'US'
  })
  if (rating.length > 0) {
    return rating[0].certification
  }
}

var getGenres = function (response) {
  var genres = response.reduce(function (acc, genre) {
    acc.push(genre.name)
    return acc
  }, [])

  if (genres.length > 1) {
    return genres.slice(0, 2).join(', ')
  } else {
    return genres.join('')
  }
}

var getDirector = function (response) {
  var director = response.reduce(function (acc, crew) {
    if (crew.job === 'Director') {
      acc.push(crew.name)
    }
    return acc
  }, [])
  if (director.length > 1) {
    return director.join(', ')
  } else {
    return director.join('')
  }
}

var getWriter = function (response) {
  var writer = response.reduce(function (acc, crew) {
    if (crew.job === 'Screenplay') {
      acc.push(crew.name)
    }
    return acc
  }, [])
  if (writer.length > 1) {
    return writer.join(', ')
  } else {
    return writer.join('')
  }
}

var getProducer = function (response) {
  var producer = response.reduce(function (acc, crew) {
    if (crew.job === 'Producer') {
      acc.push(crew.name)
    }
    return acc
  }, [])
  if (producer.length > 1) {
    return producer.join(', ')
  } else {
    return producer.join('')
  }
}
