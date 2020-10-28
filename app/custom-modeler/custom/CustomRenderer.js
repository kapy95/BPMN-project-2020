import inherits from 'inherits';
import Cat from '../cat';
import Cat2 from '../cat2'
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import textRenderer from './TextRenderer'
import {
  isTypedEvent,
  isThrowEvent,
  isCollection,
  getDi,
  getSemantic,
  getCirclePath,
  getRoundRectPath,
  getDiamondPath,
  getRectPath,
  getFillColor,
  getStrokeColor
} from './BpmnRenderUtil';


import {
  componentsToPath,
  createLine
} from 'diagram-js/lib/util/RenderUtil';

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  innerSVG
} from 'tiny-svg';

var fs = require('fs');

var COLOR_GREEN = '#52B415',
    COLOR_RED = '#cc0000',
    COLOR_YELLOW = '#ffc800';

/**
 * A renderer that knows how to render custom elements.
 */
export default function CustomRenderer(eventBus, styles) {

  BaseRenderer.call(this, eventBus, 2000);

  var computeStyle = styles.computeStyle;

  function renderLabel(parentGfx, label, options) {

    options = assign({
      size: {
        width: 100
      }
    }, options);

    var text = textRenderer.createText(label || '', options);

    svgClasses(text).add('djs-label');

    svgAppend(parentGfx, text);

    return text;
  }

  function renderEmbeddedLabel(parentGfx, element, align) {
    var semantic = getSemantic(element);

    return renderLabel(parentGfx, semantic.name, {
      box: element,
      align: align,
      padding: 5,
      style: {
        fill: getStrokeColor(element, defaultStrokeColor)
      }
    });
  }

  function renderExternalLabel(parentGfx, element) {

    var box = {
      width: 90,
      height: 30,
      x: element.width / 2 + element.x,
      y: element.height / 2 + element.y
    };

    return renderLabel(parentGfx, getLabel(element), {
      box: box,
      fitBox: true,
      style: assign(
        {},
        textRenderer.getExternalStyle(),
        {
          fill: getStrokeColor(element, defaultStrokeColor)
        }
      )
    });
  }

  function renderLaneLabel(parentGfx, text, element) {
    var textBox = renderLabel(parentGfx, text, {
      box: {
        height: 30,
        width: element.height
      },
      align: 'center-middle',
      style: {
        fill: getStrokeColor(element, defaultStrokeColor)
      }
    });

    var top = -1 * element.height;

    transform(textBox, 0, -top, 270);
  }

  function as(type) {
    return function(parentGfx, element) {
      return handlers[type](parentGfx, element);
    };
  }

  function renderer(type) {
    return handlers[type];
  }

  function renderEventContent(element, parentGfx) {

    var event = element.type;
    var isThrowing = isThrowEvent(event);

    if (event==='custom:nyanCat') {
      return renderer('custom:nyanCat')(parentGfx, element, isThrowing);
    }
    return null;
  }

  var handlers = this.handlers = {
    'custom:nyanCat': function(parentGfx,element){
       var cat =this.drawNyanCat(parentGfx,element)
       renderEventContent(element, parentGfx);
      return cat
    }
  }


  //---------------------------------------------------------------------
  this.drawTriangle = function(p, side) {
    var halfSide = side / 2,
        points,
        attrs;

    points = [ halfSide, 0, side, side, 0, side ];

    attrs = computeStyle(attrs, {
      stroke: COLOR_GREEN,
      strokeWidth: 2,
      fill: COLOR_GREEN
    });

    var polygon = svgCreate('polygon');

    svgAttr(polygon, {
      points: points
    });

    svgAttr(polygon, attrs);

    svgAppend(p, polygon);

    return polygon;
  };

  this.getTrianglePath = function(element) {
    var x = element.x,
        y = element.y,
        width = element.width,
        height = element.height;

    var trianglePath = [
      ['M', x + width / 2, y],
      ['l', width / 2, height],
      ['l', -width, 0 ],
      ['z']
    ];

    return componentsToPath(trianglePath);
  };

  this.getNyanCatPath = function(element) {
    var x = element.x,
        y = element.y,
        width = element.width,
        height = element.height;

    var nyanCatPath = [
      ['M', x + width / 2, y],
      ['l', width / 2, height],
      ['l', -width, 0 ],
      ['z']
    ];

    return componentsToPath(nyanCatPath);
  };


  this.drawCircle = function(p, width, height) {
    var cx = width / 2,
        cy = height / 2;

    var attrs = computeStyle(attrs, {
      stroke: COLOR_YELLOW,
      strokeWidth: 4,
      fill: COLOR_YELLOW
    });

    var circle = svgCreate('circle');

    svgAttr(circle, {
      cx: cx,
      cy: cy,
      r: Math.round((width + height) / 4)
    });

    svgAttr(circle, attrs);

    svgAppend(p, circle);

    return circle;
  };

  this.getCirclePath = function(shape) {
    var cx = shape.x + shape.width / 2,
        cy = shape.y + shape.height / 2,
        radius = shape.width / 2;

    var circlePath = [
      ['M', cx, cy],
      ['m', 0, -radius],
      ['a', radius, radius, 0, 1, 1, 0, 2 * radius],
      ['a', radius, radius, 0, 1, 1, 0, -2 * radius],
      ['z']
    ];

    return componentsToPath(circlePath);
  };

  this.drawCustomConnection = function(p, element) {
    var attrs = computeStyle(attrs, {
      stroke: COLOR_RED,
      strokeWidth: 2
    });

    return svgAppend(p, createLine(element.waypoints, attrs));
  };

  this.getCustomConnectionPath = function(connection) {
    var waypoints = connection.waypoints.map(function(p) {
      return p.original || p;
    });

    var connectionPath = [
      ['M', waypoints[0].x, waypoints[0].y]
    ];

    waypoints.forEach(function(waypoint, index) {
      if (index !== 0) {
        connectionPath.push(['L', waypoint.x, waypoint.y]);
      }
    });

    return componentsToPath(connectionPath);
  };

  this.drawNyanCat= function(parent, shape) {
    /*const fs = require('fs');
    //para gif:
    var url = fs.readFileSync('cat.gif',{encoding: 'base64'});
    url="data:image/gif;base64,".concat(url);*/

    /* para svg:
    var url2 = fs.readFileSync('cat2.svg');
    url2=url2.toString('base64')
    url2="data:image/svg+xml;base64,".concat(url2);
    */

    var catGfx = svgCreate('image', {
      x: 0,
      y: 0,
      width: shape.width,
      height: shape.height,
      href:Cat.dataURL2,
      name:"gato"
    });
    
    svgAppend(parent,catGfx);
   return  catGfx;

  };

  this.drawText=function(parentNode){
    /*var textArea = svgCreate('text');
    var text = 'Miau';
    var fontsize = 12;
    text += '<tspan x="' + width/2 + '" y="-' + ((lines.length-i)*fontsize-fontsize/2) + '">' + lines[i] + '</tspan>';
    //innerSVG(textArea,text);
    svgAttr(textArea, {
      fontFamily: 'Arial, sans-serif',
      fontSize: fontsize,
      textAnchor: 'middle',
      width: width,
      x: width,
      y: 0
    });
    svgAppend(parentNode, textArea);*/
    var text = svgCreate('text'); 

    svgAttr(text, {
      fill: '#fff',
      transform: 'translate(-15, 5)'
    });

    svgClasses(text).add('djs-label'); 
  
    svgAppend(text,'Circulo'); 

    return svgAppend(parentNode, text);

  }

  function as(type) {
    return function(parentGfx, element) {
      return handlers[type](parentGfx, element);
    };
  }

  function renderer(type) {
    return handlers[type];
  }

}

