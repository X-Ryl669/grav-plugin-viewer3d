let units = {len:['m', 'dm', 'cm', 'mm'], weight:['kg','dg','cg', 'g']};
let filamentSizes = [1.75, 3]; //mm
let densities = { PLA: 1.3, PETG: 1.38, ABS: 1, TPU: 1.21 }; // g/cm3



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

function Slider(min, max, cb) {
  this.onInput = cb;
  this.min = min;
  this.max = max;
  this.element = null;
  this.CreateDomElement = function(parent) {
    this.element = $(`<input type='range' min='${this.min}' max='${this.max}' class='depthSlider'>`).appendTo(parent);
    let onInput = this.onInput;
    this.element.on('input', function(e) { if (onInput !== null) onInput(Number.parseFloat(e.target.value)); });
  }
  this.Dispose = function() { if (this.element !== null) this.element.remove(); }
}

Button = class {
  constructor(name, viewer) {
    this.obj = viewer.parent.querySelector('.'+name);
    this.Select = function(selected) { this.obj.parentNode.classList.toggle('selected', selected); };
    this.IsSelected = function() { return this.obj.parentNode.classList.contains('selected'); };
  }
}

Viewer = class {

  constructor(parent, index) {
    this.index = index;
    this.parent = parent;
    this.faceSelector = null;
    this.cutPlane = null;
    this.measureButton = null;
    this.cutButton = null;
    this.infoPanel = null;
    this.boundingBox = {x: 0, y: 0, z: 0};
    this.volume = 0;
    this.unit = 3; // mm
    this.filSize = 1.75; //mm
    this.plasticType = 'PLA';
    this.density = 1.3; // g/cm3
    this.fieldCache = {};
  }

  RegisterViewer(viewer) {
    this.infoPanel = { UpdateMeasure: function(distance, angle, hypDistance) { setDetails(viewer, undefined, {distance: distance, angle: angle, hypDistance: hypDistance}); } };
  }

  clearButtons(button) {
    if (this.cutPlane !== null) this.cutPlane.Dispose();
    if (this.faceSelector !== null) this.faceSelector.Dispose();
    this.cutPlane = this.faceSelector = null;
    if (button != this.measureButton && this.measureButton !== null) this.measureButton.Select(false);
    if (button != this.cutButton && this.cutButton !== null) this.cutButton.Select(false);
  }

  addButton(name, clickCb) {
    if (document.querySelector(this.Sel(name))) {
      this[name+'Button'] = new Button(name, this);
      let button = this[name+'Button'];
      let that = this;
      button.obj.addEventListener('click', function(e) {
        button.Select(!button.IsSelected());
        that.clearButtons(button);
        if (button.IsSelected()) clickCb(button, that);
      });
    }
  }


  Sel(sel) {
    return `#${this.parent.id} .${sel}`;
  }

  MakeUniqId(name, base='') {
    return makeId(name, this.parent.id + '_' + base);
  }

  Menu() { return $(this.Sel('details') + ' li.mmenu'); }


  addCombo(section, name, choices, values, def, cb) {
    let selName = this.MakeUniqId(name, 'sel_');
    $(`#${this.MakeUniqId(section)} details`).append(`<div><span>${name}</span><span><select id='${selName}'></select></span></div>`);
    let select = $('#'+selName);
    for (let i = 0; i < choices.length; i++)
      select.append(`<option value=${values[i]} ${def == values[i] ? 'selected="selected"' : ''}>${choices[i]}</option>`);
    select.on('change', cb.bind(this));
  }

  addSection(name) {
    let opened = this.fieldCache[name] && this.fieldCache[name] === true;
    let fc = this.fieldCache;
    $(this.Sel('details')).append(`<li id='${this.MakeUniqId(name)}'><details ${opened?'open': ''}><summary>${name}</summary></details></li>`);
    $(`#${this.MakeUniqId(name)} details`).on('toggle', function() { fc[name] = $(this).prop('open'); });
  }

  addField(section, name, value) {
    $(`#${this.MakeUniqId(section)} details`).append(`<div><span>${name}</span><span ${this.fieldCache[name] && this.fieldCache[name] != value ? "class='transition'" : ""}>${value}</span></div>`);
    this.fieldCache[name] = value;
  }

  buildInfo(setting = false) {
    $(this.Sel('details')+ ' li:not(.mmenu)').remove();
    this.addSection('Settings', setting);
    this.addCombo('Settings', 'Length unit', units.len, Array.from(Array(units.len.length).keys()), this.unit, function(e) { this.unit = $(e.target).val(); this.buildInfo(true); });
    this.addCombo('Settings', 'Plastic type', Object.keys(densities), Object.keys(densities), this.plasticType, function(e) { this.plasticType = $(e.target).val(); this.density = densities[$(e.target).val()]; this.buildInfo(true); });
    this.addCombo('Settings', 'Filament diameter', filamentSizes, filamentSizes, this.filSize, function(e) { this.filSize = $(e.target).val(); this.buildInfo(true); });
    this.addSection('Model information');
    this.addField('Model information', 'Dimensions', `${makeDim(this.boundingBox.x, 'l', this.unit)} x ${makeDim(this.boundingBox.y, 'l', this.unit)} x ${makeDim(this.boundingBox.z, 'l', this.unit)}`);
    if (this.volume !== 0) {
      this.addField('Model information', 'Volume', makeDim(this.volume, 'v', this.unit));
      this.addField('Model information', 'Weight', makeDim(this.computeWeight(), 'g', this.unit));
      this.addField('Model information', 'Filament length', makeDim(this.computeFilLen(), 'l', 3));
    }
    let transition = this.Sel('details') + ' .transition';
    setTimeout(function(){$(transition).removeClass('transition').addClass('fade');}, 10);
  }

  computeWeight() {
    let baseUnit = Math.pow(10, (3 - this.unit) * 3);
    let v = this.volume * baseUnit; //mm3
    return this.density * (v / 1000);
  }

  computeFilLen() {
    let baseUnit = Math.pow(10, (3 - this.unit) * 3);
    let v = this.volume * baseUnit; //mm3
    let filArea = Math.pow(this.filSize/2, 2) * Math.PI;
    return v / filArea;
  }



};

