// 'use strict';

// var fs = require('fs');
// var gui = require('nw.gui');

// var settings = JSON.parse(fs.readFileSync('settings.json'));
// var menuItems = [];

var phases = [];
var xAxisMax = 5000;
var phases;
var points;
// var jobContent;
var wto;

var chartAcceleration;
var chartVelocity;
var chartDisplacement
var chartProfile;

// notification settings
toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": false,
  "progressBar": false,
  "positionClass": "toast-bottom-right",
  "preventDuplicates": true,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "100",
  "timeOut": "2000",
  "extendedTimeOut": "100",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
};


const CLASSTEXT = 'w3-btn w3-margin-right w3-margin-bottom w3-ripple w3-border w3-border-blue  w3-round-xxlarge';
const CLASSTEXT_BUTTON = 'w3-bar-item w3-button w3-hover-white w3-border-white';


$(document).ready(function () {
  // default parameters
  var prm = loadDefaultPrm();

  // parameters from URL query
  loadQueryPrm(prm);

  // calculate motion
  phases = calcMotionPhases(prm);
  points = calcMotionPoints(prm, phases);

  // insert the HTML items
  drawScreen();

  // update the screen
  updateScreen(prm, phases, points);

  drawCharts();


  $("#reset").click(function () {
    window.location = window.location.href.replace(window.location.search, '');
  });

  $("#edit").click(function () {
    // show the edit screen
    drawEditScreen("#edit-inputs", prm);
    $("#edit-overlay").show();
  });

  $("#save").click(function () {
    // save data from input fields
    loadInputPrm(".settings-input", prm);
    updateUrl(prm);

    // calculate motion
    phases = calcMotionPhases(prm);
    points = calcMotionPoints(prm, phases);

    // update the screen
    updateScreen(prm, phases, points);

    // close the edit screen
    $("#edit-overlay").hide();
  });

  $("#share").click(function () {
    // update the URL 
    updateUrl(prm);

    // copy to clipboard
    copyToClipboard(window.location.href);

    // notification
    toastr.success('saved to clipboard');
  });

  $("#export-job").click(function () {
    // prompt file name
    var fileName = prompt('Set file name:', 'OFFLINE');
    if (fileName == null || fileName == '') {
      toastr.error('export aborted');
      return;
    }

    // create and download job 
    downloadTextfile(fileName + '.JBI', generateInformJob(points, fileName));
    toastr.success('job exported');
  });
});




