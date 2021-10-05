#!/bin/bash

# Enable job control
set -m

# Pull in config values
source ./developer-observatory.conf

dockerProjectName="devob"
instancesNetwork="${dockerProjectName}_instances"

# Colors
RED='\033[1;31m'
GREEN='\033[32m'
NC='\033[0m' # No Color

usage() {
    echo "Developer Observatory Control Script"
    echo "Usage: dev-ob.sh [command]"
    echo -e "\nAvailable commands:"
    echo -e "install\t\t Installs all required packages and sets up services"
    echo -e "generate\t Runs the notebook task generator"
    echo -e "configure\t Generates configuration files"
    echo -e "run\t\t Configures and runs the docker application in current terminal"
    echo -e "down\t\t Alias for compose down"
    echo -e "reset\t\t Completely resets the application to the inital state - ALL DATA IS DELETED"
    echo -e "compose\t\t Any commands after compose will be sent to a docker-compose with the correct arguments"
    echo -e "docs\t\t Start a HTTP server to view documentation in doc/ directory"
}

prompt_confirm() {
  while true; do
    read -r -n 1 -p "${1:-Continue?} [y/n]: " REPLY
    case $REPLY in
      [yY]) echo ; return 0 ;;
      [nN]) echo ; return 1 ;;
      *) printf " ${RED} %s \n${NC}" "invalid input"
    esac
  done
}

build_config() {
    if [[ -d "generator/generated" ]]; then
        echo "Generating configuration files and secrets"
        cp -r generator/generated containers/submit/tasks
    else
        echo -ne "${RED} It seems there are no tasks generated. Please generate "
        echo -e  "tasks first before configuring. ${NC}"
        exit 1
    fi

    # Configuring secrets, since this has persistence
    if [[ ! -f config/.secrets ]]; then
        #Generate Passwords for the database in the first run. Replace in the files directly
        pwUser0=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        pwUser1=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        pwUser2=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        pwUser3=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

        echo -e "#!/bin/bash\npwUser0=$pwUser0\npwUser1=$pwUser1\npwUser2=$pwUser2\npwUser3=$pwUser3" > config/.secrets
    else
        source config/.secrets
    fi

    # Copy config files into place


    # Landing
    cp config/landing.php containers/landing/webpageConf/config.php
    sed -i "s|%pwUser1%|$pwUser1|g" containers/landing/webpageConf/config.php
    sed -i "s|%finalSurveyURL%|$finalSurveyURL|g" containers/landing/webpageConf/config.php
    sed -i "s|%dailyMaxInstances%|$dailyMaxInstances|g" containers/landing/webpageConf/config.php
    sed -i "s|%maxInstances%|$maxInstances|g" containers/landing/webpageConf/config.php
    sed -i "s|%recaptchaSiteKey%|$recaptchaSiteKey|g" containers/landing/webpageConf/config.php
    sed -i "s|%recaptchaSecret%|$recaptchaSecret|g" containers/landing/webpageConf/config.php
    sed -i "s|%awsLang%|$awsLang|g" containers/landing/webpageConf/config.php
    sed -i "s|%awsAccessKey%|$awsAccessKey|g" containers/landing/webpageConf/config.php
    sed -i "s|%awsSecretKey%|$awsSecretKey|g" containers/landing/webpageConf/config.php
    sed -i "s|%awsRegion%|$awsRegion|g" containers/landing/webpageConf/config.php
    sed -i "s|%awsImageId%|$awsImageId|g" containers/landing/webpageConf/config.php
    sed -i "s|%awsInstanceType%|$awsInstanceType|g" containers/landing/webpageConf/config.php
    sed -i "s|%awsSecurityGroupID%|$awsSecurityGroupID|g" containers/landing/webpageConf/config.php
    sed -i "s|%sshKeyName%|$awsSshKeyName|g" containers/landing/webpageConf/config.php
    sed -i "s|%poolSize%|$poolSize|g" containers/landing/webpageConf/config.php
    sed -i "s|%tokenGetUrl%|$tokenGetUrl|g" containers/landing/webpageConf/config.php
    sed -i "s|%tokenSetUrl%|$tokenSetUrl|g" containers/landing/webpageConf/config.php

    # Control
    cp config/control_config.py containers/control/config.py
    sed -i "s|%pwUser2%|$pwUser2|g" containers/control/config.py

    # Submit
    cp config/submit.py containers/submit/configSubmit.py
    sed -i "s|%pwUser2%|$pwUser2|g" containers/submit/configSubmit.py
    sed -i "s|%finalSurveyURL%|$finalSurveyURL|g" containers/submit/configSubmit.py

    # Manager
    cp config/manager_config.py manager/
    sed -i "s|%instancesNetwork%|$instancesNetwork|g" manager/manager_config.py
    sed -i "s|%poolSize%|$poolSize|g" manager/manager_config.py
    sed -i "s|%logLevel%|$logLevel|g" manager/manager_config.py

    # Postgres
    cp config/Postgres.docker containers/postgres/Dockerfile
    cp config/dbSchema.sql containers/postgres/
    cp generator/generated/dbSchema.sql containers/postgres/taskSchema.sql
    sed -i "s|%pwUser0%|$pwUser0|g" containers/postgres/Dockerfile
    sed -i "s|%pwUser1%|$pwUser1|g" containers/postgres/dbSchema.sql
    sed -i "s|%pwUser2%|$pwUser2|g" containers/postgres/dbSchema.sql
    sed -i "s|%pwUser3%|$pwUser3|g" containers/postgres/dbSchema.sql

    cd instance/
    . configure_instance.sh
    cd ..
}

