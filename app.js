// 'use strict';

var phases = [];
var xAxisMax = 5000;
var phases;
var points;
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
  drawCharts();

  // update the screen
  updateScreen(prm, phases, points);



  $("#reset").click(function () {

    if (confirm("Reset parameters?")) {
      prm = loadDefaultPrm();
      updateUrl(prm);

      // calculate motion
      phases = calcMotionPhases(prm);
      points = calcMotionPoints(prm, phases);

      // update the screen
      updateScreen(prm, phases, points);
    };
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
    //  the URL 
    updateUrl(prm);

    // copy to clipboard
    copyToClipboard(window.location.href);

    // notification
    toastr.success('saved to clipboard');
  });

  $("#export").click(function () {
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
    spline: {
      interpolation: {
        type: "step-after"
      },
    },
    data: {
      type: 'spline',
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
    // grid: {
    //   y: {
    //     show: true
    //   }
    // },
    axis: {
      x: {
        // show: false,
        label: {
          text: '[ms]',
          // position: 'outer'
        },
        min: 0,
        // max: xAxisMax,
        tick: {
          // count: 3,
          fit: false,
          rotate: 45,
        }
      },
      y: {
        // show: false,
        // inner: true,
        label: {
          text: '[mm/s²]',
          // position: 'outer'
        },
        min: -3000,
        max: 3000,
      },
      y2: {
        show: true,
        // inner: true,
        label: {
          text: '[%] (scaled)',
          // position: 'outer'
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
      //   // console.log(data[0]);
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
    transition: {
      duration: 1000
    }
  });

  chartVelocity = c3.generate({
    bindto: '#chartVelocity',
    spline: {
      interpolation: {
        type: "linear"
      },
    },
    data: {
      type: 'spline',
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
      },
      y: {
        // show: true
      }
    },
    axis: {
      x: {
        label: {
          text: '[ms]',
          position: 'outer'
        },
        min: 0,
        // max: xAxisMax,
        tick: {
          fit: false,
          rotate: 45,
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
    transition: {
      duration: 1000
    }
  });

  chartDisplacement = c3.generate({
    bindto: '#chartDisplacement',
    spline: {
      interpolation: {
        type: "linear"
      },
    },
    data: {
      type: 'spline',
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
      },
      y: {
        // show: true
      }
    },
    axis: {
      x: {
        label: {
          text: '[ms]',
          position: 'outer'
        },
        min: 0,
        // max: xAxisMax,
        tick: {
          fit: false,
          rotate: 45,
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
    transition: {
      duration: 1000
    }
  });

  chartProfile = c3.generate({
    bindto: '#chartProfile',
    spline: {
      interpolation: {
        type: "linear"
      },
    },
    data: {
      type: 'spline',
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
        // show: true
      }
    },
    axis: {
      x: {
        label: {
          text: '[ms]',
          position: 'outer'
        },
        min: 0,
        // max: xAxisMax,
        tick: {
          fit: false,
          rotate: 45,
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
      },

      // position: function (data, width, height, element) {
      //   // console.log(data[0]);
      //   return { top: 0, left: 0 };
      // },
    },
    // zoom: {
    //   enabled: true,
    //   type: 'drag'
    // }
    transition: {
      duration: 1000
    }
  });


}



function updateCharts() {
  chartAcceleration.load({
    json: phases,
    keys: {
      x: 't0',
      value: ['a', 'aPerc']
    }
  });

  chartVelocity.load({
    json: phases,
    keys: {
      x: 't0',
      value: ['v0']
    }
  });

  chartDisplacement.load({
    json: phases,
    keys: {
      x: 't0',
      value: ['s0']
    }
  });

  chartProfile.load({
    json: points,
    keys: {
      x: 't',
      value: ['s']
    }
  });

}


function updateScreen(prm, phases, points) {
  // list parameters
  listParameters("#parameters", prm);

  updateCharts();
};



/**
 * Build the screen by inserting HTML elements.
 */
function drawScreen() {
  // Header
  appendHtml('#header', `<a class="w3-xxlarge">Motion-profile</a>`);


  // Menu buttons
  drawButton('#top-menu-buttons', 'reset', CLASSTEXT_BUTTON, 'fa-home');
  drawButton('#top-menu-buttons', 'share', CLASSTEXT_BUTTON, 'fa-share');
  drawButton('#top-menu-buttons', 'export', CLASSTEXT_BUTTON, 'fa-save');
  drawButton('#top-menu-buttons', 'edit', CLASSTEXT_BUTTON, 'fa-sliders');
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
  s += `/JOB\r\n`;
  s += `//NAME ${fileName}\r\n`;
  s += `//POS\r\n`;
  s += `///NPOS ${points.length},0,0,0,0,0\r\n`;
  s += `///TOOL 0\r\n`;
  s += `///POSTYPE ROBOT\r\n`;
  s += `///RECTAN\r\n`;
  s += `///RCONF 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\r\n`;

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
    s += `${Number(Rz).toFixed(4)}\r\n`;
  }

  // 3) Header
  s += `//INST\r\n`;
  s += `///DATE ${timeStamp()}\r\n`;
  s += `///ATTR SC,RW,RJ\r\n`;
  s += `////FRAME ROBOT\r\n`;
  s += `///GROUP1 RB1\r\n`;
  s += `NOP\r\n`;

  // 4) Motion commands
  for (let i = 0; i < points.length; i++) {
    const speed = 100;
    s += `MOVL C${pad(i, 5)} V=${Number(speed).toFixed(1)}\r\n`;
  }

  // 5) Footer
  s += `END\r\n`;

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
      // console.log("delayed input change event");
      $('#save').prop('disabled', false);
    }, 500);
    // console.log("input change event");
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

  // a0 + a1 must be 100
  prm.a1.value = 100 - prm.a0.value;


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
  p.a0 = { value: 60, units: '%', type: 'number', range: [0, 100], step: 0.1, desc: 'acceleration for first part of the acceleration ramp' };
  p.a1 = { value: 40, units: '%', type: 'number', range: [0, 100], step: 0.1, desc: 'acceleration for last part of the acceleration ramp' };
  p.tDelta = { value: 8, units: 'ms', type: 'number', range: [4, 40], step: 4, desc: 'interval time for motion commands (must be a multiplication of 4)' };
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
 *  the URL by write the parameter object to the URL query.
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

function drawButton(selector, label, classText, fontAwesomeIcon) {
  var buttonHTML = `<button id="${label.replace(" ", "-")}" class="${classText}">`;
  String(fontAwesomeIcon).indexOf('fa-') === 0 ? buttonHTML += ` <i class="w3-xlarge fa ${fontAwesomeIcon}" style="padding-right:10px"></i>` : null;
  buttonHTML += `<label class="w3-hide-small">${label}</label></button>`;
  $(selector).append($(buttonHTML));
}
