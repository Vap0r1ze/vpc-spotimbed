const esbuild = require('esbuild')

esbuild.build({
  platform: 'node',
  bundle: true,
  outfile: './index.js',
  entryPoints: ['src/index.js'],
  external: ['powercord/*'],
  minify: true,
}).catch(error => {
  console.error(error)
  process.exit(1)
})
