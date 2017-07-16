var lastPos = 0
var timeoutId = 0
var filterValue = ''

var bindListeners = function () {
  $('#sign-in-form').on('submit', validate)
  $('.close').on('click', clearForm)
  $('.modal').on('shown.bs.modal', autoFocus)
  $('#menu-toggle').on('click', animateMenu)
  $('#logout').on('click', logout)
  $('#update').on('click', updateUser)
  $('#search-movie-title').on('keyup', function () {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(filterMovies, 300)
  })
  $('.registration #confirm').on('keyup', checkPassword)
  $('#clear-btn').on('click', clearFilter)
  $('#scroll-right').on('click', scrollRight)
  $('#scroll-left').on('click', scrollLeft)
  $('#unwatched').on('click', unwatched)
  $('#library').on('click', clearFilter)
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
  $('#user-page').on('click', '.description-details a', searchByName)
  $('#user-page').on('click', '.studio a', searchByName)
  $('#user-page').on('change', '.hd input:checkbox', toggleHD)
  $('#logIn').on('click', '#update-submit', userUpdateSubmit)
  $('#logIn').on('keyup', '#confirm', testPassword)
  $('#logIn').on('change', '#current', deactivateSubmit)
  $('#logIn').on('click', '#myonoffswitch', changeTheme)
}

var toggleHD = function () {
  if (this.checked) {
    var checkname = $(this).attr("name");
    $("input:checkbox[name='" + checkname + "']").not(this).removeAttr("checked");
  }
}

var filterMovies = function (event) {

  filterValue = $('#search-movie-title').val()
  var id = window.location.href.substr(window.location.href.lastIndexOf('/') + 1)
  var data = $.param({filter:filterValue, id:id})
  var route = '/movies/filter'

  var request = $.ajax({
    url: route,
    data: data
  })
  request.done(function (response) {
    $('#movie-list').empty().append(response)
  })
}

var unwatched = function (evenet) {
  event.preventDefault()

  $('#unwatched').addClass('active')
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
    if ((i + 1) % 7 === 0) {
      $(this).css('margin-right', '0')
    } else {
      $(this).css('margin-right', '2em')
    }
  })
}

var filteredWithInfo = function (array) {
  return $.each(array, function (i) {
    if ((i + 1) % 7 === 0) {
      $(this).css('margin-right', '0')
      $(this).after('<div class="info"></div>')
     } else {
      $(this).css('margin-right', '2em')
     }
    $('#movie-list > .index-preview:last').after('<div class="info"></div>')
  })
 }

var clearFilter = function () {
  var route = window.location.pathname
  $.get(route).done(function (response) {
    $('#profile-wrapper').removeClass('active')
    $('#movie-list').empty().append(response.page)
    $('img.lazy').lazyload()
  })
  $('#filter-input').trigger('reset')
  $('.info').remove()
  $('.pointer').removeClass('notransition').removeClass('active').removeAttr('style')
  $('.truncate').fadeIn(400, 'linear')
  $('.lazy').removeClass('notransition').removeClass('active')
  $('#unwatched').removeClass('active')
  filterValue = ''
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
  $('#preview').empty().slideDown(300, 'linear').append('<div id="loading"><h3>Searching Our Database...</h3><div class="loader"></div></div>').css('display','block')
  $('#dismiss').show()
  $('#scroll-right').hide()
  $('#scroll-left').hide()
}

