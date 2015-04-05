/**
 * test-asyncbuilder
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

suite('test-asyncbuilder');
var _ = require('underscore');

var should = require('should');
var builder = require('../asyncbuilder');

test('instanceof', function() {
  builder().should.be.an.instanceof(builder);
});

test('no append or asyncAppend', function(done) {
  var completed = false;
  var ab = builder(function(err, data) {
    data.should.eql([]);
    (err === null).should.be.true;
    completed.should.be.true;
    done();
  });

  ab.complete();
  completed = true;
});

test('append only without async', function(done) {
  var completed = false;
  var ab = builder(function(err, data) {
    data.should.eql([1,2,3,4]);
    (err === null).should.be.true;
    completed.should.be.true;
    done();
  });

  ab.append(1);
  ab.append(2);
  ab.append(3);
  ab.append(4);
  ab.complete();
  completed = true;
});

test('append/asyncAppend ordering is preserved', function(done) {
  var ab = builder(function(err, data) {
    data.should.eql([1,2,3,4]);
    (err === null).should.be.true;
    done();
  });

  ab.append(1);
  var cb1 = _.partial(ab.asyncAppend(), null, 2);
  ab.append(3);
  var cb2 = _.partial(ab.asyncAppend(), null, 4);
  ab.complete();

  setTimeout(cb1, 20); // first async operation finishes last
  setTimeout(cb2, 10); // last async operation finishes first
});

test('async error after other callback', function(done) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    callbackCalled.should.be.false;
    callbackCalled = true;
    err.should.be.an.Error;
    done();
  });

  ab.append(1);
  var cb1 = _.partial(ab.asyncAppend(), null, 2);
  ab.append(3);
  var cb2 = _.partial(ab.asyncAppend(), new Error('error in cb2'));
  ab.complete();

  setTimeout(cb1, 10);
  setTimeout(cb2, 20);
});

test('async error before other callback', function(done) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    callbackCalled.should.be.false;
    callbackCalled = true;
    err.should.be.an.Error;
    done();
  });

  ab.append(1);
  var cb1 = _.partial(ab.asyncAppend(), null, 2);
  ab.append(3);
  var cb2 = _.partial(ab.asyncAppend(), new Error('error in cb2'));
  ab.complete();

  setTimeout(cb1, 20);
  setTimeout(cb2, 10);
});


test('multiple async errors', function(done) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    callbackCalled.should.be.false;
    callbackCalled = true;
    err.should.be.an.Error;
    done();
  });

  ab.append(1);
  var cb1 = _.partial(ab.asyncAppend(), new Error('error in cb1'));
  ab.append(3);
  var cb2 = _.partial(ab.asyncAppend(), new Error('error in cb2'));
  ab.complete();

  setTimeout(cb1, 20);
  setTimeout(cb2, 10);
});


test('callback after async error', function(done) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    callbackCalled.should.be.false;
    callbackCalled = true;
    err.should.be.an.Error;
    setTimeout(done, 40); // not sure how mocha handles repeated calls to done
  });

  ab.append(1);
  var cb1 = _.partial(ab.asyncAppend(), new Error('error in cb1'));
  ab.append(3);
  var cb2 = _.partial(ab.asyncAppend(), null, 4);
  ab.complete();

  setTimeout(cb1, 10);
  setTimeout(cb2, 20);
});

test('also works with new', function(done) {
  var Builder = require('../asyncbuilder');
  var ab = new Builder(function(err, data) {
    ab.should.be.an.instanceof(Builder);
    data.should.eql([1,2,3,4]);
    (err === null).should.be.true;
    done();
  });

  var cb1 = _.partial(ab.asyncAppend(), null, 1);
  ab.append(2);
  var cb2 = _.partial(ab.asyncAppend(), null, 3);
  ab.append(4);

  ab.complete();
  setTimeout(cb1, 20);
  setTimeout(cb2, 10);
});

test('noop builder returns []', function(done) {
  var ab = builder(function(err, data) {
    data.should.eql([]);
    (err === null).should.be.true;
    done();
  });

  ab.complete();
});

test('asyncAppend() after complete() returns error', function(done) {
  var ab = builder(function(err, data) {
    err.should.be.an.Error;
    done();
  });

  var cb1 = _.partial(ab.asyncAppend(), null, 1);
  ab.complete();
  var cb2 = _.partial(ab.asyncAppend(), null, 2);

  setTimeout(cb1, 20);
  setTimeout(cb2, 10);
});

test('append() after mainCallBack throws', function(done) {
  var ab = builder(function(err, data) {
    data.should.eql([1,2]);
    (err === null).should.be.true;
    done();
  });

  ab.append(1);
  ab.append(2);
  ab.complete();
  (function() { ab.append(3); }).should.throw();
});

test('asyncAppend() after mainCallBack throws', function(done) {
  var ab = builder(function(err, data) {
    data.should.eql([1,2]);
    (err === null).should.be.true;
    done();
  });

  ab.append(1);
  ab.append(2);
  ab.complete();
  (function() { ab.asyncAppend(); }).should.throw();
});

test('missing complete() times out', function(done) {
  var callbackCalled = false;
  setTimeout(function() {
    callbackCalled.should.be.false;
    done();
  }, 100);
  var ab = builder(function(err, data) {
    callbackCalled = true;
  });

  ab.append(1);
  ab.append(2);
  ab.append(3);
});

test('multiple complete() ok', function(done) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    callbackCalled.should.be.false;
    callbackCalled = true;
    data.should.eql([1,2,3,4]);
    (err === null).should.be.true;
    done();
  });

  ab.append(1);
  var cb1 = _.partial(ab.asyncAppend(), null, 2);
  ab.append(3);
  ab.append(4);
  ab.complete();
  ab.complete();
  ab.complete();
  setTimeout(cb1, 20);
});

test('duplicate callbacks ok', function(done) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    callbackCalled.should.be.false;
    callbackCalled = true;
    data.should.eql([1,2,3,4]);
    (err === null).should.be.true;
    done();
  });

  ab.append(1);
  var cb1 = _.partial(ab.asyncAppend(), null, 2);
  ab.append(3);
  ab.append(4);
  ab.complete();
  setTimeout(cb1, 20);
  setTimeout(cb1, 20);
});

test('premature non-error callback ok', function(done) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    callbackCalled.should.be.false;
    callbackCalled = true;
    data.should.eql([1,2,3,4]);
    (err === null).should.be.true;
    done();
  });

  ab.append(1);
  ab.asyncAppend()(null, 2);
  ab.append(3);
  ab.append(4);
  ab.complete();
});

test('premature callback error ok', function(done) {
  var callbackCalled = false;
  var ab = builder(function(err, data) {
    callbackCalled.should.be.false;
    callbackCalled = true;
    err.should.be.an.Error;
    done();
  });

  ab.append(1);
  ab.asyncAppend()(new Error('premature callback error'));
  ab.append(3);
  ab.append(4);
  ab.complete();
});