function drawCharts() {
  chartAcceleration = c3.generate({
    bindto: '#chartAcceleration',
    line: {
      step: {
        type: 'step-after'
      }
    },
    data: {
      type: 'step',
      colors: {
        a: '#808080',
        aPerc: '#ff0000',
      },
      json: phases, // JSON object containing the chart data
      keys: {       // members used for drawing the chart
        x: 't0',
        value: ['a', 'aPerc']
      },
      names: {
        a: 'mm/s²',
        aPerc: '%',
      },
      axes: {
        aPerc: 'y2',
        a: 'y',
      }
    },
    grid: {
      x: {
        // show: true,
        // lines: [
        //   { value: 500, text: 'Label on 100' },
        //   { value: 1100, text: 'Label on 200', class: 'label-200' },
        //   { value: 2500, text: 'Label on 300', position: 'middle' }
        // ]
      },
      y: {
        show: true
      }
    },
    axis: {
      x: {
        label: {
          text: '[ms]',
          position: 'outer'
        },
        min: 0,
        max: xAxisMax,
        tick: {
          fit: false
        }
      },
      y: {
        label: {
          text: '[mm/s²]',
          position: 'outer'
        },
        min: -1500,
        max: 1500,
      },
      y2: {
        show: true,
        label: {
          text: '[%] (scaled)',
          position: 'outer'
        },
        min: -100,
        max: 100,
        // tick: {
        //   fit: false
        // }
      },
    },

    tooltip: {
      // position: function (data, width, height, element) {
      //   console.log(data[0]);
      //   return {top: 0, left: 0};
      // },

      format: {
        title: function (x, index) { return Number(x).toFixed(0) + ' ms (#' + index + ')'; },
        value: function (value, ratio, id, index) { return Number(value).toFixed(2); },
      }
    },
    // zoom: {
    //   enabled: true,
    //   type: 'drag'
    // }
  });

  chartVelocity = c3.generate({
    bindto: '#chartVelocity',
    data: {
      type: 'line',
      colors: {
        v0: '#008000',
      },
      json: phases, // JSON object containing the chart data
      keys: {       // members used for drawing the chart
        x: 't0',
        value: ['v0']
      },
      names: {
        v0: 'mm/s',
      }
    },
    grid: {
      x: {
        // show: true,
        // lines: [
        //   { value: 500, text: 'Label on 100' },
        //   { value: 1100, text: 'Label on 200', class: 'label-200' },
        //   { value: 2500, text: 'Label on 300', position: 'middle' }
        // ]
      },
      y: {
        show: true
      }
    },
    axis: {
      x: {
        label: {
          text: '[ms]',
          position: 'outer'
        },
        min: 0,
        max: xAxisMax,
        tick: {
          fit: false
        }
      },
      y: {
        label: {
          text: '[mm/s]',
          position: 'outer'
        },
        // min: 0,
        // max: 1500,
        // tick: {
        //   fit: false
        // }
      }
    },

    tooltip: {
      format: {
        title: function (x, index) { return Number(x).toFixed(0) + ' ms (#' + index + ')'; },
        value: function (value, ratio, id, index) { return Number(value).toFixed(2); },
      }
    },
    // zoom: {
    //   enabled: true,
    //   type: 'drag'
    // }
  });

  chartDisplacement = c3.generate({
    bindto: '#chartDisplacement',
    data: {
      type: 'scatter',
      colors: {
        s0: '#0000ff',
      },
      json: phases, // JSON object containing the chart data
      keys: {       // members used for drawing the chart
        x: 't0',
        value: ['s0']
      },
      names: {
        s0: 'mm',
      }
    },
    grid: {
      x: {
        // show: true,
        // lines: [
        //   { value: 500, text: 'Label on 100' },
        //   { value: 1100, text: 'Label on 200', class: 'label-200' },
        //   { value: 2500, text: 'Label on 300', position: 'middle' }
        // ]
      },
      y: {
        show: true
      }
    },
    axis: {
      x: {
        label: {
          text: '[ms]',
          position: 'outer'
        },
        min: 0,
        max: xAxisMax,
        tick: {
          fit: false
        }
      },
      y: {
        label: {
          text: '[mm]',
          position: 'outer'
        },
        // min: 0,
        // max: 1500,
        // tick: {
        //   fit: false
        // }
      }
    },

    tooltip: {
      format: {
        title: function (x, index) { return Number(x).toFixed(0) + ' ms (#' + index + ')'; },
        value: function (value, ratio, id, index) { return Number(value).toFixed(2); },
      }
    },
    // zoom: {
    //   enabled: true,
    //   type: 'drag'
    // }
  });

  chartProfile = c3.generate({
    bindto: '#chartProfile',
    data: {
      type: 'line',
      colors: {
        s: '#0000ff',
      },
      json: points, // JSON object containing the chart data
      keys: {       // members used for drawing the chart
        x: 't',
        value: ['s']
      },
      names: {
        s: 'mm',
      }
    },
    point: {
      show: false
    },
    grid: {
      x: {
        // function to draw a vertical line at the start of each phase
        lines: function () {
          var arr = [];
          phases.forEach(function (ph) {
            if (ph.desc !== null) {
              arr.push({ value: ph.t0, text: ph.desc });
            }
          });
          return arr;
        },
      },
      y: {
        show: true
      }
    },
    axis: {
      x: {
        label: {
          text: '[ms]',
          position: 'outer'
        },
        min: 0,
        max: xAxisMax,
        tick: {
          fit: false
        }
      },
      y: {
        label: {
          text: '[mm]',
          position: 'outer'
        },
        // min: 0,
        // max: 1500,
        // tick: {
        //   fit: false
        // }
      }
    },

    tooltip: {
      format: {
        title: function (x, index) { return Number(x).toFixed(0) + ' ms (#' + index + ')'; },
        value: function (value, ratio, id, index) { return Number(value).toFixed(2); },
      }
    },
    // zoom: {
    //   enabled: true,
    //   type: 'drag'
    // }
  });


}



