var bindListeners = function () {
  $('#sign-in-form').on('submit', validate)
  $('.close').on('click', clearForm)
  $('.modal').on('shown.bs.modal', autoFocus)
  $('#menu-toggle').on('click', animateMenu)
  $('#logout').on('click', logout)
  $('#update').on('click', updateUser)
  $('#search-movie-title').on('keyup', filterMovies)
  $('.registration #confirm').on('keyup', checkPassword)
  $('#clear-btn').on('click', clearFilter)
}

var dynamicListener = function () {
  $('#search-boxes').on('click', '#dismiss', closePreview)
  $('#user-page').on('click', '.top-preview', activateModal)
  $('#user-page').on('click', '#add', showSearchBar)
  $('#user-page').on('submit', '#movie-search', checkDatabase)
  $('#user-page').on('submit', '#create-movie', movieToDB)
  $('#user-page').on('click', '#more', showYear)
  $('#user-page').on('click', '.movie-modal', getMovieModal)
  $('#user-page').on('click', '.close', closeInfo)
  $('#user-page').on('click', '.movie-edit', editMovie)
  $('#user-page').on('click', '#edit-button', submitUpdate)
  $('#user-page').on('click', '#delete-button', deleteMovie)
  $('#user-page').on('click', '.rating-input', ratingSubmit)
  $('#logIn').on('click', '#update-submit', userUpdateSubmit)
  $('#logIn').on('keyup', '#confirm', testPassword)
  $('#logIn').on('change', '#current', deactivateSubmit)
  $('#logIn').on('click', '#myonoffswitch', changeTheme)
}

var filterMovies = function () {
  var filter = $(this).val()
  var filterExp = new RegExp(filter, 'i')
  var movies = $('#movie-list > div')
  $('.info').remove()

  hideShow(movies, filterExp)

  var filteredList = $('#movie-list > div').filter('.index-preview:visible')
  filteredWithInfo(filteredList)
}

var hideShow = function (array, expression) {
  return $.each(array, function () {
    if ($(this).text().search(expression) < 0) {
      $(this).hide()
    } else {
      $(this).show()
    }
  })
}

var filteredWithInfo = function (array) {
  return $.each(array, function (i) {
    if ((i + 1) % 6 === 0) {
      $(this).css('margin-right', '0')
      $(this).after('<div class="info"></div>')
    } else {
      $(this).css('margin-right', '1.8em')
    }
    $('#movie-list > .index-preview:last').after('<div class="info"></div>')
  })
}

var filtered = function (array) {
  return $.each(array, function (i) {
    if ((i + 1) % 6 === 0) {
      $(this).css('margin-right', '0')
    } else {
      $(this).css('margin-right', '1.8em')
    }
  })
}

var clearFilter = function () {
  $('#movie-list > div').removeAttr('style').show()
  $('#filter-input').trigger('reset')
  $('.info').remove()
  $('.pointer').removeClass('notransition').removeClass('active').removeAttr('style')
  $('.truncate').fadeIn(400, 'linear')
  $('.lazy').removeClass('notransition').removeClass('active')
}

var animateMenu = function (event) {
  event.preventDefault()
  $('#nav-toggle').toggleClass('active')
  $('#drop-down').toggleClass('active')
}

var logout = function (event) {
  event.preventDefault()
  var id = $(this).attr('href')
  var route = '/sessions/' + id
  $.post(route, function () {window.location.replace('/users')})
}

var updateUser = function (event) {
  event.preventDefault()
  var route = $(this).attr('href')
  $.get(route, displayUserForm)
}

var displayUserForm = function (response) {
  $('#logIn .modal-content').empty().append(response)
  $('#logIn').modal('show')
  $('#nav-toggle').toggleClass('active')
  $('#drop-down').toggleClass('active')
}

var deactivateSubmit = function () {
  if ($('#current input').val()) {
    $('form button[type=submit]').attr('disabled', 'disabled')
    $('.confirmation input').removeAttr('disabled', 'disabled')
  } else {
    $('form button[type=submit]').removeAttr('disabled', 'disabled')
    $('form input[name="confirm"]').css('border', '1px solid #cccccc').css('box-shadow', 'none')
  }
}

var testPassword = function () {
  if ($('form input[name="password"]').val() === $('form input[name="confirm"]').val() && $('#current input').val()) {
    $('.confirmation > span').show()
    $('form button[type=submit]').removeAttr('disabled', 'disabled')
    $('form input[name="confirm"]').css('border', '1px solid #088000').css('box-shadow', '0 0 5px #088000')
  } else {
    $('form input[name="confirm"]').css('border', '1px solid #ff0000').css('box-shadow', '0 0 5px #ff0000')
    $('form button[type=submit]').attr('disabled', 'disabled')
    $('.confirmation > span').hide()
  }
}

var checkPassword = function () {
  var timer
  clearTimeout(timer)
  timer = setTimeout(function () {
    if ($('form input[name="user[password]"]').val() === $('form input[name="confirm"]').val()) {
      $('.confirmation > span').show()
      $('#no-match2').slideUp()
      $('form input[type=submit]').removeAttr('disabled', 'disabled')
    } else {
      $('#no-match2').slideDown().text('Passwords do not match')
      $('form input[type=submit]').attr('disabled', 'disabled')
      $('.confirmation > span').hide()
    }
  }, 1500)
}