var previewMovie = function (response) {
  if (response.query.length <= 6) {
    $('#preview').slideDown(300, 'linear')
    $('#dismiss').show()
    $('#scroll-right').hide()
    $('#preview').empty().append(response.page).css({'display':'flex', 'justify-content': 'center'})
  } else {
    $('#preview').slideDown(300, 'linear')
    $('#dismiss').show()
    $('#preview').scroll(addArrow)
    $('#preview').empty().append(response.page).css({'display':'flex', 'justify-content': 'space-between'})
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

var searchByName = function (event) {
  event.preventDefault()

  $('#filter-input').trigger('reset')

  filterValue = $(this).text()
  var id = window.location.href.substr(window.location.href.lastIndexOf('/') + 1)
  var data = $.param({filter:filterValue, id:id})
  var route = '/movies/search'

  var request = $.ajax({
    url: route,
    data: data
  })
  request.done(function (response) {
    console.log(response.url)
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
    $('#dismiss').hide()
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
    $('img.lazy').lazyload()
  }
}

var closePreview = function (event) {
  event.preventDefault()
  $('#preview').slideUp(300, 'linear')
  $('#dismiss').hide()
  $('#scroll-right').hide()
  $('#scroll-left').hide()
  $('#add').show()
  $('#search').hide()
  $('#search-year').hide()
  $('#search-title').css('right', '0')
  $('.input-group-btn').css('top', '0')
  $('#movie-list').css('top', '0')
  $('#more').show()
}

var first = true

var getMovieModal = function (event) {
  event.preventDefault()

  var user = $(this).parent().attr('id')
  var movieId = $(this).attr('id')
  var route = '/users/' + user + '/movies/' + movieId
  var that = $(this).parent('div')
  var posterArt = $(this).children('img')
  var title = $(this).siblings('p')
  var index = $(that).index()
  var itemsPerRow = 7
  var col = (index % itemsPerRow) + 1
  var endOfRow = $('.index-preview').eq(index + itemsPerRow - col)
  if (!endOfRow.length) endOfRow = $('.index-preview').last()

  if (title.is(':visible')) {
    var request = $.ajax({
      url: route
    })
    request.done(function (response) {
      if ($('#movie-list > div').hasClass('info')) {
        $('.info').remove()
        switchInfoDiv(posterArt, title)
        endOfRow.after('<div class="info"></div>')
        $(that).nextAll('div.info').toggleClass('active').append('<div class="info-wrapper">' + response + '</div>')
        $(that).find('.pointer').addClass('notransition').addClass('active')
        $(that).find('.new-label').addClass('active').addClass('notransition')
        $(that).find('.new-text').addClass('active').addClass('notransition')
      } else {
        var filteredList = $('#movie-list > div').filter('.index-preview')
        filtered(filteredList)
        endOfRow.after('<div class="info"></div>')
        $(posterArt).toggleClass('active')
        $(title).hide()
        $(that).find('.pointer').toggleClass('active')
        $(that).find('.new-label').toggleClass('active')
        $(that).find('.new-text').toggleClass('active')
        $(that).nextAll('div.info').first().toggleClass('active').append('<div class="info-wrapper">' + response + '</div>')
      }
    })
  } else {
    var removeInfoClass = function () {
      $('.info').remove()
    }
    $('.pointer').removeClass('notransition').removeClass('active').removeAttr('style')
    $('.info').removeClass('active')
    $('.truncate').fadeIn(400, 'linear')
    $('.new-label').removeClass('active').removeClass('notransition')
    $('.new-text').removeClass('active').removeClass('notransition')
    $('.lazy').removeClass('notransition').removeClass('active')
    setTimeout(removeInfoClass, 1000)
  }
}

var switchInfoDiv = function (posterArt, title) {
  $('.truncate').fadeIn(400, 'linear')
  $('.lazy').removeClass('active').removeClass('notransition')
  $('.pointer').removeClass('notransition').removeClass('active')
  $('.new-label').removeClass('active').removeClass('notransition')
  $('.new-text').removeClass('active').removeClass('notransition')
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
  console.log(response)
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
  var formData = $(this).parent().serialize() + '&filter=' + filterValue
  var response = $.ajax({
    url: formRoute,
    type: 'PUT',
    data: formData,
    success: displayUpdatedMovie
  })
}

var displayUpdatedMovie = function (response) {
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
  $(title).hide()
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
  var data = $.param({filter:filterValue})
  $.ajax({
    url: formRoute,
    type: 'DELETE',
    data: data,
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