inherits(CustomRenderer, BaseRenderer);

CustomRenderer.$inject = ['eventBus', 'styles','textRenderer'];


CustomRenderer.prototype.canRender = function(element) {
  return /^custom:/.test(element.type);
};

CustomRenderer.prototype.drawShape = function(p, element) {
  var type = element.type;
  
    
  if (type === 'custom:triangle') {
    /*text='triangulo'
    innerSVG(textArea,text);
    svgAttr(textArea, {
      fontFamily: 'Arial, sans-serif',
      fontSize: fontsize,
      textAnchor: 'middle',
      width: width,
      x: width,
      y: 0
    });*/
    return this.drawTriangle(p, element.width);
  }

  if (type === 'custom:circle') {
 
    return this.drawCircle(p, element.width, element.height);
  }

  if(type === 'custom:nyanCat'){
    /*var text=getSemantic(element).name;
    defaultStrokeColor = config && config.defaultStrokeColor;
    var text = getSemantic(element).name
    renderLabel(p, text, {
        box: element, align: 'center-middle',
        style: {
          fill: getStrokeColor(element, defaultStrokeColor)
        }
      });*/
    //renderEmbeddedLabel(p, element, 'center-middle');
    //return this.renderEventContent(element,p);
    //this.renderLabel(p,type)
    this.drawText(p)
    return this.drawNyanCat(p,element);
    
  }

}

