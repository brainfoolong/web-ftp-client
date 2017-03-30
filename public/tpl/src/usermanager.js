'use strict';
(function () {
  const $tpl = $('.template-usermanager')
  const $tree = $tpl.find('.tree')
  let users = {}
  let editId = null
  const loadForm = function (values) {
    const forms = {
      'general': {
        'username': {'type': 'text', 'label': 'username', 'required': true},
        'password': {
          'type': 'password',
          'label': 'password',
          'description': 'password.description',
          'required': !editId
        },
        'admin': {'type': 'switch', 'label': 'administrator', 'description': 'administrator.description'},
        'loginHash': {
          'type': 'text',
          'label': 'loginhash',
          'description': 'loginhash.description',
          'showIf': function () {
            return !!editId
          }
        }
      }
    }
    for (let i in forms) {
      const $form = $('.template-usermanager .form-' + i)
      $form.html('')
      gl.form.create($form, 'server-' + i, forms[i], function () {
        const formData = {}
        $tpl.find('.form form').each(function () {
          $.extend(formData, $(this).serializeJSON())
        })
        gl.socket.send('usermanagerFormSubmit', {'formData': formData, 'id': editId}, function (result) {
          if (result === true) {
            gl.note(gl.t('saved'), 'success')
            gl.splitbox.tabReload()
          } else {
            gl.note(gl.t('administrator.missing'), 'danger')
          }
        })
      }, function () {
        gl.splitbox.tabReload()
      }, values)
    }
  }
  const loadUsers = function () {
    gl.socket.send('getUsers', null, function (userlist) {
      users = userlist
      $tree.find('.entry').not('.boilerplate').remove()
      for (let userIndex in users) {
        if (users.hasOwnProperty(userIndex)) {
          let userRow = users[userIndex]
          let $entry = $tree.find('.boilerplate').clone()
          $entry.removeClass('boilerplate')
          $entry.find('.name').text(userRow.username)
          $entry.find('.administrator').text(userRow.admin ? gl.t('administrator') : '')
          $entry.attr('data-id', userRow.id)
          $tree.append($entry)
        }
      }
    })
  }

  $tpl.on('click', '.user-add', function () {
    editId = null
    loadForm()
  }).on('click', '.tree .entry', function () {
    $tree.find('.entry').removeClass('active')
    $(this).addClass('active')
    editId = $(this).attr('data-id')
    loadForm(users[$(this).attr('data-id')])
  }).on('click', '.tree .glyphicon-remove', function (ev) {
    ev.stopPropagation()
    const $e = $(this).closest('.entry')
    const userId = $e.attr('data-id')
    gl.modalConfirm(gl.t('sure'), function (result) {
      if (result === true) {
        gl.socket.send('removeUser', {'userId': userId}, function (result) {
          if (result === true) {
            $e.remove()
          } else {
            gl.note('administrator.missing', 'danger')
          }
        })
      }
    })
  })
  loadForm()
  loadUsers()
})()