checkCompose() {
  COMPOSE=$(which docker-compose 2>/dev/null)
  if [ ! $? == 0 ]; then
    if docker compose > /dev/null; then
      COMPOSE="$(which docker) compose"
    else
      echo -e "${RED}No available docker compose command found. Exiting.$NC"
      exit 1
    fi
  fi
}

runCompose() {
  checkCompose
  $COMPOSE -p $dockerProjectName $@
}


if [[ -z $1 ]]; then
  usage
elif [[ $1 == "install" ]]; then
  echo "Installing developer observatory"
  apt-get install docker docker-compose python3 python3-pip
  pip install --user docker redis

elif [[ $1 == "generate" ]]; then
  docker build generator/ -t "$dockerProjectName-generator"

  if [[ ! -d generator/generated ]]; then
    mkdir generator/generated
  fi

  echo "Finished building task generator"

  docker run --rm -p 9000:9000 --mount type=bind,src=$PWD/generator/generated,dst=/usr/src/app/generated "$dockerProjectName-generator" &
  P1=$!
  sleep 2 && echo -e "${GREEN}Task generator started. Connect your browser to port 9000 to connect.$NC" &&\
    echo "Ctrl-c to stop the generator."
  fg

elif [[ $1 == "configure" ]]; then
  build_config

elif [[ $1 == "run" ]]; then
  build_config

  runCompose build && runCompose up
elif [[ $1 == "down" ]]; then
  runCompose down
elif [[ $1 == "reset" ]]; then
  echo -e "${RED} WARNING: THIS WILL CLEAR ALL OF YOUR DATA, INCLUDING STUDY RESULTS${NC}"
  prompt_confirm "Reset this developer observatory to its initial state" || exit 0

  # Bring compose down
  runCompose down

  # Clean secrets
  rm -f config/.secrets

  # Clean task files
  rm -rf containers/submit/tasks

  # Clean generated configuration files
  rm -f containers/landing/webpageConf/config.php
  rm -f containers/postgres/*.sql
  rm -f containers/postgres/Dockerfile
  rm -f containers/submit/configSubmit.py
  rm -f containers/control/config.py
  rm -f manager/manager_config.py

  # Purge db volume
  docker volume rm devob-data

elif [[ $1 == "compose" ]]; then
  shift
  runCompose $@
elif [[ $1 == "docs" ]]; then
  python -m http.server --directory doc/
else
  echo -e "${RED}Unknown command: $1${NC}"
  exit 1
fi
