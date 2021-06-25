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

let measureButton = {
  Select: function(selected) { $('#measure').parent().toggleClass('selected', selected); },
  IsSelected: function() { return $('#measure').parent().hasClass('selected') }
};
let infoPanel = {
  UpdateMeasure: function(distance, angle, hypDistance) { setDetails(viewerElements[0].viewer, undefined, {distance: distance, angle: angle, hypDistance: hypDistance}); }
};
let faceSelector = null;

window.addEventListener ('load', function() {
  let parent = $('.online_3d_viewer');
  let url = parent.attr('data-base');
  parent.children('.toolbar').append(`<ul id='tb'><li><a href='${parent.attr('model')}'><img src='${url}export.svg' id='export'></a></li><li><img src='${url}measure.svg' id='measure'></li></ul>`);
  $('#measure').on('click', function(e) {
    measureButton.Select(!measureButton.IsSelected());
    if (measureButton.IsSelected()) {
      faceSelector = new OV.FaceSelector(viewerElements[0].viewer, measureButton, infoPanel);
    } else {
      faceSelector.Dispose(); faceSelector = null;
    }
  });
  fieldCache['Model information'] = true;
  $('#details li.mmenu').on('click', function() { $(this).toggleClass('opened'); });
});
let viewerElements = OV.Init3DViewerElements(setDetails);

