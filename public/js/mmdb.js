var lastPos = 0
var timeoutId = 0
var filterValue = ''
var activeItem = $('body')

var bindListeners = function () {
  $('#sign-in-form').on('submit', validate)
  $('.close').on('click', clearForm)
  $('.modal').on('shown.bs.modal', autoFocus)
  $('#menu-toggle').on('click', animateMenu)
  $('#logout').on('click', logout)
  $('#update').on('click', updateUser)
  $('.registration #confirm').on('keyup', checkPassword)
  $('#unwatched').on('click', unwatched)
  $('#four-k').on('click', fourK)
  $('#library').on('click', clearFilter)
  $('#user-profile').on('click', toggleProfile)
  $('#user-shows').on('click', getUser)
  $('#user-movies').on('click', getUser)
}

var dynamicListener = function () {
  $(document).on('click', '#user-movies', getUser)
  $(document).on('click', '#user-shows', getUser)
  $('#user-page').on('click', '#dismiss', closePreview)
  $('#user-page').on('keyup', '#search-movie-title', function () {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(filterMovies, 300)
  })
  $('#user-page').on('click', '#scroll-right', scrollRight)
  $('#user-page').on('click', '#scroll-left', scrollLeft)
  $('#user-page').on('click', '#clear-btn', clearFilter)
  $('#user-page').on('click', '.top-preview', activateModal)
  $('#user-page').on('click', '#add', showSearchBar)
  $('#user-page').on('click', '#add-show', showSearchBar2)
  $('#user-page').on('submit', '#movie-search', checkDatabase)
  $('#user-page').on('submit', '#show-search', checkDatabase2)
  $('#user-page').on('click', '#create-new', createShow)
  $('#user-page').on('submit', '#create-movie', movieToDB)
  $('#user-page').on('submit', '#create-show', showToDB)
  $('#user-page').on('submit', '#create-episode', episodeToDB)
  $('#user-page').on('click', '#more', showYear)
  $('#user-page').on('click', '.movie-modal', getMovieModal)
  $('#user-page').on('click', '.show-modal', getMovieModal)
  $('#user-page').on('click', '.close', closeInfo)
  $('#user-page').on('click', '.movie-edit', editMovie)
  $('#user-page').on('click', '.show-edit', editShow)
  $('#user-page').on('click', '#edit-button', submitUpdate)
  $('#user-page').on('click', '#delete-button', deleteMovie)
  $('#user-page').on('click', '#update-search', updateDatabase)
  $('#user-page').on('click', '#update-movie', submitPreviewUpdate)
  $('#user-page').on('click', '.rating-input', ratingSubmit)
  $('#user-page').on('click', '.description-details a', searchByName)
  $('#user-page').on('click', '.studio a', searchByName)
  $('#user-page').on('change', '.hd input:checkbox', toggleHD)
  $('#user-page').on('click', '.expand-plot', expandPlot)
  $('#user-page').on('click', '.season-submit', seasonDefault)
  $('#logIn').on('click', '#update-submit', userUpdateSubmit)
  $('#logIn').on('keyup', '#confirm', testPassword)
  $('#logIn').on('change', '#current', deactivateSubmit)
  $('#logIn').on('click', '#myonoffswitch', changeTheme)
  $('#edit-show').on('click', 'button', toggleActive)
  $('#edit-show').on('change', 'input[name="season[poster]"]', updatePoster)
  $('#edit-show').on('click', '#episode-delete', deleteEpisode)
}


var openMenu = function () {
  $('#nav-toggle').addClass('active')
  $('#drop-down').addClass('active')
}

var closeMenu = function () {
  $('#nav-toggle').removeClass('active')
  $('#drop-down').removeClass('active')
}

var goToProfile = function (event) {
  event.preventDefault()
  var route = $(this).attr('href')
  var request = $.ajax({
    url: route
  })
  request.done(function (response) {
    if ($('#movie-list').length > 0) {
      $('#movie-list').empty().append(response)
    } else {
      $('#show-list').empty().append(response)
    }
  })
}

var toggleHD = function () {
  if (this.checked) {
    var checkname = $(this).attr("name");
    $("input:checkbox[name='" + checkname + "']").not(this).removeAttr("checked");
  }
}

