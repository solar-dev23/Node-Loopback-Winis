'use strict';

let trim = require('string.prototype.trim');
let phone = require('phone');
let assign = require('object.assign');
let forms = require('forms');
let is = require('is');
let fields = forms.fields;

exports.bootstrapField = function(name, object) {
  // let label, widget;

  // if (!Array.isArray(object.widget.classes)) { object.widget.classes = []; }

  // let validationClass = object.value && !object.error ? 'has-success' : '';
  // validationClass = object.error ? 'has-error' : validationClass;

  // let error = object.error ? '<div class="alert alert-error help-block">' + object.error + '</div>' : '';

  // switch (object.widget.type) {
  //   case 'checkbox':
  //     widget = object.widget.toHTML(name, object);
  //     return '<div class=' + object.widget.type + ' ' + validationClass + '"><label>' + widget + object.labelText(name) + '</label>' + error + '</div>';
  //   case 'multipleRadio':
  //     label = object.labelHTML(name);
  //     widget = object.widget.toHTML(name, object);
  //     return '<div class=' + object.widget.type + ' ' + validationClass + '">' + label + widget + error + '</div>';
  //   default:
  //     if (object.widget.classes.indexOf('form-control') === -1) {
  //       object.widget.classes.push('form-control');
  //     }

  //     label = object.labelHTML(name);

  //     widget = object.widget.toHTML(name, object);
  //     return '<div class="form-group ' + validationClass + '">' + label + widget + error + '</div>';
  // }
};

exports.validators = {};
exports.validators.tags = function(limit) {
  // limit = limit || 5;

  // return function(form, field, callback) {
  //   let tags = field.value.split(',');

  //   if (tags.length > limit) {
  //     callback('Advert cannot have more than ' + limit + ' tags');
  //   } else {
  //     callback();
  //   }
  // };
};

exports.validators.phone = function() {
  // return function(form, field, callback) {
  //   let phoneDetails = phone(field.value);
  //   if (phoneDetails.length > 0) {
  //     return callback();
  //   } else {
  //     return callback('Failed validating phone number');
  //   }
  // };
};

exports.validators.address = function() {
  // let validator = function(form, field, callback) {
  //   if (form.fields.useAddress.data && trim(field.data || '').length === 0) {
  //     callback('Address must be entered when enabled');
  //   } else {
  //     callback();
  //   }
  // };
  // validator.forceValidation = true;
  // return validator;
};

exports.widgets = {};
exports.widgets.tags = function(opt) {
  // opt = opt || {};
  // let w = {
  //   classes: opt.classes || [],
  //   pattern: opt.pattern || [],
  //   type: 'tags',
  // };
  // w.toHTML = function(name, f) {
  //   f = f || {};
  //   let html = '<input type="tags"';
  //   html += ' name="' + name + '"';
  //   html += ' id=' + (f.id ? '"' + f.id + '"' : '"id_' + name + '"');
  //   html += w.classes.length > 0 ? ' class="' + w.classes.join(' ') + '"' : '';
  //   html += ' value="' + f.data + '"';
  //   return html + ' />';
  // };
  // w.formatValue = function(value) {
  //   return value.split(',');
  // };
  // return w;
};

exports.fields = {};
exports.fields.tags = function(opt) {
  // let opts = assign({}, opt);
  // let f = fields.string(opts);
  // f.parse = function(raw_data) {
  //   if (is.array(raw_data)) {
  //     return raw_data.join(',');
  //   } else {
  //     return raw_data.split(',');
  //   }
  // };
  // return f;
};
