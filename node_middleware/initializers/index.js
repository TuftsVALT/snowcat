// The initializers folder is responsible for startup and configuration
var logger = require('morgan');
var express = require('express');
var app = express();
var path = require('path');

// fix for this yarn bug: https://github.com/yarnpkg/yarn/issues/3636
// will probably be fixed in newer versions of yarn
function fixPath() {
  let splitPath = process.env.PATH.split(":");
  let set = new Set();
  let newPath = "";
  for (let i = splitPath.length - 1; i >= 0; i--) {
    //normalize path
    let p = path.format(path.parse(splitPath[i]));
    if (!set.has(p)) {
      set.add(p);
      newPath = p + (newPath ? ":" : "") + newPath;
    }
  }
  process.env.PATH = newPath;
}
//console.log("PATH before", process.env.PATH);
fixPath();
//console.log("PATH after", process.env.PATH);

module.exports.set = function(app) {

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
  });

  // Express app setup
  app.use(logger('dev'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static('datasets'));
  app.use(express.static('local_tmp_storage'));

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // res.locals.error = err;

    // I can't believe this, but by default express seems to silently swallow
    // errors and their messages.  Seriously.
    console.log(err);

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

}