var filterMovies = function (event) {

  filterValue = $('#search-movie-title').val()
  var routePath = $('#movie-list').length > 0 ? 'movies' : 'shows'
  var id = $('.index-preview').attr('id') ? $('.index-preview').attr('id') : window.sessionStorage.id
  if (window.sessionStorage.id != id || !window.sessionStorage.id) {
    window.sessionStorage.setItem('id', id)
  }
  var data = $.param({filter:filterValue, id:id})
  var route = '/' + routePath + '/filter'

  var request = $.ajax({
    url: route,
    data: data
  })
  request.done(function (response) {
    $('#movie-list').empty().append(response.page);
    $('.footer').empty().append(response.count + ' Movies').fadeIn()
  })
}

var unwatched = function (evenet) {
  event.preventDefault()

  $('#unwatched').addClass('active')
  $('#four-k').removeClass('active')
  var route = $(this).attr('href')
  var request = $.ajax({
    url: route
  })
  request.done(function (response) {
    $('#movie-list').empty().append(response)
  })
}

var fourK = function (evenet) {
  event.preventDefault()

  $('#four-k').addClass('active')
  $('#unwatched').removeClass('active')
  var route = $(this).attr('href')
  var request = $.ajax({
    url: route
  })
  request.done(function (response) {
    $('#movie-list').empty().append(response)
  })
}

var filtered = function (array) {
  return $.each(array, function (i) {
    modulo = $('#movie-list').length > 0 ? 7 : 6
    if ((i + 1) % modulo === 0) {
      $(this).css('margin-right', '0')
    } else {
      $(this).css('margin-right', '2em')
    }
  })
}

var filteredWithInfo = function (array) {
  return $.each(array, function (i) {
    modulo = $('#movie-list').length > 0 ? 7 : 6
    if ((i + 1) % modulo === 0) {
      $(this).css('margin-right', '0')
      $(this).after('<div class="info"></div>')
     } else {
      $(this).css('margin-right', '2em')
     }
    $('#movie-list > .index-preview:last').after('<div class="info"></div>')
  })
 }

var clearFilter = function () {
  var id = window.sessionStorage.id
  var route = '/users/' + id
  $.get(route).done(function (response) {
    $('#profile-wrapper').removeClass('active')
    $('#user-page').empty().append(response.page)
    $('.footer').empty().append(response.movie_count + ' Movies').fadeIn()
    $('img.lazy').lazyload()
    $('#profile-image').empty()
    $('#profile-name').empty()
  })
  $('#filter-input').trigger('reset')
  $('.info').remove()
  $('.pointer').removeClass('notransition').removeClass('active').removeAttr('style')
  $('.truncate').fadeIn(400, 'linear')
  $('.lazy').removeClass('notransition').removeClass('active')
  $('#unwatched').removeClass('active')
  $('#four-k').removeClass('active')
  filterValue = ''
}

var animateMenu = function (event) {
  event.preventDefault()
  $('#nav-toggle').toggleClass('active')
  $('#drop-down').toggleClass('active')
  if (!$('#drop-down').hasClass('active') && $('#drop-down-submenu').hasClass('active')) {
    $('#drop-down-submenu').removeClass('active')
    $('#user-profile > span.glyphicon.glyphicon-triangle-bottom').removeClass('active')
  }
}

var toggleProfile = function (event) {
  event.preventDefault()
  $('#drop-down-submenu').toggleClass('active')
  $('#user-profile > span.glyphicon.glyphicon-triangle-right').toggleClass('active')
}