function updateCharts() {
  console.log(chartAcceleration);
  chartAcceleration.toggle();
  // chartAcceleration.load({
  //   data: {
  //     json: phases, // JSON object containing the chart data
  //   }
  // });
  // chartVelocity.load();
}


function updateScreen(prm, phases, points) {
  // list parameters
  listParameters("#parameters", prm);


};



/**
 * Build the screen by inserting HTML elements.
 */
function drawScreen() {
  // Header
  appendHtml('#header', `<a class="w3-xxlarge">Motion-profile</a>`);


  // Menu buttons
  // appendHtml('#top-menu-buttons', `<button id="reset" class="w3-bar-item w3-button w3-hover-white w3-border-white">reset</button>`);
  // appendHtml('#top-menu-buttons', `<button id="edit" class="w3-bar-item w3-button w3-hover-white w3-border-white">edit</button>`);

  drawButton('#top-menu-buttons', 'reset', CLASSTEXT_BUTTON);
  drawButton('#top-menu-buttons', 'edit', CLASSTEXT_BUTTON);
  drawButton('#top-menu-buttons', 'share', CLASSTEXT_BUTTON);
  drawButton('#top-menu-buttons', 'export job', CLASSTEXT_BUTTON);

  // updateInputFields("#settings-inputs", prm);

  // prf = (prf !== undefined) ? points : 0;
  // // labels = settings.points[prf].labels;
  // // templateText = settings.points[prf].template;


  // // set menu indicators
  // setMenuIndicator(".top-menu-selection", prf, "w3-border-bottom");
  // $('#points').text(settings.points[prf].name);

  // write INFORM job content
  // var html = `<pre>${jobContent}</pre>`;
  // $('#job-content').append($(html));

}

// ---------------------------------------------------------------------------------





/**
 * Copy string content to clipboard.
 * @param {string} content - The content
 */
function copyToClipboard(content) {
  var element = document.createElement('input');
  text = window.location.href;

  document.body.appendChild(element);
  element.value = content;
  element.select();
  document.execCommand('copy');
  document.body.removeChild(element);
}


/**
 * Create text file and intiate its download.
 * @param {string} fileName - The file name
 * @param {string} content - The content of the file
 */
function downloadTextfile(fileName, content) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', fileName);

  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Generate an INFORM job from the points.
 * @param {array} points - The array containing the point data
 * @param {string} fileName - The file name for the INFORM job
 * @return {string} Content of INFORM job
 */
function generateInformJob(points, fileName) {

  // 1) header
  var s = ``;
  s += `/JOB\n`;
  s += `//NAME ${fileName}\n`;
  s += `//POS\n`;
  s += `///NPOS ${points.length},0,0,0,0,0\n`;
  s += `///TOOL 0\n`;
  s += `///POSTYPE ROBOT\n`;
  s += `///RECTAN\n`;
  s += `///RCONF 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n`;

  // 2) Positions
  for (let i = 0; i < points.length; i++) {
    const X = 0;
    const Y = points[i].s;
    const Z = 0;
    const Rx = 180;
    const Ry = 0;
    const Rz = 0;

    s += `C${pad(i, 5)}=`;
    s += `${Number(X).toFixed(3)},`;
    s += `${Number(Y).toFixed(3)},`;
    s += `${Number(Z).toFixed(3)},`;
    s += `${Number(Rx).toFixed(4)},`;
    s += `${Number(Ry).toFixed(4)},`;
    s += `${Number(Rz).toFixed(4)}\n`;
  }

  // 3) Header
  s += `//INST\n`;
  s += `///DATE ${timeStamp()}\n`;
  s += `///ATTR SC,RW,RJ\n`;
  s += `////FRAME ROBOT\n`;
  s += `///GROUP1 RB1\n`;
  s += `NOP\n`;

  // 4) Motion commands
  for (let i = 0; i < points.length; i++) {
    const speed = 100;
    s += `MOVL C${pad(i, 5)} V=${Number(speed).toFixed(1)}\n`;
  }

  // 5) Footer
  s += `END\n`;

  return s;
}

