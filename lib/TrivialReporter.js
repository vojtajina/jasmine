jasmine.TrivialReporter = function(doc) {
  this.document = doc || document;
  this.suiteDivs = {};
  this.logRunningSpecs = false;
  this.domPrettyPrint = false;
};

jasmine.TrivialReporter.prototype.createDom = function(type, attrs, childrenVarArgs) {
  var el = document.createElement(type);

  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i];

    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      if (child) { el.appendChild(child); }
    }
  }

  for (var attr in attrs) {
    if (attr == "className") {
      el[attr] = attrs[attr];
    } else {
      el.setAttribute(attr, attrs[attr]);
    }
  }

  return el;
};

jasmine.TrivialReporter.prototype.reportRunnerStarting = function(runner) {
  var showPassed, showSkipped;

  this.outerDiv = this.createDom('div', { className: 'jasmine_reporter' },
      this.createDom('div', { className: 'banner' },
        this.createDom('div', { className: 'logo' },
            "Jasmine",
            this.createDom('span', { className: 'version' }, runner.env.versionString())),
        this.createDom('div', { className: 'options' },
            "Show ",
            showPassed = this.createDom('input', { id: "__jasmine_TrivialReporter_showPassed__", type: 'checkbox' }),
            this.createDom('label', { "for": "__jasmine_TrivialReporter_showPassed__" }, " passed "),
            showSkipped = this.createDom('input', { id: "__jasmine_TrivialReporter_showSkipped__", type: 'checkbox' }),
            this.createDom('label', { "for": "__jasmine_TrivialReporter_showSkipped__" }, " skipped")
            )
          ),

      this.runnerDiv = this.createDom('div', { className: 'runner running' },
          this.createDom('a', { className: 'run_spec', href: '?' }, "run all"),
          this.runnerMessageSpan = this.createDom('span', {}, "Running..."),
          this.finishedAtSpan = this.createDom('span', { className: 'finished-at' }, ""))
      );

  this.document.body.appendChild(this.outerDiv);

  var suites = runner.suites();
  for (var i = 0; i < suites.length; i++) {
    var suite = suites[i];
    var suiteDiv = this.createDom('div', { className: 'suite' },
        this.createDom('a', { className: 'run_spec', href: '?spec=' + encodeURIComponent(suite.getFullName()) }, "run"),
        this.createDom('a', { className: 'description', href: '?spec=' + encodeURIComponent(suite.getFullName()) }, suite.description));
    this.suiteDivs[suite.id] = suiteDiv;
    var parentDiv = this.outerDiv;
    if (suite.parentSuite) {
      parentDiv = this.suiteDivs[suite.parentSuite.id];
    }
    parentDiv.appendChild(suiteDiv);
  }

  this.startedAt = new Date();

  var self = this;
  showPassed.onchange = function(evt) {
    if (evt.target.checked) {
      self.outerDiv.className += ' show-passed';
    } else {
      self.outerDiv.className = self.outerDiv.className.replace(/ show-passed/, '');
    }
  };

  showSkipped.onchange = function(evt) {
    if (evt.target.checked) {
      self.outerDiv.className += ' show-skipped';
    } else {
      self.outerDiv.className = self.outerDiv.className.replace(/ show-skipped/, '');
    }
  };
};

jasmine.TrivialReporter.prototype.reportRunnerResults = function(runner) {
  var results = runner.results();
  var className = (results.failedCount > 0) ? "runner failed" : "runner passed";
  this.runnerDiv.setAttribute("class", className);
  //do it twice for IE
  this.runnerDiv.setAttribute("className", className);
  var specs = runner.specs();
  var specCount = 0;
  for (var i = 0; i < specs.length; i++) {
    if (this.specFilter(specs[i])) {
      specCount++;
    }
  }
  var message = "" + specCount + " spec" + (specCount == 1 ? "" : "s" ) + ", " + results.failedCount + " failure" + ((results.failedCount == 1) ? "" : "s");
  message += " in " + ((new Date().getTime() - this.startedAt.getTime()) / 1000) + "s";
  this.runnerMessageSpan.replaceChild(this.createDom('a', { className: 'description', href: '?'}, message), this.runnerMessageSpan.firstChild);

  this.finishedAtSpan.appendChild(document.createTextNode("Finished at " + new Date().toString()));
};

jasmine.TrivialReporter.prototype.reportSuiteResults = function(suite) {
  var results = suite.results();
  var status = results.passed() ? 'passed' : 'failed';
  if (results.totalCount == 0) { // todo: change this to check results.skipped
    status = 'skipped';
  }
  this.suiteDivs[suite.id].className += " " + status;
};

jasmine.TrivialReporter.prototype.reportSpecStarting = function(spec) {
  if (this.logRunningSpecs) {
    this.log('>> Jasmine Running ' + spec.suite.description + ' ' + spec.description + '...');
  }
};