var logout = function (event) {
  event.preventDefault()
  var id = $(this).attr('href')
  var route = '/sessions/' + id
  $.post(route, function () {window.location.replace('/')})
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

var showSearchBar2 = function () {
  $('#add-show').hide()
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
  $.ajax({
    url: route,
    data: data,
    success: previewMovie,
    error: (function(jqXHR, textStatus, errorThrown) {
      if (jqXHR.status == 500) {
        $('#preview').empty().slideDown(300, 'linear').append('<div style="width: 174px; height: auto;"><img src="/imgs/loading_image.svg" width: 174 height: auto></div>').css({'display':'flex','justify-content':'center'})
      }
    })
  })
  $(this).trigger('reset')
  $('#preview').empty().slideDown(300, 'linear').append('<div id="loading"><h3>Searching Our Database...</h3><div class="loader"></div></div>').css({'display':'flex','justify-content':'center'})
  $('#dismiss').attr('style','top: 0;').show()
  $('#scroll-right').hide()
  $('#scroll-left').hide()
}

var checkDatabase2 = function (event) {
  event.preventDefault()
  var data = $(this).serialize()
  var route = '/shows'
  $.ajax({
    url: route,
    data: data,
    success: previewShow,
    error: (function(jqXHR, textStatus, errorThrown) {
      if (jqXHR.status == 500) {
        $('#preview').empty().slideDown(300, 'linear').append('<button type="submit" id="create-new" class="add-all"><span class="glyphicon glyphicon-plus"></span><p>Create New Show</p></button>').css({'display':'flex','justify-content':'center','height':'300px'})
      }
    })
  })
  $(this).trigger('reset')
  $('#preview').empty().slideDown(300, 'linear').append('<div id="loading"><h3>Searching Our Database...</h3><div class="loader"></div></div>').css({'display':'flex','justify-content':'center','height':'300px'})
  $('#dismiss').show()
  $('#scroll-right').hide()
  $('#scroll-left').hide()
}

var updateDatabase = function (event) {
  event.preventDefault()
  var parentForm = $('.edit-form').attr('action')
  var title = $('#movie_title').text()
  var data = {title: title, route: parentForm}
  var route = '/movies/update'
  $.ajax({
    url: route,
    data: data,
    success: previewMovie,
    error: (function(jqXHR, textStatus, errorThrown) {
      if (jqXHR.status == 500) {
        $('#preview').empty().slideDown(300, 'linear').append('<div style="width: 174px; height: auto;"><img src="/imgs/loading_image.svg" width: 174 height: auto></div>').css({'display':'flex','justify-content':'center'})
      }
    })
  })
  $(this).trigger('reset')
  $('#preview').empty().slideDown(300, 'linear').append('<div id="loading"><h3>Searching Our Database...</h3><div class="loader"></div></div>').css({'display':'flex','justify-content':'center'})
  $('#dismiss').attr('style','top: 0;').show()
  $('#scroll-right').hide()
  $('#scroll-left').hide()
}

var createShow = function (event) {
  event.preventDefault()
  var id = $('.index-preview') > 0 ? $('.index-preview').attr('id') : window.sessionStorage.id
  var route = '/users/' + id + '/shows/new'
  $.get(route, displayCreateShow)
}

var displayCreateShow = function (response) {
  $('#preview').slideUp(500, 'linear')
  $('#dismiss').hide()
  $('#scroll-right').hide()
  $('#scroll-left').hide()
  $('#add-show').show()
  $('#search').hide()
  $('#search-year').hide()
  $('#search-title').css('right', '0')
  $('.input-group-btn').css('top', '0')
  $('#show-list').css('top', '0')
  $('#more').show()
  $('#edit-show').empty().append(response.page)
  $('#edit-show').modal('show')
}

var seasonDefault = function (event) {
  event.preventDefault()
  var id = $(this).val()
  var route = $('#season-default').attr('action') + id
  var request = $.ajax({
    url: route,
    method: 'POST'
  })
  request.done(function (response) {
    $('.info-wrapper').empty().append(response.page)
    $('img.active').attr('src', response.poster)
  })
}

var previewMovie = function (response) {
  if (response.query.length <= 6) {
    $('#preview').slideDown(300, 'linear')
    $('#dismiss').attr('style','top: 0;').show()
    $('#scroll-right').hide()
    $('#preview').empty().append(response.page).attr('style', 'display: flex !important; justify-content: center;')
  } else {
    $('#preview').slideDown(300, 'linear')
    $('#dismiss').attr('style','top: 0;').show()
    $('#preview').scroll(addArrow)
    $('#preview').empty().append(response.page).attr('style', 'display: flex !important; justify-content: space-between;')
    $('#scroll-left').removeAttr('style')
    $('#scroll-right').removeAttr('style')
    $('.glyphicon-chevron-left').removeAttr('style')
    $('.glyphicon-chevron-right').removeAttr('style')
    if ($('#preview > div').size() <= 6) {
      $('#scroll-right').hide()
    } else {
      $('#scroll-right').show()
    }
  }
}

var previewShow = function (response) {
  if (response.query.length <= 6) {
    $('#preview').slideDown(300, 'linear')
    $('#dismiss').show()
    $('#scroll-right').hide()
    $('#preview').empty().append(response.page).attr('style', 'display: flex; justify-content: center; height: 300px;')
  } else {
    $('#preview').slideDown(300, 'linear')
    $('#dismiss').show()
    $('#preview').scroll(addArrow)
    $('#preview').empty().append(response.page).attr('style', 'display: flex; justify-content: space-between; height: 300px;')
    $('#scroll-left').attr('style', 'height: 200px; top: 87px;')
    $('#scroll-right').attr('style', 'height: 200px; top: 87px;')
    $('.glyphicon-chevron-left').attr('style', 'line-height: 4em;')
    $('.glyphicon-chevron-right').attr('style', 'line-height: 4em;')
    if ($('#preview > div').size() <= 6) {
      $('#scroll-right').hide()
    } else {
      $('#scroll-right').show()
    }
  }
}

var addArrow = function () {
  var currPos = $('#preview').scrollLeft()
  var maxWidth = $('#preview').prop("scrollWidth") - $('#preview').width() - 30
  var minWidth = 0

  if (lastPos < currPos) {
    $('#scroll-right').fadeIn()
    $('#scroll-left').fadeIn()
  }

  if (lastPos > currPos) {
    $('#scroll-left').fadeIn()
    $('#scroll-right').fadeIn()
  }

  if (currPos == maxWidth) {
    $('#scroll-right').fadeOut()
  }

  if (currPos == 0) {
    $('#scroll-left').fadeOut()
  }
}

var scrollRight = function () {
  $('#preview').animate({
    scrollLeft: '+=1386px'
  }, 1000)
}

var scrollLeft = function () {
  $('#preview').animate({
    scrollLeft: '-=1386px'
  }, 1000)
}

var movieToDB = function (event) {
  event.preventDefault()
  var title = $(this).find('input[name="movie[title]"]').val()
  var movie = $(this).serialize() + '&filter=' + $('#search-movie-title').val()
  $('#preview').empty().slideDown(300, 'linear').append('<div id="loading"><h3>Adding ' + title + ' to Your Collection...</h3><div class="loader"></div></div>').css('display','block')
  var route = $(this).attr('action')
  $.post(route, movie, listMovie)
}

var showToDB = function (event) {
  event.preventDefault()
  var title = $(this).find('input[name="show[title]"]').val()
  var movie = $(this).serialize() + '&filter=' + $('#search-movie-title').val()
  $('#preview').empty().slideDown(300, 'linear').append('<div id="loading"><h3>Adding ' + title + ' to Your Collection...</h3><div class="loader"></div></div>').css('display','block')
  $('#scroll-right').hide()
  var route = $(this).attr('action')
  $.post(route, movie, listEpisode)
}

var episodeToDB = function (event) {
  event.preventDefault()
  var title = !$(this).find('button[type="submit"] > span').hasClass('glyphicon') ? $(this).find('input[name="episode[title]"]').val() : 'Season ' + $(this).find('button[type="submit"]').attr('id')
  var movie = $(this).serialize() + '&filter=' + $('#search-movie-title').val()
  $('#preview').empty().slideDown(300, 'linear').append('<div id="loading"><h3>Adding ' + title + ' to Your Collection...</h3><div class="loader"></div></div>').css('display','block')
  $('#scroll-right').hide()
  var route = $(this).attr('action')
  $.post(route, movie, listShow)
}

var searchByName = function (event) {
  event.preventDefault()

  $('#filter-input').trigger('reset')

  filterValue = $(this).text()
  var id = $('.index-preview').length > 0 ? $('.index-preview').attr('id') : window.sessionStorage.id
  var data = $.param({filter:filterValue, id:id})
  var route = '/movies/search'

  var request = $.ajax({
    url: route,
    data: data
  })
  request.done(function (response) {
    if (response.url === "no-image") {
      $('#profile-image').hide()
      $('#profile-name').css({'margin-top':'100px', 'left':'0','text-align':'center'})
    } else {
      $('#profile-image').attr('src',response.url).show()
      $('#profile-name').attr('style','')
    }
    $('#profile-name').text(filterValue)
    $('#profile-wrapper').addClass('active')
    $('#movie-list').empty().append(response.page)
  })
}

var listMovie = function (response) {
  if (response.status === 'true') {
    $('#preview').slideUp(500, 'linear')
    $('#dismiss').removeAttr('style').hide()
    $('#scroll-right').hide()
    $('#scroll-left').hide()
    $('#add').show()
    $('#search').hide()
    $('#search-year').hide()
    $('#search-title').css('right', '0')
    $('.input-group-btn').css('top', '0')
    $('#movie-list').css('top', '0')
    $('#more').show()
    $('#movie-list').empty().append(response.page)
    $('.footer').empty().append(response.movie_count + ' Movies').fadeIn()
    $('img.lazy').lazyload()
  }
}

var listEpisode = function (response) {
  if (response.status === 'true') {
    $('#preview').slideDown(300, 'linear')
    $('#dismiss').show()
    $('#preview').scroll(addArrow)
    if (response.count >= 5) {
      $('#preview').empty().append(response.page).attr('style', 'display: flex; justify-content: space-between; height: 300px;')
    } else {
      $('#preview').empty().append(response.page).attr('style', 'display: flex; justify-content: center; height: 300px;')
    }
    if ($('#preview > div').size() <= 6) {
      $('#scroll-right').hide()
    } else {
      $('#scroll-right').show().css({'height':'169px','top':'84px'})
      $('#scroll-left').css({'height':'169px','top':'84px'})
      $('#scroll-right .glyphicon').css({'line-height':'3.3em'})
      $('#scroll-left .glyphicon').css({'line-height':'3.3em'})
    }
  }
}

var listShow = function (response) {
  if (response.status === 'true') {
    $('#preview').slideUp(500, 'linear')
    $('#dismiss').hide()
    $('#scroll-right').hide()
    $('#scroll-left').hide()
    $('#add-show').show()
    $('#search').hide()
    $('#search-year').hide()
    $('#search-title').css('right', '0')
    $('.input-group-btn').css('top', '0')
    $('#show-list').css('top', '0')
    $('#more').show()
    $('#show-list').empty().append(response.page)
    $('.footer').empty().append(response.show_count + ' TV Shows &#8212; ' + response.episode_count + ' Episodes')
    $('img.lazy').lazyload()
  }
}

var closePreview = function (event) {
  event.preventDefault()
  $('#preview').slideUp(300, 'linear')
  $('#dismiss').hide()
  $('#scroll-right').hide()
  $('#scroll-left').hide()
  if ($('#movie-list').length == 1) {
    $('#add').show()
    $('#movie-list').css('top', '0')
  } else {
    $('#add-show').show()
    $('#show-list').css('top', '0')
  }
  $('#search').hide()
  $('#search-year').hide()
  $('#search-title').css('right', '0')
  $('.input-group-btn').css('top', '0')
  $('#more').show()
}

var closeUpdatePreview = function () {
  $('#preview').slideUp(300, 'linear')
  $('#dismiss').hide()
  $('#scroll-right').hide()
  $('#scroll-left').hide()
  if ($('#movie-list').length == 1) {
    $('#add').show()
    $('#movie-list').css('top', '0')
  } else {
    $('#add-show').show()
    $('#show-list').css('top', '0')
  }
  $('#search').hide()
  $('#search-year').hide()
  $('#search-title').css('right', '0')
  $('.input-group-btn').css('top', '0')
  $('#more').show()
}

var first = true

var getMovieModal = function (event) {
  event.preventDefault()

  var user = $(this).parent().attr('id')
  var id = $(this).attr('id')
  var indexPreview = $('#movie-list').length > 0 ? $('.index-preview') : $('.index-preview-show')
  var route = $('#movie-list').length > 0 ? '/users/' + user + '/movies/' + id : '/users/' + user + '/shows/' + id
  var pointer = $('#movie-list').length > 0 ? $('.pointer') : $('.show-pointer')
  var that = $(this).parent('div')
  var posterArt = $(this).children('img')
  var title = $(this).siblings('p')
  var index = $(that).index()
  var itemsPerRow = $('#movie-list').length > 0 ? 7 : 6
  var col = (index % itemsPerRow) + 1
  var endOfRow = indexPreview.eq(index + itemsPerRow - col)
  if (!endOfRow.length) endOfRow = indexPreview.last()

  if (id != activeItem) {
    var request = $.ajax({
      url: route
    })
    request.done(function (response) {
      $('.footer').fadeOut()
      var c = $('#movie-list').length > 0 ? $('#movie-list > div') : $('#show-list > div')
      if (c.hasClass('info')) {
        activeItem = id
        $('.info').remove()
        $('img.active').removeClass('active')
        switchInfoDiv(posterArt, title)
        if ($('#show-list').length > 0) {
          endOfRow.after('<div class="info" style="margin-top: 1px; max-height: 100%;"></div>')
        } else {
          endOfRow.after('<div class="info"></div>')
        }
        $(that).nextAll('div.info').toggleClass('active').append('<div class="info-wrapper">' + response + '</div>')
        $('#movie-list').length > 0 ? $(that).find('.pointer').addClass('notransition').addClass('active') : $(that).find('.show-pointer').addClass('notransition').addClass('active')
        $(that).find('.new-label').addClass('active').addClass('notransition')
        $(that).find('.new-text').addClass('active').addClass('notransition')
      } else {
        activeItem = id
        var filteredList = c.filter('.index-preview')
        filtered(filteredList)
        if ($('#show-list').length > 0) {
          endOfRow.after('<div class="info" style="margin-top: 1px; max-height: 100%;"></div>')
        } else {
          endOfRow.after('<div class="info"></div>')
        }
        $(posterArt).toggleClass('active')
        if ($('#movie-list').length > 0) {
          $(title).hide()
        }
        $('#movie-list').length > 0 ? $(that).find('.pointer').toggleClass('active') : $(that).find('.show-pointer').toggleClass('active')
        $(that).find('.new-label').toggleClass('active')
        $(that).find('.new-text').toggleClass('active')
        $(that).nextAll('div.info').first().toggleClass('active').append('<div class="info-wrapper">' + response + '</div>')
      }
    })
  } else {
    var removeInfoClass = function () {
      $('.info').remove()
    }
    pointer.removeClass('notransition').removeClass('active').removeAttr('style')
    $('.info').removeClass('active')
    $('.truncate').fadeIn(400, 'linear')
    $('.new-label').removeClass('active').removeClass('notransition')
    $('.new-text').removeClass('active').removeClass('notransition')
    $('img.active').removeClass('notransition').removeClass('active')
    setTimeout(removeInfoClass, 1000)
    activeItem = $('body')
    $('.footer').fadeIn()
  }
}

var expandPlot = function () {
  $(this).prev('p').toggleClass('active')
  if ($(this).prev('p').hasClass('active')) {
    $(this).text('less')
  } else {
    $(this).text('more')
  }
}

var switchInfoDiv = function (posterArt, title) {
  var pointer = $('#movie-list').length > 0 ? $('.pointer') : $('.show-pointer')
  $('.truncate').fadeIn(400, 'linear')
  $('.lazy').removeClass('active').removeClass('notransition')
  pointer.removeClass('notransition').removeClass('active')
  $('.new-label').removeClass('active').removeClass('notransition')
  $('.new-text').removeClass('active').removeClass('notransition')
  posterArt.toggleClass('active').addClass('notransition')
  if ($('#movie-list').length > 0) {
    title.hide()
  }
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
  var pointer = $('#movie-list').length > 0 ? $('.pointer') : $('.show-pointer')
  pointer.removeClass('notransition').removeClass('active').removeAttr('style')
  $('.info').removeClass('active')
  $('.truncate').fadeIn(400, 'linear')
  $('.new-label').removeClass('active')
  $('.new-text').removeClass('active')
  $('.lazy').removeClass('notransition').removeClass('active')
  setTimeout(removeInfoClass, 0)
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

var toggleActive = function (event) {
  if ($(this).text() === 'Cancel') {
    $('#edit-show').modal('toggle')
  } else if ($(this).text() === 'OK') {
    var route = $('.show-data').attr('action')
    var type = $('.show-data').hasClass('new-show') ? $('.show-data').attr('method') : 'PUT'
    var data = $('.show-data').serialize() + '&show%5Bposter%5D=' + encodeURIComponent($('input[name="season[poster]"]').val()) + '&form%5Bid%5D=' + $('.edit-container > div > form').attr('id')
    var request = $.ajax({
      url: route,
      type: type,
      data: data
    })
    request.done(function (response) {
      $('.info-wrapper').empty().append(response)
    })
    $('#edit-show').modal('toggle')
  } else if ($(this).attr('id') === 'add-new-episode') {
    var route = $('.show-data').attr('action')
    var type = $('.show-data').hasClass('new-show') ? $('.show-data').attr('method') : 'PUT'
    var data = $('.show-data').serialize() + '&new=true'

    var request = $.ajax({
      url: route,
      type: type,
      data: data
    })
    request.done(function (response) {
      $('#episode').empty().append(response.form)
      if (response.count > 1) {
        $('#edit-show .modal-header p').text('Season ' + response.season + ', ' + response.count + ' episodes added')
      } else {
        $('#edit-show .modal-header p').text('Season ' + response.season + ', ' + response.count + ' episode added')
      }
      $('#show-list').empty().append(response.page)
    })
  } else if ($(this).hasClass('edit-next')) {
    var route = $(this).attr('href')
    var type = $('.show-data').hasClass('new-show') ? $('.show-data').attr('method') : 'PUT'
    var request1 = $.ajax({
      url: route
    })
    var formRoute = $('.show-data').attr('action')
    var data = $('.show-data').serialize() + '&show%5Bposter%5D=' + encodeURIComponent($('input[name="season[poster]"]').val()) + '&form%5Bid%5D=' + $('.edit-container > div > form').attr('id')
    var request2 = $.ajax({
      url: formRoute,
      type: type,
      data: data
    })
    $.when(request1, request2).done(function (r1, r2) {
      $('#edit-show').empty().append(r1)
      $('.info-wrapper').empty().append(r2)
    })
  } else {
    $('button.btn.btn-default.active').toggleClass('active')
    $(this).addClass('active')
    var route = $('.show-data').attr('action')
    var type = $('.show-data').hasClass('new-show') ? $('.show-data').attr('method') : 'PUT'
    var data = $('.show-data').serialize() + '&show%5Bposter%5D=' + encodeURIComponent($('input[name="season[poster]"]').val()) + '&form%5Bid%5D=' + $('.edit-container > div > form').attr('id')
    if (type == 'PUT') {
      var request = $.ajax({
        url: route,
        type: type,
        data: data
      })
      request.done(function (response) {
        $('.info-wrapper').empty().append(response)
      })
    }
  }
}

var deleteEpisode = function (event) {
  var route = $(this).attr('href')
  var request = $.ajax({
    url: route,
    type: 'DELETE'
  })
  request.done(function (response) {
    $('#edit-show').empty().append(response.page)
    $('.footer').empty().append(response.show_count + ' TV Shows &#8212; ' + response.episode_count + ' Episodes')
  })
}

var updatePoster = function (event) {
  var poster = $('input[name="season[poster]"]').val()
  var title = $('textarea[name="show[title]"]').val()
  $('.modal-header img').attr('src', poster)
  $('#edit-show .modal-header h4').text(title)
  $('#artwork > form > img').attr('src', poster)
  $('.description-poster > img').attr('src', poster)
  $('.lazy.active').attr('src', poster)
}

var editShow = function (event) {
  event.preventDefault()
  var route = $(this).attr('href')
  $.get(route, displayShowEditForm)
}

var displayEditForm = function (response) {
  $('.modal-body').replaceWith(response)
  $('.modal-footer').hide()
}

var displayShowEditForm = function (response) {
  $('#edit-show').empty().append(response)
  $('#edit-show').modal('show')
}

var submitUpdate = function (event) {
  event.preventDefault()
  var formRoute = $(this).parent().attr('action')
  var formData = $('#search-movie-title').val().length > 0 ? $(this).parent().serialize() + '&filter=' + filterValue : $(this).parent().serialize() + '&name=' + filterValue
  var response = $.ajax({
    url: formRoute,
    type: 'PUT',
    data: formData,
    success: displayUpdatedMovie
  })
}

var submitPreviewUpdate = function(event) {
  event.preventDefault()
  var formRoute = $(this).attr('action')
  var formData = $('#search-movie-title').val().length > 0 ? $(this).serialize() + '&filter=' + filterValue : $(this).serialize() + '&name=' + filterValue
  var response = $.ajax({
    url: formRoute,
    type: 'PUT',
    data: formData,
    success: displayUpdatedMovie
  })
}

var displayUpdatedMovie = function (response) {
  closeUpdatePreview()
  $('#movie-list').empty().append(response.query)
  var that = $('#' + response.id).parent('div')
  var posterArt = $('#' + response.id).children('img')
  var title = $('#' + response.id).siblings('p')
  var index = $(that).index()
  var itemsPerRow = 7
  var col = (index % itemsPerRow) + 1
  var endOfRow = $('.index-preview').eq(index + itemsPerRow - col)
  if (!endOfRow.length) endOfRow = $('.index-preview').last()
  if ($('.index-preview:hidden').length !== 0) {
  var filteredList = $('#movie-list > div').filter('.index-preview:visible')
    filteredWithInfo(filteredList)
  } else {
    var filteredList = $('#movie-list > div').filter('.index-preview')
    filtered(filteredList)
    endOfRow.after('<div class="info"></div>')
  }
  $(posterArt).toggleClass('active').addClass('notransition')
  if ($('#movie-list').length > 0) {
    title.hide()
  }
  $(that).find('.pointer').toggleClass('active').addClass('notransition')
  $(that).find('.new-label').toggleClass('active').addClass('notransition')
  $(that).find('.new-text').toggleClass('active').addClass('notransition')
  $(that).nextAll('div.info').first().toggleClass('active').addClass('notransition').append('<div class="info-wrapper">' + response.page + '</div>')
}

var deleteMovie = function (event) {
  event.preventDefault()
  var parentForm = $(this).parent().parent().children('form')
  var route = $(parentForm[0]).attr('action')
  var newRoute = $(this).attr('action', route)
  var formRoute = $(newRoute).attr('action')
  var data = $('#search-movie-title').val().length > 0 ? $.param({filter:filterValue}) : $.param({name:filterValue})
  $.ajax({
    url: formRoute,
    type: 'DELETE',
    data: data,
    success: listMovie
  })

  var removePointerClass = function () {
    var pointer = $('#movie-list').length > 0 ? $('.pointer') : $('.show-pointer')
    pointer.removeClass('active').removeAttr('style')
  }
  $('.info').removeClass('active')
  $('.truncate').show()
  $('.lazy').removeClass('active')
  pointer.css('border-top', '#fff').css('border-left', '#fff')
  setTimeout(removePointerClass, 100)

}

var getUser = function (event) {
  event.preventDefault()
  var route = $(this).attr('href')
  var request = $.ajax({
    url: route
  })
  request.done(function(response) {
    $('#nav-toggle').removeClass('active')
    $('#drop-down').removeClass('active')
    $('#drop-down-submenu').removeClass('active')
    $('#user-profile > span.glyphicon.glyphicon-triangle-right').removeClass('active')
    $('#user-page').empty().append(response.page)
    if (response.show_count) {
      $('.footer').empty().append(response.show_count + ' TV Shows &#8212; ' + response.episode_count + ' Episodes')
    } else {
      $('.footer').empty().append(response.movie_count + ' Movies')
    }
  })
}