/**
 * Append HTML using jQuery.
 * @param {string} selector - The selector used by jQuery 
 * @param {string} html - The HTML code to append 
 */
function appendHtml(selector, html) {
  $(selector).append($(html));
}

/**
 * List the parameter object using HTML <pre> tags.
 * @param {string} selector - The selector used by jQuery 
 * @param {object} prm - The parameters object 
 */
function listParameters(selector, prm) {
  $(selector).empty();

  var inputHTML = `<pre>`;
  for (var k in prm) {
    inputHTML += `${k} = ${prm[k].value}`;
    prm[k].units != undefined ? inputHTML += ` [${prm[k].units}]` : null;
    inputHTML += `\n`;
  }
  inputHTML += `</pre>`;
  $(selector).append($(inputHTML));
}

/**
 * Draw the screen for editing parameters. HTML Input fields are pre-loaded with values from the parameter object.
 * @param {string} selector - The selector used by jQuery 
 * @param {object} prm - The parameters object 
 */
function drawEditScreen(selector, prm) {
  $(selector).empty();

  for (var k in prm) {
    var inputHTML = `<label><b>${k}`;
    prm[k].units != undefined ? inputHTML += ` [${prm[k].units}]` : null;
    inputHTML += `</b></label><input class="w3-border w3-input settings-input" id="${k}" type="${prm[k].type}" value="${prm[k].value}"`;

    prm[k].range != undefined ? inputHTML += ` min="${prm[k].range[0]}" max="${prm[k].range[1]}"` : null;
    prm[k].step != undefined ? inputHTML += `  step="${prm[k].step}"` : null;

    inputHTML += `">`;
    $(selector).append($(inputHTML));
  }


  // event listener, used to enable/disable the save button
  $(".settings-input").change(function () {
    clearTimeout(wto);
    wto = setTimeout(function () {
      // todo: compare values, enable/disable the save button
      console.log("delayed input change event");
      $('#save').prop('disabled', false);
    }, 500);
    console.log("input change event");
  });

}

/**
 * Overwrite the parameter object with the values from the HTML Input fields.
 * @param {string} selector - The selector used by jQuery 
 * @param {object} prm - The parameters object 
 */
function loadInputPrm(selector, prm) {
  $(selector).each(
    function (index) {
      const input = $(this);
      const k = input.attr('id');
      var val = input.val();

      // convert to number if needed
      typeof prm[k].value !== 'string' ? prm[k].value = Number(val) : prm[k].value = val;
    }
  );
}

/**
 * Calculate the velocity at a given time (constant acceleration).
 * @param {number} v0 - Velocity at start point [mm/s] 
 * @param {number} t0 - Time at start point [ms] 
 * @param {number} a - Acceleration [mm/s²] 
 * @param {number} t - Time [ms]
 * @return {number} Velocity [mm/s]
 */
function calcVelocity(v0, t0, a, t) {
  const tDiff = (t - t0) / 1000;
  return v0 + (a * tDiff);
}

/**
 * Calculate the displacement at a given time (constant acceleration).
 * @param {number} s0 - Position at start point [mm] 
 * @param {number} v0 - Velocity at start point [mm/s] 
 * @param {number} t0 - Time at start point [ms] 
 * @param {number} a - Acceleration [mm/s²] 
 * @param {number} t - Time [ms]
 * @return {number} Displacement [mm]
 */
function calcPosition(s0, v0, t0, a, t) {
  const tDiff = (t - t0) / 1000;
  return s0 + (v0 * tDiff) + (1 / 2 * a * (tDiff ** 2));
}

/**
 * Add leading zero's to a number.
 * @param {number} num - The number 
 * @param {number} size - Amount of characters 
 */
function pad(num, size) {
  var s = "000000000" + num;
  return s.substr(s.length - size);
}

/**
 * The current date/time in the format `yyyy/mm/dd HH:MM`.
 */
