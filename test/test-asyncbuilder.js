/**
 * test-asyncbuilder
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

/*eslint no-unused-vars: ["error", { "args": "none" }]*/

var test = require('tape');
var partial = require('lodash.partial');

var builder = require('../asyncbuilder');

test('instanceof', function(t) {
  t.true(builder() instanceof builder);
  t.end();
});

test('no append or asyncAppend', function(t) {
  var completed = false;
  var ab = builder(function(err, data) {
    t.deepEqual(data, []);
    t.equal(err, null);
    t.true(completed);
    t.end();
  });

  ab.complete();
  completed = true;
});

test('append only without async', function(t) {
  var completed = false;
  var ab = builder(function(err, data) {
    t.deepEqual(data[1,2,3,4]);
    t.equal(err, null);
    t.true(completed);
    t.end();
  });

  ab.append(1);
  ab.append(2);
  ab.append(3);
  ab.append(4);
  ab.complete();
  completed = true;
});

test('append/asyncAppend ordering is preserved', function(t) {
  var ab = builder(function(err, data) {
    t.deepEqual(data[1,2,3,4]);
    t.equal(err, null);
    t.end();
  });

  ab.append(1);
  var cb1 = partial(ab.asyncAppend(), null, 2);
  ab.append(3);
  var cb2 = partial(ab.asyncAppend(), null, 4);
  ab.complete();

  setTimeout(cb1, 20); // first async operation finishes last
  setTimeout(cb2, 10); // last async operation finishes first
});

test('async error after other callback', function(t) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    t.false(callbackCalled);
    callbackCalled = true;
    t.true(err instanceof Error);
    t.end();
  });

  ab.append(1);
  var cb1 = partial(ab.asyncAppend(), null, 2);
  ab.append(3);
  var cb2 = partial(ab.asyncAppend(), new Error('error in cb2'));
  ab.complete();

  setTimeout(cb1, 10);
  setTimeout(cb2, 20);
});

test('async error before other callback', function(t) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    t.false(callbackCalled);
    callbackCalled = true;
    t.true(err instanceof Error);
    t.end();
  });

  ab.append(1);
  var cb1 = partial(ab.asyncAppend(), null, 2);
  ab.append(3);
  var cb2 = partial(ab.asyncAppend(), new Error('error in cb2'));
  ab.complete();

  setTimeout(cb1, 20);
  setTimeout(cb2, 10);
});


test('multiple async errors', function(t) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    t.false(callbackCalled);
    callbackCalled = true;
    t.true(err instanceof Error);
    t.end();
  });

  ab.append(1);
  var cb1 = partial(ab.asyncAppend(), new Error('error in cb1'));
  ab.append(3);
  var cb2 = partial(ab.asyncAppend(), new Error('error in cb2'));
  ab.complete();

  setTimeout(cb1, 20);
  setTimeout(cb2, 10);
});


test('callback after async error', function(t) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    t.false(callbackCalled);
    callbackCalled = true;
    t.true(err instanceof Error);
    setTimeout(function() { t.end(); }, 40);
  });

  ab.append(1);
  var cb1 = partial(ab.asyncAppend(), new Error('error in cb1'));
  ab.append(3);
  var cb2 = partial(ab.asyncAppend(), null, 4);
  ab.complete();

  setTimeout(cb1, 10);
  setTimeout(cb2, 20);
});

test('also works with new', function(t) {
  var Builder = require('../asyncbuilder');
  var ab = new Builder(function(err, data) {
    t.true(ab instanceof Builder);
    t.deepEqual(data[1,2,3,4]);
    t.equal(err, null);
    t.end();
  });

  var cb1 = partial(ab.asyncAppend(), null, 1);
  ab.append(2);
  var cb2 = partial(ab.asyncAppend(), null, 3);
  ab.append(4);

  ab.complete();
  setTimeout(cb1, 20);
  setTimeout(cb2, 10);
});

test('noop builder returns []', function(t) {
  var ab = builder(function(err, data) {
    t.deepEqual(data, []);
    t.equal(err, null);
    t.end();
  });

  ab.complete();
});

test('asyncAppend() after complete() returns error', function(t) {
  var ab = builder(function(err, data) {
    t.true(err instanceof Error);
    t.end();
  });

  var cb1 = partial(ab.asyncAppend(), null, 1);
  ab.complete();
  var cb2 = partial(ab.asyncAppend(), null, 2);

  setTimeout(cb1, 20);
  setTimeout(cb2, 10);
});

test('append() after mainCallBack throws', function(t) {
  var ab = builder(function(err, data) {
    t.deepEqual(data[1,2]);
    t.equal(err, null);
    t.end();
  });

  ab.append(1);
  ab.append(2);
  ab.complete();
  t.throws(function() { ab.append(3); });
});

test('asyncAppend() after mainCallBack throws', function(t) {
  var ab = builder(function(err, data) {
    t.deepEqual(data[1,2]);
    t.equal(err, null);
    t.end();
  });

  ab.append(1);
  ab.append(2);
  ab.complete();
  t.throws(function() { ab.asyncAppend(); });
});

test('missing complete() times out', function(t) {
  var callbackCalled = false;
  setTimeout(function() {
    t.false(callbackCalled);
    t.end();
  }, 100);
  var ab = builder(function(err, data) {
    callbackCalled = true;
  });

  ab.append(1);
  ab.append(2);
  ab.append(3);
});

test('multiple complete() ok', function(t) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    t.false(callbackCalled);
    callbackCalled = true;
    t.deepEqual(data[1,2,3,4]);
    t.equal(err, null);
    t.end();
  });

  ab.append(1);
  var cb1 = partial(ab.asyncAppend(), null, 2);
  ab.append(3);
  ab.append(4);
  ab.complete();
  ab.complete();
  ab.complete();
  setTimeout(cb1, 20);
});

test('duplicate callbacks ok', function(t) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    t.false(callbackCalled);
    callbackCalled = true;
    t.deepEqual(data[1,2,3,4]);
    t.equal(err, null);
    t.end();
  });

  ab.append(1);
  var cb1 = partial(ab.asyncAppend(), null, 2);
  ab.append(3);
  ab.append(4);
  ab.complete();
  setTimeout(cb1, 20);
  setTimeout(cb1, 20);
});

test('premature non-error callback ok', function(t) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    t.false(callbackCalled);
    callbackCalled = true;
    t.deepEqual(data[1,2,3,4]);
    t.equal(err, null);
    t.end();
  });

  ab.append(1);
  ab.asyncAppend()(null, 2);
  ab.append(3);
  ab.append(4);
  ab.complete();
});

test('premature callback error ok', function(t) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    t.false(callbackCalled);
    callbackCalled = true;
    t.true(err instanceof Error);
    t.end();
  });

  ab.append(1);
  ab.asyncAppend()(new Error('premature callback error'));
  ab.append(3);
  ab.append(4);
  ab.complete();
});
