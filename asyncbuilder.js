/*
 * asyncbuilder
 * simple semi-asynchronous list builder
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
*/

module.exports = asyncbuilder;

function asyncbuilder(mainCallBack) {

  if (!(this instanceof asyncbuilder)) return new asyncbuilder(mainCallBack);

  // private
  var results = [];
  var pending = 0;
  var isComplete = false;
  var spent = false;

  // public
  this.append = append;
  this.asyncAppend = asyncAppend;
  this.complete = complete;

  //--//--//--//--//--//--//--//--//--//

  // append result immediately (no callback required)
  function append(result) {
    if (spent) throw new Error('asyncbuilder.append() after mainCallBack');
    if (isComplete) {
      completedErr();
      return;
    }
    results.push(result);
  };

  // reserve a slot and return a callback(err, result) for async result
  // the callback inserts the result into the slot (or propagetes any error)
   function asyncAppend() {
    if (spent) throw new Error('asyncbuilder.asyncAppend() after mainCallBack');
    if (isComplete) {
      completedErr();
      return function(){};
    }
    var slot = results.push('') - 1;
    pending++;
    return function(err, result) {
      if (err) {
        if (!spent) {
          spent = true;
          mainCallBack(err);
        }
        return;
      }
      results[slot] = result;
      pending--;
      if (isComplete && !spent && !pending) {
        spent = true;
        mainCallBack(null, results);
      }
    }
  };

  // call ab.complete() after the last append() or asyncAppend()
  function complete() {
    isComplete = true;
    if (!pending && !spent) {
      spent = true;
      process.nextTick(function() {
        mainCallBack(null, results);
      });
    }
  };

  function completedErr() {
    if (!spent) {
      spent = true;
      process.nextTick(function() {
        mainCallBack(new Error('asyncbuilder append after complete.'));
      });
    }
  }

}