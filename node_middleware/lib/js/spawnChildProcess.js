var child_process = require('child_process');

var spawnChildProcess = function (execCommand, execArgs, stdoutParser, onEndCallback, stdinWriter) {
  // console.log("spawnChildProcess args are ")
  // console.log(execArgs)
  var processor = child_process.spawn(execCommand, execArgs, {stderr: ['pipe', 'pipe', process.stderr]})
  var accumulating_context = {}
  processor.stdout.on('data', function(data) {
    var stdoutstr = String(data);
    // This may be multiline
    var lines = stdoutstr.split('\n');
    lines.forEach(function(stdout_line) {
      stdoutParser(stdout_line, accumulating_context)
    })
  })
  processor.on('error', function(err) {
    console.log(execCommand + ": got error:");
    console.log(err);
  })
  processor.stderr.on('data', function(err) {
    console.log(execCommand + ": got error:");
    console.log(err);
  })
  processor.on('exit', function(data, signal) {
    // console.log(execCommand + ": on exit, got data :");
    // console.log(data);
    // console.log(execCommand + ": and signal:");
    // console.log(signal);
    onEndCallback(accumulating_context);
  });
  if (stdinWriter) {
    stdinWriter(processor.stdin);
  };
}

module.exports = spawnChildProcess