var changeTheme = function () {
  if ($('#myonoffswitch').is(':checked')) {
    $('head').append('<link rel="stylesheet" href="/css/dark.css" type="text/css" />')
  } else {
    $('head').append('<link rel="stylesheet" href="/css/default.css" type="text/css" />')
  }
}

var userUpdateSubmit = function (event) {
  event.preventDefault()
  var route = $(this).parents('form').attr('action')
  var data = $(this).parents('form').serialize()
  var form = $(this).parents('form')
  $.ajax({
    url: route,
    type: 'PUT',
    data: data,
    success: userUpdated
  })
}

var userUpdated = function (response) {
  if (response.status === 'true') {
    $('#logIn').modal('toggle')
    $('.navbar-text').text('Signed in as ' + response.name)
  } else {
    $('p.login-errors').show()
    $('form input[name="current"]').val('').focus()
    $('.confirmation input').val('').css('border', '1px solid #cccccc').css('box-shadow', 'none').attr('disabled', 'disabled')
    $('.confirmation > span').hide()
  }
}

var validate = function (event) {
  event.preventDefault()
  console.log('In validate function')
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
  return $(element).val() !== ''
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
  $('#search-title').css('right', '70px')
  $('#search-btn').css('top', '-17px')
  $('#more').hide()
}

var checkDatabase = function (event) {
  event.preventDefault()
  var data = $(this).serialize()
  var route = '/movies'
  $.get(route, data, previewMovie)
  $(this).trigger('reset')
}

var previewMovie = function (response) {
  if (response.movie.length < 1) {
    getMovie(response.query)
  } else {
    $('#preview').slideDown(300, 'linear')
    $('#dismiss').show()
    $('#poster').empty().append().attr('src', response.movie[0].poster).attr('alt', response.movie.title + ' Poster')
    $('#title').empty().append(response.movie[0].title)
    $('#genre').empty().append(response.movie[0].genre)
    $('#year').empty().append(response.movie[0].year)
    $('input[name="movie[title]"]').val(response.movie[0].title)
    $('input[name="movie[year]"]').val(response.movie[0].year)
  }
}

var getMovie = function (query) {
  query = $.param(query)
  var route = 'https://api.themoviedb.org/3/search/movie?api_key=29f9cfa4c730839f8828ae772bd7d75a&' + query + '&append_to_response=credits'
  $.get(route, addMovie)
}

var displayMovie = function (response) {
  var year = response.release_date.split('-', 1)
  var genres = getGenres(response.genres)
  var actors = getActors(response.credits.cast)
  var rating = getRating(response.releases.countries)
  var director = getDirector(response.credits.crew)
  var writer = getWriter(response.credits.crew)
  var producer = getProducer(response.credits.crew)

  $('#preview').slideDown(300, 'linear')
  $('#dismiss').show()
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
  $('input[name="movie[runtime]"]').val(response.runtime)
  $('input[name="movie[poster]"]').val('https://image.tmdb.org/t/p/w342' + response.poster_path)
}

var addMovie = function (response) {
  if (response.results.length > 0) {
    var id = response.results[0].id
    var route = 'https://api.themoviedb.org/3/movie/' + id + '?api_key=29f9cfa4c730839f8828ae772bd7d75a&append_to_response=credits,releases'
    $.get(route, displayMovie)
  } else {
    $('#preview').slideDown(300, 'linear')
    $('#dismiss').show()
    $('#poster').empty().append().attr('src', '/imgs/loading_image.svg').attr('alt', 'No Movies Match Your Query')
  }
}

var movieToDB = function (event) {
  event.preventDefault()
  var movie = $(this).serialize()
  var route = $(this).attr('action')
  $.post(route, movie, listMovie)
}

var listMovie = function (response) {
  if (response.status === 'true') {
    $('#preview').slideUp(500, 'linear')
    $('#dismiss').hide()
    $('#add').show()
    $('#search').hide()
    $('#search-year').hide()
    $('#search-title').css('right', '0')
    $('.input-group-btn').css('top', '0')
    $('#movie-list').css('top', '0')
    $('#more').show()
    $('#title').empty()
    $('#genre').empty()
    $('#year').empty()
    $('#movie-list').empty().append(response.page)
    var filter = $('#search-movie-title').val()
    var filterExp = new RegExp(filter, 'i')
    var movies = $('#movie-list > div')

    hideShow(movies, filterExp)
    if ($('.index-preview:hidden').length !== 0) {
      var filteredList = $('#movie-list > div').filter('.index-preview:visible')
      filteredWithInfo(filteredList)
    }
  }
}

var closePreview = function (event) {
  event.preventDefault()
  $('#preview').slideUp(300, 'linear')
  $('#dismiss').hide()
  $('#add').show()
  $('#search').hide()
  $('#search-year').hide()
  $('#search-title').css('right', '0')
  $('.input-group-btn').css('top', '0')
  $('#movie-list').css('top', '0')
  $('#more').show()
  $('#title').empty()
  $('#genre').empty()
  $('#year').empty()
}

