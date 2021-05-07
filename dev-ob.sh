#!/bin/bash

source ./developer-observatory.conf

RED='\033[1;31m'
NC='\033[0m' # No Color

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
    if [[ ! -f config/secrets ]]; then
        cp config/Postgres.docker containers/postgres/Dockerfile
        cp config/dbSchema.sql containers/postgres/
        cp generator/generated/dbSchema.sql containers/postgres/taskSchema.sql
        #Generate Passwords for the database in the first run. Replace in the files directly
        pwUser0=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        pwUser1=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        pwUser2=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        pwUser3=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        sed -i "s|%pwUser0%|$pwUser0|g" containers/postgres/Dockerfile
        sed -i "s|%pwUser1%|$pwUser1|g" containers/postgres/dbSchema.sql
        sed -i "s|%pwUser2%|$pwUser2|g" containers/postgres/dbSchema.sql
        sed -i "s|%pwUser3%|$pwUser3|g" containers/postgres/dbSchema.sql

        echo -e "#/bin/bash\npwUser0=$pwUser0\npwUser1=$pwUser1\npwUser2=$pwUser2\npwUser3=$pwUser3" > config/secrets
    else
        source config/secrets
    fi


    cp config/landing.php containers/landing/webpageConf/config.php
    cp config/redis.conf containers/redis/
    cp config/submit.py containers/submit/configSubmit.py
    cp config/manager_config.py manager/


    sed -i "s|%pwUser1%|$pwUser1|g" containers/landing/webpageConf/config.php
    sed -i "s|%finalSurveyURL%|$finalSurveyURL|g" containers/landing/webpageConf/config.php

    sed -i "s|%pwUser2%|$pwUser2|g" containers/submit/configSubmit.py
    sed -i "s|%finalSurveyURL%|$finalSurveyURL|g" containers/submit/configSubmit.py

    sed -i "s|%poolSize%|$poolSize|g" manager/manager_config.py

    #sed -i "s|%pwUser2%|$pwUser2|g" landing/submit/configSubmitDB.py

    # Generate configuration file for landing server
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

    cd instance/
    . configure_instance.sh
    cd ..
}


if [[ -z $1 ]]; then
    echo "Developer Observatory Control Script"
    echo "Usage: dev-ob.sh [command]"
    echo -e "\nAvailable commands:"
    echo -e "install\t\t Installs all required packages and sets up services"
    echo -e "generate\t Runs the notebook task generator"
    echo -e "configure\t Generates configuration files"
    echo -e "start\t\t Configures and starts the docker application"
    echo -e "reset\t\t Completely resets the application to the inital state - ALL DATA IS DELETED"
elif [[ $1 == "install" ]]; then
    echo "Installing developer observatory"
    apt-get install docker docker-compose python3 python3-pip
    pip install --user docker redis

elif [[ $1 == "generate" ]]; then
    docker build generator/ -t "devob-generator"

    if [[ ! -d generator/generated ]]; then
        mkdir generator/generated
    fi

    docker run --rm -p 9000:9000 --mount type=bind,src=$PWD/generator/generated,dst=/usr/src/app/generated devob-generator


elif [[ $1 == "configure" ]]; then
    build_config

elif [[ $1 == "start" ]]; then
    build_config
    docker-compose build && docker-compose -p dev-ob up
elif [[ $1 == "reset" ]]; then
    echo -e "${RED} WARNING: THIS WILL CLEAR ALL OF YOUR DATA, INCLUDING STUDY RESULTS${NC}"
    prompt_confirm "Reset this developer observatory to its initial state" || exit 0

    # Run docker-compose down
    docker-compose -p dev-ob down

    # Clean secrets
    rm config/secrets

    # Clean task files
    rm -r containers/submit/tasks

    # Clean generated configuration files
    rm containers/landing/webpageConf/config.php
    rm containers/postgres/*.sql
    rm containers/postgres/Dockerfile
    rm containers/submit/configSubmit.py
    rm manager/manager_config.py

    # Purge db volume
    docker volume rm devob-data

else
    echo -e "${RED}Unknown command: $1${NC}"
    exit 1
fi
