
function setDetails(viewer, measure) {
  let box = viewer.GetBoundingBox(function(mesh){return "originalMeshIndex" in mesh}).getSize();

  $('#details').empty().append(`<div><span>Dimensions</span><span>${box.x.toFixed(1)} x ${box.y.toFixed(1)} x ${box.z.toFixed(1)}</span></div>`);
  if (measure && measure.distance !== null) {
    $('#details').append(`<div><span>Distance</span><span>${measure.hypDistance.toFixed(2)}</span></div>`);
    $('#details').append(`<div><span>Angle</span><span>${(measure.angle * 180 / Math.PI).toFixed(2)}°</span></div>`);
    $('#details').append(`<div><span>Between planes</span><span>${measure.distance.toFixed(2)}</span></div>`);
  }
}

let measureButton = {
  Select: function(selected) { $('#measure').parent().toggleClass('selected', selected); },
  IsSelected: function() { return $('#measure').parent().hasClass('selected') }
};
let infoPanel = {
  UpdateMeasure: function(distance, angle, hypDistance) { setDetails(viewerElements[0].viewer, {distance: distance, angle: angle, hypDistance: hypDistance}); }
};
let faceSelector = null;

window.addEventListener ('load', function() {
  let url = '/user/plugins/viewer3-d/assets/img/';
  let parent = $('.online_3d_viewer');
  parent.children('.toolbar').append(`<ul id='tb'><li><a href='${parent.attr('model')}'><img src='${url}export.svg' id='export'></a></li><li><img src='${url}measure.svg' id='measure'></li></ul>`);
  parent.children('.details').append(`<div id='details'></div>`);
  $('#measure').on('click', function(e) {
    measureButton.Select(!measureButton.IsSelected());
    if (measureButton.IsSelected()) {
      faceSelector = new OV.FaceSelector(viewerElements[0].viewer, measureButton, infoPanel);
    } else {
      faceSelector.Dispose(); faceSelector = null;
    }
  });
});
let viewerElements = OV.Init3DViewerElements(setDetails);

