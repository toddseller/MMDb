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
  $('#logIn').on('click', '#update-submit', userUpdateSubmit)
  $('#logIn').on('keyup', '#confirm', testPassword)
  $('#logIn').on('change', '#current', deactivateSubmit)
  $('#logIn').on('click', '#myonoffswitch', changeTheme)
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

var activateModal = function (event) {
  event.preventDefault()
  var route = $(this).children('a').attr('href')
  $.get(route, displayMovieModal)
}

var displayMovieModal = function (response) {
  $('#movie .modal-content').empty().append(response)
  $('#movie').modal('show')
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
