'use strict'

// build pipeline
require('./babel-convert-all-jsfiles')
require('./babel-convert-all-scssfiles')
require('./build-language-files')
require('./resort-language-file-keys')