jasmine.TrivialReporter.prototype.reportSpecResults = function(spec) {
  var results = spec.results();
  var status = results.passed() ? 'passed' : 'failed';
  if (results.skipped) {
    status = 'skipped';
  }
  var specDiv = this.createDom('div', { className: 'spec '  + status },
      this.createDom('a', { className: 'run_spec', href: '?spec=' + encodeURIComponent(spec.getFullName()) }, "run"),
      this.createDom('a', {
        className: 'description',
        href: '?spec=' + encodeURIComponent(spec.getFullName()),
        title: spec.getFullName()
      }, spec.description));


  var resultItems = results.getItems();
  var messagesDiv = this.createDom('div', { className: 'messages' });
  for (var i = 0; i < resultItems.length; i++) {
    var result = resultItems[i];

    if (result.type == 'log') {
      messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage log'}, result.toString()));
    } else if (result.type == 'expect' && result.passed && !result.passed()) {
      messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage fail'}, this.reportWhatever(result)));

      if (result.trace.stack) {
        messagesDiv.appendChild(this.createDom('div', {className: 'stackTrace'}, result.trace.stack));
      }
    }
  }

  if (messagesDiv.childNodes.length > 0) {
    specDiv.appendChild(messagesDiv);
  }

  this.suiteDivs[spec.suite.id].appendChild(specDiv);
};

jasmine.TrivialReporter.prototype.reportWhatever = function(result) {
  if (this.domPrettyPrint) {
    var actualDiv, expectedDiv;

    var matcherString = result.matcherName;
    var table = this.createDom('table', {},
        this.createDom('tr', {},
            this.createDom('td', {colspan: 2}, result.message)),
        this.createDom('tr', {},
            this.createDom('th', {}, 'expect()'),
            this.createDom('th', {}, matcherString + "()")),
        this.createDom('tr', {},
            actualDiv = this.createDom('td'),
            expectedDiv = this.createDom('td'))
        );

    new jasmine.HtmlPrettyPrinter(actualDiv).format(result.actual);
    new jasmine.HtmlPrettyPrinter(expectedDiv).format(result.expected);

    return table;
  } else {
    return result.message;
  }
};

jasmine.TrivialReporter.prototype.log = function() {
  var console = jasmine.getGlobal().console;
  if (console && console.log) console.log.apply(console, arguments);
};

jasmine.TrivialReporter.prototype.getLocation = function() {
  return this.document.location;
};

jasmine.TrivialReporter.prototype.specFilter = function(spec) {
  var paramMap = {};
  var params = this.getLocation().search.substring(1).split('&');
  for (var i = 0; i < params.length; i++) {
    var p = params[i].split('=');
    paramMap[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
  }

  if (!paramMap["spec"]) return true;
  return spec.getFullName().indexOf(paramMap["spec"]) == 0;
};

jasmine.HtmlPrettyPrinter = function(el) {
  jasmine.PrettyPrinter.call(this);
  this.el = el;
};

jasmine.util.inherit(jasmine.HtmlPrettyPrinter, jasmine.PrettyPrinter);

jasmine.HtmlPrettyPrinter.prototype.createDom = jasmine.FancyHtmlReporter.prototype.createDom;

jasmine.HtmlPrettyPrinter.prototype.emitScalar = function(value) {
  this.append(this.createDom('pre', {}, value));
};

jasmine.HtmlPrettyPrinter.prototype.emitString = function(value) {
  this.append(this.createDom('pre', {className: 'string'}, value));
};

jasmine.HtmlPrettyPrinter.prototype.emitArray = function(array) {
  var table = this.createDom('table', {className: 'array'});

  for (var i = 0; i < array.length; i++) {
    var oldEl = this.el;
    this.el = this.createDom('td');
    table.appendChild(this.createDom('tr', {}, this.el));
    this.format(array[i]);
    this.el = oldEl;
  }
  this.append(table);
};

jasmine.HtmlPrettyPrinter.prototype.emitObject = function(obj) {
  var self = this;
  var table = this.createDom('table', {className: 'object'});

  this.iterateObject(obj, function(property, isGetter) {
    var tr = self.createDom('tr');
    table.appendChild(tr);

    tr.appendChild(self.createDom('th', {}, property));

    var oldEl = self.el;
    self.el = self.createDom('td');
    tr.appendChild(self.createDom('th', {}, self.el));
    if (isGetter) {
      self.el.appendChild(self.createDom('pre', {className: 'getter'}, '<getter>'));
    } else {
      self.format(obj[property]);
    }
    self.el = oldEl;
  });

  this.append(table);
};

jasmine.HtmlPrettyPrinter.prototype.append = function(element) {
  this.el.appendChild(element);
};
