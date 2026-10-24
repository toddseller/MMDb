// Also written by public/js/mmdb/filters.js and credits.js; stays until the jQuery code that reads it moves to modules.
var filterValue = ''

var bindListeners = function () {
  $('#sign-in-form').on('submit', validate)
  $('.close').on('click', clearForm)
  $('.modal').on('shown.bs.modal', autoFocus)
  $('#menu-toggle').on('click', animateMenu)
  $('#logout').on('click', logout)
  $('#update').on('click', updateUser)
  $('.registration #confirm').on('keyup', checkPassword)
  $('#user-profile').on('click', toggleProfile)
  $('#user-shows').on('click', getUser)
  $('#user-movies').on('click', getUser)
}

var dynamicListener = function () {
  $(document).on('click', '#user-movies', getUser)
  $(document).on('click', '#user-shows', getUser)
  $('#user-page').on('click', '.top-preview', activateModal)
  $('#user-page').on('click', '#create-new', createShow)
  $('#user-page').on('click', '.movie-edit', editMovie)
  $('#user-page').on('click', '.show-edit', editShow)
  $('#user-page').on('click', '#edit-button', submitUpdate)
  $('#user-page').on('click', '#delete-button', deleteMovie)
  $('#user-page').on('click', '#update-search', updateDatabase)
  $('#user-page').on('click', '#update-movie', submitPreviewUpdate)
  $('#user-page').on('click', '.rating-input', ratingSubmit)
  $('#user-page').on('change', '.hd input:checkbox', toggleHD)
  $('#user-page').on('click', '.season-submit', seasonDefault)
  $('#logIn').on('click', '#update-submit', userUpdateSubmit)
  $('#logIn').on('keyup', '#confirm', testPassword)
  $('#logIn').on('change', '#current', deactivateSubmit)
  $('#logIn').on('click', '#myonoffswitch', changeTheme)
  $('#edit-show').on('click', 'button', toggleActive)
  $('#edit-show').on('change', 'input[name="season[poster]"]', updatePoster)
  $('#edit-show').on('change', 'input[name="artwork"]', uploadArtwork)
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

var updateDatabase = function (event) {
  event.preventDefault()
  var data = {title: $('#movie_title').text(), route: $('.edit-form').attr('action')}
  window.preview.search('/movies/update?' + $.param(data))
}

var createShow = function (event) {
  event.preventDefault()
  var id = $('.index-preview') > 0 ? $('.index-preview').attr('id') : window.sessionStorage.id
  var route = '/users/' + id + '/shows/new'
  $.get(route, displayCreateShow)
}

var displayCreateShow = function (response) {
  window.preview.close()
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
    if (window.drawer.tile) $(window.drawer.tile).find('img').attr('src', response.poster)
  })
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

var uploadArtwork = function (event) {
  var input = this
  var message = $('#artwork .artwork-message').text('Uploading...')
  var data = new FormData()
  data.append('artwork', input.files[0])
  var request = $.ajax({
    url: $(input).data('upload'),
    type: 'POST',
    data: data,
    processData: false,
    contentType: false
  })
  request.done(function (response) {
    message.text('')
    $('input[name="season[poster]"]').val(response.url).trigger('change')
  })
  request.fail(function (xhr) {
    var error
    // jQuery 1.9 has no responseJSON, and a 401 or proxy error may not be JSON at all.
    try { error = $.parseJSON(xhr.responseText).error } catch (e) {}
    message.text(error || "The artwork couldn't be uploaded. Try again.")
  })
  request.always(function () { input.value = '' })
}

var editShow = function (event) {
  event.preventDefault()
  var route = $(this).attr('href')
  $.get(route, displayShowEditForm)
}

var displayEditForm = function (response) {
  window.preview.close()
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
    success: displayEditForm
  })
}

var displayUpdatedMovie = function (response) {
  window.drawer.close(true)
  $('#movie-list').empty().append(response.query)
  window.drawer.open($('#' + response.id).parent('div')[0], response.page, true)
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
    success: function (response) {
      if (response.status !== 'true') return
      $('#movie-list').empty().append(response.page)
      $('.footer').empty().append(response.movie_count + ' Movies').fadeIn()
    }
  })
  window.drawer.close()
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