var getMovieModal = function (event) {
  event.preventDefault()

  var user = $(this).parent().attr('id')
  var movieId = $(this).attr('id')
  var route = '/users/' + user + '/movies/' + movieId
  var that = $(this).parent('div')
  var posterArt = $(this).children('img')
  var title = $(this).siblings('p')
  var index = $(that).index()
  var itemsPerRow = 6
  var col = (index % itemsPerRow) + 1
  var endOfRow = $('.index-preview').eq(index + itemsPerRow - col)
  if (!endOfRow.length) endOfRow = $('.index-preview').last()
  var request = $.ajax({
    url: route
  })
  request.done(function (response) {
    if ($('.index-preview:hidden').length === 0) {
      if ($('#movie-list > div').hasClass('info')) {
        $('.info').remove()
        switchInfoDiv(posterArt, title)
        endOfRow.after('<div class="info"></div>')
        $(that).nextAll('div.info').toggleClass('active').append('<div class="info-wrapper">' + response + '</div>')
        $(that).find('.pointer').addClass('notransition').addClass('active')
      } else {
        var filteredList = $('#movie-list > div').filter('.index-preview')
        filtered(filteredList)
        endOfRow.after('<div class="info"></div>')
        $(posterArt).toggleClass('active')
        $(title).hide()
        $(that).find('.pointer').toggleClass('active')
        $(that).nextAll('div.info').first().toggleClass('active').append('<div class="info-wrapper">' + response + '</div>')
      }
    } else {
      if ($('#movie-list > div').hasClass('info')) {
        switchInfoDiv(posterArt, title)
        $('.info').empty().removeAttr('style').removeClass('active')
        $(that).nextAll('div.info').first().toggleClass('active').append('<div class="info-wrapper">' + response + '</div>')
        $(that).find('.pointer').addClass('notransition').addClass('active')
      } else {
        var filteredList = $('#movie-list > div').filter('.index-preview:visible')
        filteredWithInfo(filteredList)

        $(posterArt).toggleClass('active')
        $(title).hide()
        $(that).find('.pointer').toggleClass('active')
        $(that).nextAll('div.info').first().toggleClass('active').append('<div class="info-wrapper">' + response + '</div>')
      }
    }
  })
}

var switchInfoDiv = function (posterArt, title) {
  $('.truncate').fadeIn(400, 'linear')
  $('.lazy').removeClass('active').removeClass('notransition')
  $('.pointer').removeClass('notransition').removeClass('active')
  posterArt.toggleClass('active').addClass('notransition')
  title.hide()
}

var ratingSubmit = function (event) {
  event.preventDefault()

  var rating = $(this).serialize()
  var route = $(this).parents('form').attr('action')
  var label = $('label[for="' + $(this).attr('id') + '"]')

  label.nextAll('label').andSelf().css('color', '#ff0000').css('font-size', '19px')
  label.prevAll('label').css('color', '#e4e4e4').css('font-size', '19px')
  $('.rating>p').css('bottom', '13px')

  var request = $.ajax({
    url: route,
    type: 'POST',
    data: rating
  })

  request.done(function (response) {
    $('#ratings-container').html(response)
  })
}

var closeInfo = function (event) {
  event.preventDefault()
  var removeInfoClass = function () {
    $('.info').remove()
  }
  $('.pointer').removeClass('notransition').removeClass('active').removeAttr('style')
  $('.info').removeClass('active')
  $('.truncate').fadeIn(400, 'linear')
  $('.lazy').removeClass('notransition').removeClass('active')
  setTimeout(removeInfoClass, 1000)
}

var activateModal = function (event) {
  event.preventDefault()
  var route = $(this).children('a').attr('href')
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
  $('#movie-list').empty().append(response.list)
  var filter = $('#search-movie-title').val()
  var filterExp = new RegExp(filter, 'i')
  var movies = $('#movie-list > div')
  var that = $('#' + response.id).parent('div')
  var posterArt = $('#' + response.id).children('img')
  var title = $('#' + response.id).siblings('p')

  hideShow(movies, filterExp)

  var filteredList = $('#movie-list > div').filter('.index-preview:visible')
  filteredWithInfo(filteredList)

  $(posterArt).toggleClass('active').addClass('notransition')
  $(title).hide()
  $(that).find('.pointer').toggleClass('active').addClass('notransition')
  $(that).nextAll('div.info').first().toggleClass('active').addClass('notransition').append('<div class="info-wrapper">' + response.page + '</div>')
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
  var removePointerClass = function () {
    $('.pointer').removeClass('active').removeAttr('style')
  }
  $('.info').removeClass('active')
  $('.truncate').show()
  $('.lazy').removeClass('active')
  $('.pointer').css('border-top', '#fff').css('border-left', '#fff')
  setTimeout(removePointerClass, 100)
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
  } else {
    return 'NR'
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
    if (crew.job === 'Screenplay' || crew.job === 'Writer') {
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
