# If this isn't a PR, and occurs on the develop branch, push crafty.js to craftyjs/Crafty-Distro
if [ "$TRAVIS_PULL_REQUEST" == "false" ] && [ "$TRAVIS_BRANCH" == "develop" ]; then
  echo -e "Uploading nightly build to craftyjs/Crafty-Distro\n" 
  # Log some git info to the file commit_date
  TZ=UTC git log -n 1 --format=format:"built from commit %h (%cd) of 'develop' branch" --date=local > commit_date
  #Clone the nightlies branch into the nightlies directory
  git clone -b nightlies https://${GH_TOKEN}@github.com/craftyjs/Crafty-Distro.git $HOME/nightlies
  mv $TRAVIS_BUILD_DIR/crafty.js $HOME/nightlies
  mv $TRAVIS_BUILD_DIR/commit_date $HOME/nightlies/README.md
  cd $HOME/nightlies
  git config user.name "Travis"
  git config user.email "travis@travis-ci.org"
  git add crafty.js README.md
  git commit -m "automated commit of Travis build $TRAVIS_BUILD_NUMBER"
  git push origin nightlies
fi