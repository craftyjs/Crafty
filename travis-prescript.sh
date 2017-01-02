if [ "$TRAVIS_BRANCH" != "testing" ]; then unset SAUCE_USERNAME && unset SAUCE_ACCESS_KEY; fi

# Work around for phantomjs+yarn install bug
# See this issue for info: https://github.com/yarnpkg/yarn/issues/1538
TMPDIR= $npm_config_tmp
export TMPDIR