/*CustomRenderer.prototype.getText(parent,element){
  var type=element.type
  if (type==='custom:nyanCat'){
    return this.drawText(parent)
  }
}*/

CustomRenderer.prototype.getShapePath = function(shape) {
  var type = shape.type;

  if (type === 'custom:triangle') {
    return this.getTrianglePath(shape);
  }

  if (type === 'custom:circle') {
    return this.getCirclePath(shape);
  }

  if(type === 'custom:nyanCat'){
    return this.getNyanCatPath(shape)
  }

  
};


CustomRenderer.prototype.drawConnection = function(p, element) {

  var type = element.type;

  if (type === 'custom:connection') {
    return this.drawCustomConnection(p, element);
  }
};


CustomRenderer.prototype.getConnectionPath = function(connection) {

  var type = connection.type;

  if (type === 'custom:connection') {
    return this.getCustomConnectionPath(connection);
  }
};

CustomRenderer.prototype.getText=function(parent){
  return this.getText(parent);
}

/*CustomRenderer.prototype.drawLabel=function(parent,label,options){

    return this.renderLabel(parent,label,options);

}*/

function imageToUrlData(dir){
    var preloadImage = new Image(),
    finalImage = new Image(),
    canvas = document.createElement("canvas");

    preloadImage.src = dir;
    preloadImage.addEventListener("load", function() {
    canvas.width = preloadImage.naturalWidth;
    canvas.height = preloadImage.naturalHeight;
    canvas.getContext("2d").drawImage(image, 0, 0);
    finalImage.src = canvas.toDataURL("image/png");  // png");
    // Append to the DOM. Choose the parent you want.
    document.body.appendChild(finalImage);
  });
  return finalImage.src;
}

function imageToUrlData2(dir){
  var preloadImage = new Image();
  preloadImage.src = dir;
  const objectURL = URL.createObjectURL(preloadImage);
  return objectURL;
}

function base64_encode(file) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  console.log(bitmap)
  return new Buffer(bitmap).toString('base64');
}

function getDataUrl(img) {
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // Set width and height
  canvas.width = img.width;
  canvas.height = img.height;
  // Draw the image
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/svg');
}


  function getBase64Image(src, callback, outputFormat) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let dataURL;
      canvas.height = img.naturalHeight;
      canvas.width = img.naturalWidth;
      ctx.drawImage(img, 0, 0);
      dataURL = canvas.toDataURL(outputFormat);
      callback(dataURL);
    };

    img.src = src;
    if (img.complete || img.complete === undefined) {
      img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
      img.src = src;
    }
  }



  


/*
function drawNyanCatShape(parent, shape) {
  /*const fs = require('fs');
  //para gif:
  var url = fs.readFileSync('cat.gif',{encoding: 'base64'});
  url="data:image/gif;base64,".concat(url);*/

  //svg=fs.readFileSync('cat.svg').then(response=> Buffer(response).toString('base64'));//.then(svg => document.body.insertAdjacentHTML("afterbegin", svg));
  //svg="data:image/svg;base64,".concat(svg.textContent;
  //var url=base64_encode('cat.gif')
  
  /*var encodedString=btoa(fs.readFileSync('cat.svg'));
  encodedString="data:image/svg;base64,".concat(encodedString);
  var url=encodedString;*/
  /*
  var url2 = fs.readFileSync('cat2.svg');
  url2=url2.toString('base64')
  url2="data:image/svg+xml;base64,".concat(url2);
  
  var catGfx = svgCreate('image', {
    x: 0,
    y: 0,
    width: shape.width,
    height: shape.height,
    href:Cat.dataURL2
  });
  
  //catGfx=fetch("https://s3-us-west-2.amazonaws.com/s.cdpn.io/106114/tiger.svg") .then(response => response.text()).then(svg => document.body.insertAdjacentHTML("afterbegin", svg));
  //catGfx=fetch('http://clipart-library.com/images_k/nyan-cat-transparent-background/nyan-cat-transparent-background-11.png').then(response => response.text()).then(svg => document.body.insertAdjacentHTML("afterbegin", svg));
 
 

 return catGfx;//svgAppend(parent,catGfx);

}*/