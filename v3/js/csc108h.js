/*

Online Python Tutor
https://github.com/pgbovine/OnlinePythonTutor/

Copyright (C) 2010-2013 Philip J. Guo (philip@pgbovine.net)

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/


// simplified version of opt-frontend.js for ../csc108h.html
// for Paul Gries and Jennifer Campbell at Toronto


// Pre-reqs:
// - pytutor.js
// - jquery.ba-bbq.min.js
// - opt-frontend-common.js
// should all be imported BEFORE this file


$(document).ready(function() {
  genericOptFrontendReady();
  setSurveyHTML();

  $("#embedLinkDiv").hide();

  pyInputCodeMirror = CodeMirror(document.getElementById('codeInputPane'), {
    mode: 'python',
    lineNumbers: true,
    tabSize: 4,
    indentUnit: 4,
    // convert tab into four spaces:
    extraKeys: {Tab: function(cm) {cm.replaceSelection("    ", "end");}}
  });

  pyInputCodeMirror.setSize(null, '420px');



  // be friendly to the browser's forward and back buttons
  // thanks to http://benalman.com/projects/jquery-bbq-plugin/
  $(window).bind("hashchange", function(e) {
    appMode = $.bbq.getState('mode'); // assign this to the GLOBAL appMode
    updateAppDisplay();
  });


  function executeCode(forceStartingInstr) {
      backend_script = python3_backend_script; // Python 3.3

      $('#executeBtn').html("Please wait ... processing your code");
      $('#executeBtn').attr('disabled', true);
      $("#pyOutputPane").hide();
      $("#embedLinkDiv").hide();

      var backendOptionsObj = {cumulative_mode: false,
                               heap_primitives: true, // render all objects on the heap
                               show_only_outputs: false,
                               py_crazy_mode: false,
                               origin: 'csc108h.js'};

      var surveyObj = getSurveyObject();
      if (surveyObj) {
        backendOptionsObj.survey = surveyObj;
      }

      var startingInstruction = 0;

      // only do this at most ONCE, and then clear out preseededCurInstr
      // NOP anyways if preseededCurInstr is 0
      if (preseededCurInstr) {
        startingInstruction = preseededCurInstr;
        preseededCurInstr = null;
      }

      // forceStartingInstr overrides everything else
      if (forceStartingInstr !== undefined) {
        startingInstruction = forceStartingInstr;
      }

      var frontendOptionsObj = {startingInstruction: startingInstruction,
                                executeCodeWithRawInputFunc: executeCodeWithRawInput,
                                disableHeapNesting: true, // render all objects on the heap
                                drawParentPointers: true, // show environment parent pointers
                                textualMemoryLabels: true, // use text labels for references
                                updateOutputCallback: function() {$('#urlOutput,#embedCodeOutput').val('');},
                               }

      executePythonCode(pyInputCodeMirror.getValue(),
                        backend_script, backendOptionsObj,
                        frontendOptionsObj,
                        'pyOutputPane',
                        enterDisplayMode, handleUncaughtExceptionFunc);
  }

  function executeCodeFromScratch() {
    // don't execute empty string:
    if ($.trim(pyInputCodeMirror.getValue()) == '') {
      alert('Type in some code to visualize.');
      return;
    }

    // reset these globals
    rawInputLst = [];
    executeCode();
  }

  function executeCodeWithRawInput(rawInputStr, curInstr) {
    enterDisplayNoFrillsMode();

    // set some globals
    rawInputLst.push(rawInputStr);
    executeCode(curInstr);
  }

  $("#executeBtn").attr('disabled', false);
  $("#executeBtn").click(executeCodeFromScratch);


  var queryStrOptions = getQueryStringOptions();
  if (queryStrOptions.preseededCode) {
    setCodeMirrorVal(queryStrOptions.preseededCode);
  }

  appMode = queryStrOptions.appMode; // assign this to the GLOBAL appMode
  if ((appMode == "display") && queryStrOptions.preseededCode /* jump to display only with pre-seeded code */) {
    preseededCurInstr = queryStrOptions.preseededCurInstr; // ugly global
    $("#executeBtn").trigger('click');
  }
  else {
    if (appMode === undefined) {
      // default mode is 'edit', don't trigger a "hashchange" event
      appMode = 'edit';
    }
    else {
      // fail-soft by killing all passed-in hashes and triggering a "hashchange"
      // event, which will then go to 'edit' mode
      $.bbq.removeState();
    }
  }

  // redraw connector arrows on window resize
  $(window).resize(function() {
    if (appMode == 'display') {
      myVisualizer.redrawConnectors();
    }
  });

  $('#genUrlBtn').bind('click', function() {
    var myArgs = {code: pyInputCodeMirror.getValue(),
                  mode: appMode,
                  cumulative: $('#cumulativeModeSelector').val(),
                  py: $('#pythonVersionSelector').val()};

    if (appMode == 'display') {
      myArgs.curInstr = myVisualizer.curInstr;
    }

    var urlStr = $.param.fragment(window.location.href, myArgs, 2 /* clobber all */);
    $('#urlOutput').val(urlStr);
  });
});
