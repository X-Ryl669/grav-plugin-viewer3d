let volume = 0;
let boundingBox = {x: 0, y: 0, z: 0};
let units = {len:['m', 'dm', 'cm', 'mm'], weight:['kg','dg','cg', 'g']};
let unit = 3; // mm
let filSize = 1.75; //mm
let filamentSizes = [1.75, 3]; //mm
let densities = { PLA: 1.3, PETG: 1.38, ABS: 1, TPU: 1.21 }; // g/cm3
let plasticType = 'PLA';
let density = 1.3; // g/cm3
let fieldCache = {};

function slugify(text, separator = "-") {
    return text
        .toString()
        .normalize('NFD')                   // split an accented letter in the base letter and the acent
        .replace(/[\u0300-\u036f]/g, '')   // remove all previously split accents
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 ]/g, '')   // remove all chars not letters, numbers and spaces (to be replaced)
        .replace(/\s+/g, separator);
}

function makeId(name, base='sec_') { return slugify(base + name); }

function addCombo(section, name, choices, values, def, cb) {
  let selName = makeId(name, 'sel_');
  $('#'+makeId(section)+ ' details').append(`<div><span>${name}</span><span><select id='${selName}'></select></span></div>`);
  let select = $('#'+selName);
  for (let i = 0; i < choices.length; i++)
    select.append(`<option value=${values[i]} ${def == values[i] ? 'selected="selected"' : ''}>${choices[i]}</option>`);
  select.on('change', cb);
}

function addSection(name) {
  let opened = fieldCache[name] && fieldCache[name] === true;
  $('#details').append(`<li id='${makeId(name)}'><details ${opened?'open': ''}><summary>${name}</summary></details></li>`);
  $('#'+makeId(name)+' details').on('toggle', function() { fieldCache[name] = $(this).prop('open'); });
}

function addField(section, name, value) {
  $('#'+makeId(section)+' details').append(`<div><span>${name}</span><span ${fieldCache[name] && fieldCache[name] != value ? "class='transition'" : ""}>${value}</span></div>`);
  fieldCache[name] = value;
}

function buildInfo(setting = false) {
  $('#details li:not(.mmenu)').remove();
  addSection('Settings', setting);
  addCombo('Settings', 'Length unit', units.len, Array.from(Array(units.len.length).keys()), unit, function(e) { unit = $(e.target).val(); buildInfo(true); });
  addCombo('Settings', 'Plastic type', Object.keys(densities), Object.keys(densities), plasticType, function(e) { plasticType = $(e.target).val(); density = densities[$(e.target).val()]; buildInfo(true); });
  addCombo('Settings', 'Filament diameter', filamentSizes, filamentSizes, filSize, function(e) { filSize = $(e.target).val(); buildInfo(true); });
  addSection('Model information');
  addField('Model information', 'Dimensions', `${makeDim(boundingBox.x, 'l')} x ${makeDim(boundingBox.y, 'l')} x ${makeDim(boundingBox.z, 'l')}`);
  if (volume !== 0) {
    addField('Model information', 'Volume', makeDim(volume, 'v'));
    addField('Model information', 'Weight', makeDim(computeWeight(), 'g'));
    addField('Model information', 'Filament length', makeDim(computeFilLen(), 'l', 3));
  }
  setTimeout(function(){$('#details .transition').removeClass('transition').addClass('fade');}, 10);
  
}

function makeDim(v, type, _unit) {
  _unit = _unit ? _unit : unit;
  switch(type) {
  case 'l': {
    let baseUnit = Math.pow(10, 3 - _unit);
    v = v * baseUnit;
    let u = 3; //mm
    while (u > 0) {
      if (v < 10) break;
      v /= 10; u--;
    }
    return v.toFixed(2) + ' ' + units.len[u];
  }
  case 'v': {
    let baseUnit = Math.pow(10, (3 - _unit) * 3);
    v = v * baseUnit;
    let u = 3; //mm3
    while (u > 0) {
      if (v < 1000) break;
      v /= 1000; u--;
    }
    return v.toFixed(2) + ' ' + units.len[u] + '<sup>3</sup>';
  }
  case 'g':
    if (v > 1000) return (v/1000).toFixed(3) + ' kg';
    return v.toFixed(3) + ' g';
  case '°':
    return (v * 180 / Math.PI).toFixed(2)+' °';
  default: return v.toFixed(2);
  }
}

