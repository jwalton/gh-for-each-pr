#!/bin/bash

# This creates a new release tag for a GitHub action.   This will create a tag
# for the new version, delete and re-tag the major version (e.g. `v1`), and
# create a release in GitHub.
#
# To use, you need to have the following installed:
#
# * `gh` - The GitHub CLI - https://cli.github.com/
#

MASTER_BRANCH=main

function confirm() {
    read -r -p "Is this OK? [Y/n] " input

    case $input in
        [yY][eE][sS]|[yY]|"")
                echo yes
                ;;
        [nN][oO]|[nN])
                echo no
                ;;
        *)
                echo "Invalid input..."
                exit 1
                ;;
    esac
}

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$MASTER_BRANCH" ]; then
  echo "You must be on the ${MASTER_BRANCH} branch to create a new release."
  exit 1
fi

if ! command -v gh &> /dev/null
then
    echo "gh command not found: https://cli.github.com/"
    echo "If on mac, run `brew install gh` and try again."
    exit 1
fi

if ! command -v node &> /dev/null
then
    echo "node command not found"
    exit 1
fi

if ! command -v npm &> /dev/null
then
    echo "npm command not found"
    exit 1
fi

# First, work out the new version number
if [ -z "$1" ]; then
  echo "Usage: makeRelease.sh [<newversion> | major | minor | patch]"
  exit 1
fi

echo "Bumping version"
if ! NEXT_VERSION=$(npm version "${1}"); then
  echo "Bumping version in NPM failed"
fi

MAJOR_VERSION=$(node -e "console.log('v' + require('./package.json').version.split('.')[0])")
echo "Updated version: ${NEXT_VERSION}, Major version: ${MAJOR_VERSION}"
if [ $(confirm) == "no" ]; then
  echo "Aborting."
  exit 1
fi

set -e

echo "Retagging ${MAJOR_VERSION}"
git tag -d ${MAJOR_VERSION} && \
  git push --delete origin ${MAJOR_VERSION} && \
  git tag -a ${MAJOR_VERSION} -m ${NEXT_VERSION} && \
  git push --follow-tags

echo "Generating release in GitHub..."
gh release create --generate-notes ${NEXT_VERSION}