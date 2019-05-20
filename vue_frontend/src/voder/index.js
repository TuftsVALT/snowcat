/**
 * The file enables `@/voder/index.js` to import all voder modules
 */

const files = require.context('.', false, /\.js$/)
const voderModules = {}

files.keys().forEach((key) => {
  if (key === './index.js') return
  voderModules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default
})

export default voderModules