function computeWeight() {
  let baseUnit = Math.pow(10, (3 - unit) * 3);
  let v = volume * baseUnit; //mm3
  return density * (v / 1000);
}

function computeFilLen() {
  let baseUnit = Math.pow(10, (3 - unit) * 3);
  let v = volume * baseUnit; //mm3
  let filArea = Math.pow(filSize/2, 2) * Math.PI;
  return v / filArea;
}

function setDetails(viewer, importResult, measure) {
  if ($('#details').length === 0) return;
  if (boundingBox.x === 0) {
    let box = viewer.GetBoundingBox(function(mesh){return "originalMeshIndex" in mesh}).getSize();
    boundingBox.x = box.x; boundingBox.y = box.y; boundingBox.z = box.z;
  }
  if (importResult) volume = OV.CalculateVolume (importResult.model);
  let hasMeasure = (measure && measure.distance !== null);
  buildInfo(!hasMeasure);
  if (hasMeasure) {
    fieldCache['Measure'] = true;
    addSection('Measure');
    addField('Measure', 'Point to point distance', makeDim(measure.hypDistance, 'l'));
    addField('Measure', 'Angle', makeDim(measure.angle, '°'));
    addField('Measure', 'Plane to plane distance', makeDim(measure.distance, 'l'));
  }
  $('#details li.mmenu').addClass('opened');
}

function Button(id) {
  this.obj = $('#'+id);
  this.Select = function(selected) { this.obj.parent().toggleClass('selected', selected); };
  this.IsSelected = function() { return this.obj.parent().hasClass('selected'); };
}
let infoPanel = {
  UpdateMeasure: function(distance, angle, hypDistance) { setDetails(viewerElements[0].viewer, undefined, {distance: distance, angle: angle, hypDistance: hypDistance}); }
};
let faceSelector = null;
let cutPlane = null;
let measureButton = null;
let cutButton = null;
function clearButtons(button) {
  if (cutPlane !== null) cutPlane.Dispose();
  if (faceSelector !== null) faceSelector.Dispose();
  cutPlane = faceSelector = null;
  if (button != measureButton && measureButton) measureButton.Select(false);
  if (button != cutButton && cutButton) cutButton.Select(false);
}

function Slider(min, max, cb) {
  this.onInput = cb;
  this.min = min;
  this.max = max;
  this.element = null;
  this.CreateDomElement = function(parent) {
    this.element = $(`<input type='range' min='${this.min}' max='${this.max}' id='depthSlider'>`).appendTo(parent);
    let onInput = this.onInput;
    this.element.on('input', function(e) { if (onInput !== null) onInput(Number.parseFloat(e.target.value)); });
  }
  this.Dispose = function() { if (this.element !== null) this.element.remove(); }
}

window.addEventListener ('load', function() {
  let parent = $('.online_3d_viewer');
  if ($('#measure').length) {
    measureButton = new Button('measure');

    $('#measure').on('click', function(e) {
      measureButton.Select(!measureButton.IsSelected());
      clearButtons(measureButton);
      if (measureButton.IsSelected()) {
        faceSelector = new OV.FaceSelector(viewerElements[0].viewer, measureButton, infoPanel);
      }
    });
  }
  if ($('#cut').length) {
    cutButton = new Button('cut');
    $('#cut').on('click', function(e) {
      cutButton.Select(!cutButton.IsSelected());
      clearButtons(cutButton);
      if (cutButton.IsSelected()) {
        cutPlane = new OV.CutPlane(viewerElements[0].viewer, parent, Slider);
      }
    });
  }
  fieldCache['Model information'] = true;
  if ($('#details').length)
    $('#details li.mmenu').on('click', function() { $(this).toggleClass('opened'); });
});
let viewerElements = OV.Init3DViewerElements(setDetails);

