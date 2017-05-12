'use strict';

//todo:
//use accrual maximum
//save/switch years?

var debug;
var monthList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                 'September', 'October', 'November', 'December'];
var dayList = ['S','M','T','W','T','F','S'];

var v = {
  state: {},
  spanInfo: undefined,
  init: function() {
    console.log('init');

    document.getElementById('button_hide').onclick = v.hide;
    document.getElementById('button_config').onclick = v.show;
    document.getElementById('button_reset').onclick = v.reset;
    document.getElementById('button_export').onclick = v.export;
    document.getElementById('button_import').onclick = v.import;

    v.load();

    if (v.state.showConfig === true) {
      v.show();
    } else {
      v.hide();
    }

    //if we don't have a year then prompt the user to enter it
    if (v.state.year === undefined) {
      v.state.year = parseInt(prompt("Vacation year?", (new Date()).getFullYear()));
      v.save();
    }
    document.title = 'vacation ' + v.state.year;
    v.drawCalendar();
    v.populateConfig();
  },
  populateConfig: function() {
    document.getElementById('input_pch').value = v.state.pch;
    document.getElementById('input_hpd').value = v.state.hpd;
    document.getElementById('input_hpy').value = v.state.hpy;
    document.getElementById('input_am').value = v.state.am;
  },
  readConfig: function() {
    v.state.pch = parseFloat(document.getElementById('input_pch').value);
    v.state.hpd = parseFloat(document.getElementById('input_hpd').value);
    v.state.hpy = parseFloat(document.getElementById('input_hpy').value);
    v.state.am =  parseFloat(document.getElementById('input_am').value);
    v.save();
  },
  load: function() {
    var stateString = localStorage.getItem('state');
    var jsonState;
    if (stateString === null) {
      jsonState = {};
    } else {
      jsonState = JSON.parse(stateString);
    }
    v.state = {
      year: undefined,
      pch: 0,
      hpd: 0,
      hpy: 0,
      am: 0,
      holidays: {},
      vacations: {},
      showConfig: true
    };

    //allow anything in jsonState to overwrite the contents of state
    Object.assign(v.state, jsonState);

  },
  save: function() {
    localStorage.setItem('state', JSON.stringify(v.state));
  },
  drawCalendar: function() {
    var c = document.getElementById('div_calendar_container');
    var html = '<div><span id="span_year">2017</span>';
    html += '<span id="span_info"></span></div>';
    var i;
    var d;
    var s;
    var dow = 0;

    var firstDow = (new Date(v.state.year, 0, 1)).getDay();
    dow = firstDow;
    var daysInMonth;
    var dayClassList;
    var monthsPerRow = 3;
    var accumulatedDays;

    for (i = 0; i < monthList.length; i++) {
      if (i % monthsPerRow === 0) {
        if (i !== 0) {
          html += '</div>';
        }
        html += '<div class="div_month_row">';
      }

      daysInMonth = new Date(v.state.year, i + 1, 0).getDate();

      html += '<div class="div_month_container"><div class="div_month_name">' + (i+1) + ' ' + monthList[i] +
      '</div><div class="div_month_days"><div class="div_week_header">';
      dayList.forEach(function(v) {
        html += '<span class="span_week_header_day">' + v + '</span>';
      });
      html += '</div>';

      for (d = 1; d <= daysInMonth; d++) {
        if (dow === 0 || d === 1) {
          if (d === 1) {
            html += '<div class="div_week">';
          } else {
            html += '</div><div class="div_week">';
          }
        }
        if (d === 1) {
          for (s = 0; s < dow; s++) {
            html += '<span class="span_day_space"></span>';
          }
        }

        accumulatedDays = v.getAccumulatedDays(i, d);

        dayClassList = 'span_day';
        if (v.state.vacations[i.toString() + ' ' + d.toString()] === true) {
          if (accumulatedDays <= 0) {
            dayClassList += ' span_day_vacation_over';
          } else {
            dayClassList += ' span_day_vacation';
          }
        } else if (v.state.holidays[i.toString() + ' ' + d.toString()] === true) {
          dayClassList += ' span_day_holiday';
        } else if (dow === 0 || dow === 6) {
          dayClassList += ' span_day_weekend';
        }

        html += '<span class="' + dayClassList + '" onclick="v.dayClick(event, ' + i + ', ' + d + ');" onmouseover="v.mouseOver(event, ' +
                 i + ', ' + d + ');" onmouseout="v.mouseOut(event, ' + i + ', ' + d + ');">' + d + '</span>';


        dow = (dow + 1) % 7;
      }
      html +=  '</div>';
      html += '</div></div>';
    }
    html += '</div>';

    c.innerHTML = html;
    v.spanInfo = document.getElementById('span_info');
  },
  dayClick: function(e, month, day) {
    var src = e.srcElement;
    var dateString = month + ' ' + day;
    if (e.shiftKey) {
      console.log('shift clicked ', month, day, this.innerHTML);
      var hState = v.state.holidays[dateString];
      if (hState === true) {
        v.state.holidays[dateString] = false;
        src.classList.remove('span_day_holiday');
      } else {
        v.state.holidays[dateString] = true;
        src.classList.add('span_day_holiday');
      }
    } else {
      console.log('clicked ', month, day, this.innerHTML);
      var vState = v.state.vacations[dateString];
      if (vState === true) {
        v.state.vacations[dateString] = false;
        //src.classList.remove('span_day_vacation');
      } else {
        v.state.vacations[dateString] = true;
        //src.classList.add('span_day_vacation');
      }
    }
    v.save();
    v.drawCalendar();
  },
  mouseOver: function(e, month, day) {
    var src = e.srcElement;
    src.style.outline = '2px solid #2f652f';
    src.style.zIndex = '100';
    if (e.shiftKey) {
      v.spanInfo.innerHTML = 'Prior to ' + monthList[month] + ' ' + day + ', accumulated: ' + v.getAccumulatedDays(month, day) + ' (' + v.getAccumulatedHours(month, day).toFixed(3) + 'hrs), assigned: ' + v.getVacationAssigned(month, day);
    } else {
      v.spanInfo.innerHTML = 'Prior to ' + monthList[month] + ' ' + day + ', accumulated: ' + v.getAccumulatedDays(month, day) + ', assigned: ' + v.getVacationAssigned(month, day);
    }
  },
  mouseOut: function(e, month, day) {
    var src = e.srcElement;
    src.style.outline = '';
    src.style.zIndex = '';
    v.spanInfo.innerHTML = 'Prior to ?, accumulated: ?, assigned: ?';
  },
  getDayNum: function(month, day) {
    var firstDay = new Date(v.state.year, 0, 1);
    var targetDay = new Date(v.state.year, month, day);
    return (targetDay - firstDay) / (60 * 60 * 24 * 1000);
  },
  getVacationAssigned(month, day) {
    var result = 0;
    var targetDate = new Date(v.state.year, month, day);
    var vDate;
    Object.keys(v.state.vacations).forEach(function(val) {
      if (v.state.vacations[val] === true) {
        var [a, b] = val.split(' ');
        vDate = new Date(v.state.year, a, b);
        if (vDate < targetDate) {
          ++result;
        }
      }
    });
    return result;
  },
  getAccumulatedDays: function(month, day) {
    /*
    var dayNum = v.getDayNum(month, day);
    var result;
    var vacationDaysAssignedBeforeDay = v.getVacationAssigned(month, day);
    //console.log(vacationDaysAssignedBeforeDay, ' already assigned');
    result = v.state.pch;
    result += dayNum * v.state.hpd;
    result += v.state.hpy;
    return Math.floor(result / 8) - vacationDaysAssignedBeforeDay;
    */
    return Math.floor(v.getAccumulatedHours(month, day) / 8);
  },
  getAccumulatedHours: function(month, day) {
    var dayNum = v.getDayNum(month, day);
    var result;
    var vacationDaysAssignedBeforeDay = v.getVacationAssigned(month, day);
    //console.log(vacationDaysAssignedBeforeDay, ' already assigned');
    result = v.state.pch;
    result += dayNum * v.state.hpd;
    result += v.state.hpy;
    return result - (vacationDaysAssignedBeforeDay * 8);
  },
  hide: function() {
    document.getElementById('div_top').style.display = 'none';
    document.getElementById('button_config').style.display = 'inline-block';
    v.state.showConfig = false;
    v.save();
  },
  show: function() {
    document.getElementById('div_top').style.display = 'block';
    document.getElementById('button_config').style.display = 'none';
    v.state.showConfig = true;
    v.save();
  },
  reset: function() {
    var result = confirm('Really reset everything including entered vacation and holidays?');
    if (result === true) {
      localStorage.clear();
      v.init();
    }
  },
  export: function() {
    document.getElementById('textarea_xfer').value = btoa(JSON.stringify(v.state));
  },
  import: function() {
    var result = confirm('Import will overwrite current state. Continue?');
    if (result === true) {
      var s = atob(document.getElementById('textarea_xfer').value);
      var obj;
      try {
        obj = JSON.parse(s);
      } catch (e) {
        alert('ERROR: Imported data is invalid.');
        return;
      }
      v.state = obj;
      v.save();
      v.load();
      v.drawCalendar();
      v.populateConfig();
    }
  }
};

v.init();