let viewers = [];


function setDetails(v, importResult, measure) {
  // Need to find the viewer in the array
  let viewer = null;
  for (let i = 0; i < viewers.length; i++) {
    if (viewerElements[i].viewer == v) {
      viewer = viewers[i];
      break;
    }
  }
  if (viewer === null) return;
  if (importResult !== undefined) viewer.RegisterViewer(v);

  if ($(viewer.Sel('details')).length === 0) return;
  if (viewer.boundingBox.x === 0) {
    let box = v.GetBoundingBox(function(mesh){return "originalMeshIndex" in mesh}).getSize();
    viewer.boundingBox.x = box.x; viewer.boundingBox.y = box.y; viewer.boundingBox.z = box.z;
  }
  if (importResult) viewer.volume = OV.CalculateVolume (importResult.model);
  let hasMeasure = (measure && measure.distance !== null);
  viewer.buildInfo(!hasMeasure);
  if (hasMeasure) {
    viewer.fieldCache['Measure'] = true;
    viewer.addSection('Measure');
    viewer.addField('Measure', 'Point to point distance', makeDim(measure.hypDistance, 'l', viewer.unit));
    viewer.addField('Measure', 'Angle', makeDim(measure.angle, '°', viewer.unit));
    viewer.addField('Measure', 'Plane to plane distance', makeDim(measure.distance, 'l', viewer.unit));
  }
  viewer.Menu().addClass('opened');
}

window.addEventListener ('load', function() {
  let parent = $('.online_3d_viewer');
  parent.each(function(i, p) {
    let viewer = new Viewer(p, i);
    viewer.addButton('measure', function(b, v) { v.faceSelector = new OV.FaceSelector(viewerElements[v.index].viewer, b, v.infoPanel); });
    viewer.addButton('cut', function(b, v) { v.cutPlane = new OV.CutPlane(viewerElements[v.index].viewer, p, Slider); });
    viewer.fieldCache['Model information'] = true;
    if ($(viewer.Sel('details')).length)
      viewer.Menu().on('click', function() { $(this).toggleClass('opened'); });
    viewers.push(viewer);
  });
});
let viewerElements = OV.Init3DViewerElements(setDetails);

