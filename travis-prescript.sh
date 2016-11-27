npm install -g grunt-cli

# Work around for phantomjs+yarn install bug
# See this issue for info: https://github.com/yarnpkg/yarn/issues/1538
TMPDIR= $npm_config_tmp
export TMPDIR