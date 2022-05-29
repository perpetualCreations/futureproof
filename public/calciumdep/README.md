# Notice
Because JavaScript files used by web workers cannot import required NPM libraries from `node_modules` in a production setting, they are instead copied into this directory upon build, and used from here instead.