function timeStamp() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = pad(today.getMonth() + 1, 2);
  const dd = pad(today.getDate(), 2);
  const HH = pad(today.getHours(), 2);
  const MM = pad(today.getMinutes(), 2);
  return `${yyyy}/${mm}/${dd} ${HH}:${MM}`;
}

/**
 * Set the default parameters.
 * @return {object} The parameters object 
 */
function loadDefaultPrm() {
  var p = {};
  p.pos0 = { value: 0, units: 'mm', type: 'number', range: [-3000, 3000], step: 0.1, desc: 'position for start' };
  p.pos1 = { value: 450, units: 'mm', type: 'number', range: [-3000, 3000], step: 0.1, desc: 'position for finish' };
  p.vSet = { value: 150, units: 'mm/s', type: 'number', range: [1, 1500], step: 0.1, desc: 'velocity setpoint' };
  p.tRamp = { value: 1000, units: 'ms', type: 'number', range: [50, 5000], step: 1, desc: 'duration of the acceleration ramp' };
  p.tx = { value: 250, units: 'ms', type: 'number', range: [0, 5000], step: 0.1, desc: 'duration of the first/last part of the acceleration ramp' };
  p.a0 = { value: 60, units: 'mm/s²', type: 'number', range: [0, 100], step: 0.1, desc: 'acceleration for first part of the acceleration ramp' };
  p.a1 = { value: 40, units: 'mm/s²', type: 'number', range: [0, 100], step: 0.1, desc: 'acceleration for last part of the acceleration ramp' };
  p.tDelta = { value: 4, units: 'ms', type: 'number', range: [4, 40], step: 4, desc: 'interval time for motion commands (must be a multiplication of 4)' };
  // p.fileName = { value: 'OFFLINE', type: 'text', desc: 'filename for the generated INFORM job' };
  return p;
}

/**
 * Overwrite the parameter object with the values from the URL query.
 * @param {object} prm - The parameters object 
 */
function loadQueryPrm(prm) {
  // console.table(prm);
  const obj = Object.fromEntries(new URLSearchParams(location.search));

  // find and overwrite the parameter 
  for (var k in obj) {
    var val = obj[k];

    if (k in prm) {
      // convert to number if needed
      // todo: use Case, add Bool type
      typeof prm[k].value !== 'string' ? prm[k].value = Number(val) : prm[k].value = val;

    } else {
      console.log(`parameter '${k}' not found!`);
    }
  }
  // console.table(prm);  
}

/**
 * Update the URL by write the parameter object to the URL query.
 * @param {object} prm - The parameters object 
 */
function updateUrl(prm) {
  var obj = {};
  for (var k in prm) {
    obj[k] = prm[k].value;
  }
  const q = '?' + new URLSearchParams(obj).toString();
  // console.log(q);

  if (history.pushState) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + q;
    window.history.pushState({ path: newurl }, '', newurl);
  }
}

/**
 * Calculate the 7 phases of the motion.
 * ```text
 * - 1 to 3 : acceleration ramp
 * - 4      : constant speed
 * - 5 to 7 : deceleration ramp
 * ```
 * @param {object} prm - The parameters object
 * @return {array} The phases array 
 */
