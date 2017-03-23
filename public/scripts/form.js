'use strict'

/**
 * form creator
 * @type {object}
 */
var form = {}

/**
 * Create a form table by given props
 * @param {jQuery} container
 * @param {string} formName
 * @param {object} fields
 * @param {function=} onSubmit
 * @param {object=} values
 * @return {jQuery}
 */
form.create = function (container, formName, fields, onSubmit, values) {
  if (!values) values = {}
  var $form = $('<form>').attr('name', formName).attr('onsubmit', 'return false').attr('id', 'form-' + formName)
  for (var fieldName in fields) {
    var field = fields[fieldName]
    var currentValue = gl.getObjectValue(values, fieldName)
    if (typeof currentValue === 'undefined') currentValue = field.defaultValue
    if (typeof currentValue === 'undefined') currentValue = null
    var $input = null
    var $el = $('<div class="form-field type-' + field.type + '" data-name="' + fieldName + '">' +
      '<div class="form-label"></div>' +
      '<div class="form-input"></div>' +
      '</div>')
    if (field.label) {
      $el.find('.form-label').append($('<strong>').text(gl.t(field.label)))
    }
    if (field.description) {
      $el.find('.form-label').append($('<small>').text(gl.t(field.description)))
    }
    switch (field.type) {
      case 'textarea':
        $input = $('<textarea class="form-control autoheight" name="' + fieldName + '">')
        if (currentValue !== null) {
          $input.val(currentValue)
        }
        break
      case 'number':
        $input = $('<input type="number" class="form-control" name="' + fieldName + ':number">')
        if (currentValue !== null) {
          $input.val(currentValue)
        }
        break
      case 'password':
        $input = $('<input type="password" class="form-control" name="' + fieldName + '">')
        if (currentValue !== null) {
          $input.val(currentValue)
        }
        break
      case 'text':
        $input = $('<input type="text" class="form-control" name="' + fieldName + '">')
        if (currentValue !== null) {
          $input.val(currentValue)
        }
        break
      case 'select':
        var name = fieldName
        if (field.multiple) name += '[]'
        $input = $('<select class="form-control" name="' + name + '">')
        if (field.multiple) $input.attr('multiple', true)
        for (var valueKey in field.values) {
          $input.append($('<option>').attr('value', valueKey).text(gl.t(field.values[valueKey])))
        }
        if (currentValue !== null) {
          $input.val(currentValue)
        }
        break
      case 'switch':
        $input = $('<select class="form-control" name="' + fieldName + ':boolean">')
        var fieldValues = ['true', 'false']
        for (var i = 0; i < fieldValues.length; i++) {
          var valueKey1 = fieldValues[i]
          $input.append($('<option>').attr('value', valueKey1).text(gl.t(valueKey1 === 'true' ? 'yes' : 'no')))
        }
        if (currentValue !== null) {
          $input.val(currentValue ? 'true' : 'false')
        }
        break
    }
    if ($input) {
      if (field.pattern) {
        $input.attr('pattern', field.pattern)
      }
      if (field.required) {
        $input.attr('required', true)
      }
      if (field.placeholder) {
        $input.attr('placeholder', gl.t(field.placeholder))
      }
      if (field.attributes) {
        for (var i2 in field.attributes) {
          $input.attr('data-' + i2, field.attributes[i])
        }
      }
      $el.find('.form-input').append($input)
    }
    $form.append($el)
    // if grouped
    if (field.attachTo) {
      var attachTo = $form.find('[name=\'' + field.attachTo + '\']').closest('.form-field')
      if (attachTo.length) {
        if ($input) {
          attachTo.find('.form-input').append($input).addClass('form-group input-group form-inline')
          $el.remove()
        }
      }
    }
  }
  var $btn = $('<div><span data-name="save" data-translate="save" class="btn btn-info submit-form"></span></div>')
  if (Object.keys(values).length) {
    $btn.children().attr('data-translate', 'save.edited')
    $btn.append('&nbsp;<a href="' + window.location.pathname + '" data-translate="cancel.edit" class="btn btn-default page-link"></a>')
  }
  $form.append($btn)
  gl.lang.replaceInHtml($form)
  $form.find(':input').not('button').after('<span class="invalid">')
  container.append($form)
  $form.on('click', '.submit-form', function () {
    var f = $(this).closest('form')
    $form.find('.invalid').removeClass('invalid')
    if (f[0].checkValidity()) {
      var formDataJson = f.serializeJSON()
      onSubmit(formDataJson)
    } else {
      // on validation error trigger a fake submit button to enable validation UI popup
      $(this).after('<input type="submit">')
      $(this).next().trigger('click').remove()
    }
  })
  return $form
}
