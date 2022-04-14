#!/bin/bash

# Enable job control
set -m

# Pull in config values
source ./developer-observatory.conf

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
  echo -e "manager\t\t Runs the manager script. Should be run at the same time as the primary app"
  echo -e "backup-db\t Backs up the entire database to a .sql file"
  echo -e "export-db\t Exports the database to a series of .csv files"
  echo -e "recreate\t Given a service name, recreates a running container with new configuration"
  echo -e "down\t\t Alias for compose down"
  echo -e "reset\t\t Completely resets the application to the inital state - ALL DATA IS DELETED"
  echo -e "compose\t\t Any commands after compose will be sent to a docker-compose with the correct arguments"
  echo -e "load-basic\t Loads basic programming tasks into generator. \n\t\t Helpful for running the developer observatory without creating tasks"
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
    mkdir -p containers/submit/tasks/
    cp -r generator/generated/* containers/submit/tasks/
  else
    echo -ne "${RED}It seems there are no tasks generated. Please generate "
    echo -e  "tasks first before configuring. ${NC}"
    exit 1
  fi

  # Generate a logLevel variable based on the appMode. Used for python
  # logging modules.
  if [[ $appMode == "DEBUG" ]]; then
    logLevel="DEBUG"
  else
    logLevel="INFO"
  fi

  # Configuring secrets, since this has persistence
  if [[ ! -f config/.secrets ]]; then
    #Generate Passwords for the database in the first run. Replace in the files directly
    pwUser0=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    pwUser1=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    pwUser2=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    pwUser3=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    submitSecret=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

    echo -e "#!/bin/bash\npwUser0=$pwUser0\npwUser1=$pwUser1\npwUser2=$pwUser2\npwUser3=$pwUser3\nsubmitSecret=$submitSecret" > config/.secrets
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
  sed -i "s|%logLevel%|$logLevel|g" containers/control/config.py
  sed -i "s|%instanceIdleTime%|$instanceIdleTime|g" containers/control/config.py


  # Submit
  cp config/submit.py containers/submit/configSubmit.py
  sed -i "s|%pwUser2%|$pwUser2|g" containers/submit/configSubmit.py
  sed -i "s|%finalSurveyURL%|$finalSurveyURL|g" containers/submit/configSubmit.py
  sed -i "s|%submitSecret%|$submitSecret|g" containers/submit/configSubmit.py

  # Manager
  cp config/manager_config.py manager/
  sed -i "s|%instancesNetwork%|$instancesNetwork|g" manager/manager_config.py
  sed -i "s|%poolSize%|$poolSize|g" manager/manager_config.py
  sed -i "s|%logLevel%|$logLevel|g" manager/manager_config.py
  sed -i "s|%dockerProjectName%|$dockerProjectName|g" manager/manager_config.py

  # Postgres
  mkdir -p containers/postgres
  cp config/Postgres.docker containers/postgres/Dockerfile
  cp config/dbSchema.sql containers/postgres/
  cp generator/generated/dbSchema.sql containers/postgres/taskSchema.sql
  sed -i "s|%pwUser0%|$pwUser0|g" containers/postgres/Dockerfile
  sed -i "s|%pwUser1%|$pwUser1|g" containers/postgres/dbSchema.sql
  sed -i "s|%pwUser2%|$pwUser2|g" containers/postgres/dbSchema.sql
  sed -i "s|%pwUser3%|$pwUser3|g" containers/postgres/dbSchema.sql

  # Instance
  cp instance/template/app.py instance/app.py
  cp instance/template/custom.js instance/jupyter/
  sed -i "s|%landingURL%|$landingURL|g" instance/app.py
  sed -i "s|%appMode%|$appMode|g" instance/app.py
  sed -i "s|%submitSecret%|$submitSecret|g" instance/app.py
  sed -i "s|%landingURL%|$landingURL|g" instance/jupyter/custom.js
  sed -i "s|%skippedTaskSurveyURL%|$skippedTaskSurveyURL|g" instance/jupyter/custom.js
  sed -i "s|%taskCount%|$taskCount|g" instance/jupyter/custom.js
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
  $COMPOSE -p $dockerProjectName $*
}

exportTable() {
  # This command does not work with runCompose
  checkCompose
  echo "Exporting $2/$1.csv"
  $COMPOSE -p $dockerProjectName exec db psql -q -P pager --csv -c "SELECT * FROM \"$1\"" notebook postgres > $2/$1.csv 
}


if [[ -z $1 ]]; then
  usage
elif [[ $1 == "install" ]]; then
  echo "Installing developer observatory"
  apt-get install docker docker-compose python3 python3-pip
  pip install --user docker redis

elif [[ $1 == "generate" ]]; then
  docker build generator/ \
    -t "$dockerProjectName-generator" \
    --build-arg uid=$UID

  echo "Finished building task generator"

  mkdir -p $PWD/generator/generated
  mkdir -p $PWD/generator/tmp
  docker run --rm -p 9000:9000 \
          --mount type=bind,src=$PWD/generator/generated,dst=/home/user/generated \
          --mount type=bind,src=$PWD/generator/tmp,dst=/home/user/tmp \
          "$dockerProjectName-generator" &
  P1=$!
  sleep 2 && echo -e "${GREEN}Task generator started. Connect your browser to port 9000 to connect.$NC" &&\
    echo "Ctrl-c to stop the generator."
  fg

elif [[ $1 == "configure" ]]; then
  build_config

elif [[ $1 == "run" ]]; then
  build_config

  runCompose build && runCompose up
elif [[ $1 == "manager" ]]; then
  if [[ ! -d manager/pyenv ]]; then
    echo "Creating venv for manager..."
    python3 -m venv manager/pyenv
    source ./manager/pyenv/bin/activate
    pip install -r manager/requirements.txt
  else
    source ./manager/pyenv/bin/activate
  fi

  build_config
  python3 ./manager/app.py

elif [[ $1 == "backup-db" ]]; then
  backupFile=backups/$(date +"%m-%d-%Y:%H-%M").sql
  mkdir -p backups
  runCompose exec db pg_dump -U postgres notebook > $backupFile

elif [[ $1 == "export-db" ]]; then
  exportFolder=exports/$(date +"%m-%d-%Y:%H-%M")
  mkdir -p exports
  mkdir $exportFolder
  # Export tables
  exportTable "createdInstances" $exportFolder
  exportTable "consent" $exportFolder
  exportTable "jupyter" $exportFolder

elif [[ $1 == "recreate" ]]; then
  if [[ -n $2 ]]; then
    runCompose up -d --build $2
  else
    echo -e "${RED}You must specifiy a service to recreate$NC"
  fi

elif [[ $1 == "down" ]]; then
  runCompose down

elif [[ $1 == "reset" ]]; then
  echo -e "${RED}WARNING: THIS WILL CLEAR ALL OF YOUR DATA, INCLUDING STUDY RESULTS${NC}"
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
  rm -f instance/app.py
  rm -f instance/jupyter/custom.js

  # Purge db volume
  docker volume rm devob-data

elif [[ $1 == "compose" ]]; then
  shift
  runCompose $@

elif [[ $1 == "load-basic" ]]; then
  if [[ -f generator/tmp/db.sqlite ]]; then
    echo -e "${RED}ERROR: Refusing to overwrite existing task database.${NC}"
    echo -e "Please backup or remove files in generator/tmp/ before continuing"
    exit 1
  fi

  mkdir -p generator/tmp
  cp config/basic_tasks.sqlite generator/tmp/db.sqlite
  echo "Basic tasks loaded into generator. Please run dev-ob.sh generate and \
generate the task files from the web interface"

elif [[ $1 == "docs" ]]; then
  python3 -m http.server --directory doc/html

else
  echo -e "${RED}Unknown command: $1${NC}"
  exit 1
fi