function calcMotionPhases(prm) {
  var ph = [];

  // init phases
  for (let i = 0; i <= 8; i++) {
    ph[i] = {
      t0: 0,
      t1: 0,
      a: 0,
      aPerc: 0,
      v0: 0,
      v1: 0,
      s0: 0,
      s1: 0,
    }
    ph[i].desc = ((i >= 1) & (i <= 7)) ? `phase ${i}` : null;
  }

  const tA = prm.tx.value;
  const tC = prm.tx.value;
  const tB = prm.tRamp.value - tA - tC;

  const aPercA = prm.a0.value;
  const aPercB = prm.a0.value + prm.a1.value;
  const aPercC = prm.a1.value;

  // -------------------------------------
  // acceleration reference
  // -------------------------------------

  // average acceleration over the entire ramp [mm/s²]
  // const aAvg = (vSet / tRamp) * 1000;

  // reference acceleration for the parts of the ramp
  const aRef = (prm.vSet.value / (prm.tRamp.value - prm.tx.value)) * 1000;
  const aA = aRef * (aPercA / 100);
  const aB = aRef * (aPercB / 100);
  const aC = aRef * (aPercC / 100);

  // -------------------------------------
  // phase 1-3; acceleration ramp
  // -------------------------------------
  // part a
  ph[1].aPerc = aPercA;
  ph[1].a = aA;
  ph[1].t0 = 0;
  ph[1].v0 = 0;
  ph[1].s0 = prm.pos0.value;
  ph[1].t1 = ph[1].t0 + tA;
  ph[1].v1 = calcVelocity(ph[1].v0, ph[1].t0, ph[1].a, ph[1].t1);
  ph[1].s1 = calcPosition(ph[1].s0, ph[1].v0, ph[1].t0, ph[1].a, ph[1].t1);

  // part b
  ph[2].aPerc = aPercB;
  ph[2].a = aB;
  ph[2].t0 = ph[1].t1;
  ph[2].v0 = ph[1].v1;
  ph[2].s0 = ph[1].s1;
  ph[2].t1 = ph[2].t0 + tB;
  ph[2].v1 = calcVelocity(ph[2].v0, ph[2].t0, ph[2].a, ph[2].t1);
  ph[2].s1 = calcPosition(ph[2].s0, ph[2].v0, ph[2].t0, ph[2].a, ph[2].t1);

  // part c
  ph[3].aPerc = aPercC;
  ph[3].a = aC;
  ph[3].t0 = ph[2].t1;
  ph[3].v0 = ph[2].v1;
  ph[3].s0 = ph[2].s1;
  ph[3].t1 = ph[3].t0 + tC;
  ph[3].v1 = calcVelocity(ph[3].v0, ph[3].t0, ph[3].a, ph[3].t1);
  ph[3].s1 = calcPosition(ph[3].s0, ph[3].v0, ph[3].t0, ph[3].a, ph[3].t1);


  // -------------------------------------
  // phase 5-7; deceleration ramp
  // - calculated immediately after the acceleration ramp
  // - afterwards, the remaining distance is used to
  //   correct the starting position and -time of this deceleration ramp
  // -------------------------------------
  // part a
  ph[5].aPerc = -aPercA;
  ph[5].a = -aA;
  ph[5].t0 = ph[3].t1;
  ph[5].v0 = ph[3].v1;
  ph[5].s0 = ph[3].s1;
  ph[5].t1 = ph[5].t0 + tA;
  ph[5].v1 = calcVelocity(ph[5].v0, ph[5].t0, ph[5].a, ph[5].t1);
  ph[5].s1 = calcPosition(ph[5].s0, ph[5].v0, ph[5].t0, ph[5].a, ph[5].t1);

  // part b
  ph[6].aPerc = -aPercB;
  ph[6].a = -aB;
  ph[6].t0 = ph[5].t1;
  ph[6].v0 = ph[5].v1;
  ph[6].s0 = ph[5].s1;
  ph[6].t1 = ph[6].t0 + tB;
  ph[6].v1 = calcVelocity(ph[6].v0, ph[6].t0, ph[6].a, ph[6].t1);
  ph[6].s1 = calcPosition(ph[6].s0, ph[6].v0, ph[6].t0, ph[6].a, ph[6].t1);

  // part c
  ph[7].aPerc = -aPercC;
  ph[7].a = -aC;
  ph[7].t0 = ph[6].t1;
  ph[7].v0 = ph[6].v1;
  ph[7].s0 = ph[6].s1;
  ph[7].t1 = ph[7].t0 + tC;
  ph[7].v1 = calcVelocity(ph[7].v0, ph[7].t0, ph[7].a, ph[7].t1);
  ph[7].s1 = calcPosition(ph[7].s0, ph[7].v0, ph[7].t0, ph[7].a, ph[7].t1);


  // -------------------------------------
  // shift deceleration ramp
  // -------------------------------------
  // position and time correction
  const xCorr = prm.pos1.value - ph[7].s1;
  const tCorr = xCorr / (ph[3].v1) * 1000;

  for (let i = 5; i <= 7; i++) {
    ph[i].t0 = ph[i].t0 + tCorr;
    ph[i].s0 = ph[i].s0 + xCorr;
    ph[i].t1 = ph[i].t1 + tCorr;
    ph[i].s1 = ph[i].s1 + xCorr;
  }


  // -------------------------------------
  // phase 4; constant velocity
  // -------------------------------------
  ph[4].aPerc = 0;
  ph[4].a = 0;
  ph[4].t0 = ph[3].t1;
  ph[4].v0 = ph[3].v1;
  ph[4].s0 = ph[3].s1;
  ph[4].v1 = ph[4].v0;
  ph[4].s1 = ph[5].s0;
  ph[4].t1 = ph[5].t0;


  // -------------------------------------
  // plot motion profile phases
  // -------------------------------------
  ph[0].t0 = -50;
  ph[0].v0 = ph[1].v0;
  ph[0].s0 = ph[1].s0;
  ph[0].t1 = ph[1].t0;
  ph[0].v1 = ph[1].v0;
  ph[0].s1 = ph[1].s0;

  ph[8].t0 = ph[7].t1;
  ph[8].v0 = ph[7].v1;
  ph[8].s0 = ph[7].s1;
  ph[8].t1 = ph[8].t0 + 50;
  ph[8].v1 = ph[8].v0;
  ph[8].s1 = ph[8].s0;

  return ph;
}

