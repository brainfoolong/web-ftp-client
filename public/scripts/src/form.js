'use strict'

/**
 * form creator
 * @type {object}
 */
gl.form = {}

/**
 * Create a form table by given props
 * @param {jQuery} container
 * @param {string} formName
 * @param {object} fields
 * @param {function=} onSubmit
 * @param {function=} onCancel
 * @param {object=} values
 * @return {jQuery}
 */
gl.form.create = function (container, formName, fields, onSubmit, onCancel, values) {
  if (!values) values = {}
  container.html('')
  let fieldInputs = {}
  const $form = $('<form>').attr('name', formName).attr('onsubmit', 'return false').attr('id', 'form-' + formName)
  for (let fieldName in fields) {
    const field = fields[fieldName]
    let currentValue = gl.getObjectValue(values, fieldName)
    if (typeof currentValue === 'undefined') currentValue = field.defaultValue
    if (typeof currentValue === 'undefined') currentValue = null
    let $input = null
    const $el = $('<div class="form-field type-' + field.type + '" data-name="' + fieldName + '">' +
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
      case 'file':
        $input = $('<input type="file" class="form-control" name="' + fieldName + '">')
        break
      case 'select':
        let name = fieldName
        if (field.multiple) name += '[]'
        $input = $('<select class="form-control" name="' + name + '">')
        if (field.multiple) $input.attr('multiple', true)
        for (let valueKey in field.values) {
          $input.append($('<option>').attr('value', valueKey).text(gl.t(field.values[valueKey])))
        }
        if (currentValue !== null) {
          $input.val(currentValue)
        }
        break
      case 'switch':
        $input = $('<select class="form-control" name="' + fieldName + ':boolean">')
        const fieldValues = ['true', 'false']
        for (let i = 0; i < fieldValues.length; i++) {
          const valueKey1 = fieldValues[i]
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
        for (let i2 in field.attributes) {
          $input.attr('data-' + i2, field.attributes[i2])
        }
      }
      fieldInputs[fieldName] = $input
      $el.find('.form-input').append($input)
    }
    if (field.showIf) {
      $el.addClass('showif').data('showif', field.showIf)
    }
    $form.append($el)
    // if grouped
    if (field.attachTo) {
      const attachTo = $form.find('[name=\'' + field.attachTo + '\']').closest('.form-field')
      if (attachTo.length) {
        if ($input) {
          attachTo.find('.form-input').append($input).addClass('form-group input-group form-inline')
          $el.remove()
        }
      }
    }
  }
  const $btn = $('<div><span data-name="save" data-translate="save" class="btn btn-info submit-form btn-accept"></span></div>')
  if (Object.keys(values).length) {
    $btn.children().attr('data-translate', 'save.edited')
    $btn.append('&nbsp;<span data-translate="cancel.edit" class="btn btn-default cancel"></span>')
    $btn.find('.cancel').on('click', onCancel)
  }
  $form.append($btn)
  gl.lang.replaceInHtml($form)
  $form.find(':input').not('button').after('<span class="invalid">')
  container.append($form)
  $form.on('click', '.submit-form', function () {
    const f = $(this).closest('form')
    $form.find('.invalid').removeClass('invalid')
    if (f[0].checkValidity()) {
      const formDataJson = f.serializeJSON()
      onSubmit(formDataJson)
    } else {
      // on validation error trigger a fake submit button to enable validation UI popup
      $(this).after('<input type="submit">')
      $(this).next().trigger('click').remove()
    }
  })
  $form.on('change input', function () {
    $form.find('.showif').addClass('hidden').each(function () {
      if ($(this).data('showif')(fieldInputs) === true) {
        $(this).removeClass('hidden')
      }
    })
  }).trigger('change')
  gl.textareaAutoheight($form)
  return $form
}
