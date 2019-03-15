/**
 * The file enables `@/store/index.js` to import all components
 * in a one-shot manner. There should not be any reason to edit this file.
 */

const files = require.context('.', true, /\.(js|vue)$/i)
const modules = {}

files.keys().forEach(key => {
  if (key === './index.js') return
  const name = key.match(/\w+/)[0]
  modules[name] = files(key).default
})

export default modules