/**
 * Calculate point (position) for each `tDelta` of the motion.
 * @param {object} prm - The parameters object
 * @param {object} phases - The phases object
 * @return {array} The points array 
 */
function calcMotionPoints(prm, phases) {
  var arr = [];

  for (let t = 0; t <= phases[7].t1; t += prm.tDelta.value) {
    switch (true) {
      //ph 1
      case t <= phases[1].t1:
        ph = 1;
        break;
      //ph 2
      case t <= phases[2].t1:
        ph = 2;
        break;
      //ph 3
      case t <= phases[3].t1:
        ph = 3;
        break;
      //ph 4
      case t <= phases[4].t1:
        ph = 4;
        break;
      //ph 5
      case t <= phases[5].t1:
        ph = 5;
        break;
      //ph 6
      case t <= phases[6].t1:
        ph = 6;
        break;
      //ph 7
      case t <= phases[7].t1:
        ph = 7;
        break;
    }

    var p = {};
    p.t = t;
    p.s = calcPosition(phases[ph].s0, phases[ph].v0, phases[ph].t0, phases[ph].a, t);
    arr.push(p);
  }
  return arr;
}


function drawButton(selector, label, classText) {
  const buttonHTML = `<button id="${label.replace(" ", "-")}" class="${classText}">${label}</button>`;
  $(selector).append($(buttonHTML));
}





// ----------- OLD -----------
{

  function calcMotion() {
    console.log('recalc all');
    // clear job content
    $('#job-content').detach();

    // calculate phases
    phases = calcMotionPhases(prm);

    // calculate points from phases
    points = calcMotionPoints(prm, phases);

    // update charts
    // updateCharts();


  }



  // function drawButtons(selector, arr, classText) {
  //   for (let index = 0; index < arr.length; index++) {
  //     const buttonHTML = `<button id="${arr[index]}" value="0" class="${classText}">${(arr[index]).replace("MLx-", "")}</button>`;
  //     $(selector).append($(buttonHTML));
  //   }
  // }


  // function drawMenu(selector, arr, classText) {
  //   for (let index = 0; index < arr.length; index++) {
  //     const buttonHTML = `<a tabindex="-1" value="${index}" class="${classText}">${(arr[index])}</a>`;
  //     $(selector).append($(buttonHTML));
  //   }
  // }


  // function setMenuIndicator(selector, index, classText) {
  //   $(selector).removeClass(classText);
  //   $($(selector)[index]).addClass(classText);
  // }


  // function w3_open() {
  //   document.getElementById("mobile-menu-buttons").style.display = "block";
  //   document.getElementById("overlay").style.display = "block";
  // }

  // function w3_close() {
  //   // document.getElementById("mobile-menu-buttons").style.display = "none";
  //   document.getElementById("edit-overlay").style.display = "none";
  // }



}


