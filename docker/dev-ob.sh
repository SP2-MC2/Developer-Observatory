source ./developer-observatory.conf

taskfilesBasePath="$PWD/../task_generation/generated/"

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


if [[ -z $1 ]]; then
    echo "Developer Observatory Control Script"
    echo "Usage: dev-ob.sh [command]"
    echo -e "\nAvailable commands:"
    echo -e "install\t\t Installs all required packages and sets up services"
    echo -e "configure\t Generates and complies configuration files"
    echo -e "start\t\t Configures and starts the docker application"
    echo -e "reset\t\t Completely resets the application to the inital state - ALL DATA IS DELETED"
elif [[ $1 == "install" ]]; then
    echo "Installing developer observatory"
elif [[ $1 == "configure" ]]; then
    echo "Generating configuration files and secrets"

    cp config/landing.php landing/webpageConf/config.php
    cp config/nginx.conf nginx/
    cp config/Postgres.docker postgres/Dockerfile
    cp config/dbSchema.sql postgres/
    cp config/taskSchema.sql postgres/
    cp config/redis.conf redis/

    #Generate Passwords for the database in the first run. Replace in the files directly
    pwUser0=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    pwUser1=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    pwUser2=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    pwUser3=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    sed -i "s|%pwUser0%|$pwUser0|g" postgres/Dockerfile
    sed -i "s|%pwUser1%|$pwUser1|g" postgres/dbSchema.sql
    sed -i "s|%pwUser2%|$pwUser2|g" postgres/dbSchema.sql
    sed -i "s|%pwUser3%|$pwUser3|g" postgres/dbSchema.sql

    sed -i "s|%pwUser1%|$pwUser1|g" landing/webpageConf/config.php
    #sed -i "s|%pwUser3%|$pwUser3|g" landing/submit/configGetCode.py
    #sed -i "s|%pwUser2%|$pwUser2|g" landing/submit/configSubmitDB.py

    # Generate configuration file for landing server
    sed -i "s|%dailyMaxInstances%|$dailyMaxInstances|g" landing/webpageConf/config.php
    sed -i "s|%maxInstances%|$maxInstances|g" landing/webpageConf/config.php
    sed -i "s|%recaptchaSiteKey%|$recaptchaSiteKey|g" landing/webpageConf/config.php
    sed -i "s|%recaptchaSecret%|$recaptchaSecret|g" landing/webpageConf/config.php
    sed -i "s|%awsLang%|$awsLang|g" landing/webpageConf/config.php
    sed -i "s|%awsAccessKey%|$awsAccessKey|g" landing/webpageConf/config.php
    sed -i "s|%awsSecretKey%|$awsSecretKey|g" landing/webpageConf/config.php
    sed -i "s|%awsRegion%|$awsRegion|g" landing/webpageConf/config.php
    sed -i "s|%awsImageId%|$awsImageId|g" landing/webpageConf/config.php
    sed -i "s|%awsInstanceType%|$awsInstanceType|g" landing/webpageConf/config.php
    sed -i "s|%awsSecurityGroupID%|$awsSecurityGroupID|g" landing/webpageConf/config.php
    sed -i "s|%sshKeyName%|$awsSshKeyName|g" landing/webpageConf/config.php
    sed -i "s|%poolSize%|$poolSize|g" landing/webpageConf/config.php
    sed -i "s|%tokenGetUrl%|$tokenGetUrl|g" landing/webpageConf/config.php
    sed -i "s|%tokenSetUrl%|$tokenSetUrl|g" landing/webpageConf/config.php

elif [[ $1 == "start" ]]; then
    docker-compose build && docker-compose up
elif [[ $1 == "reset" ]]; then
    echo -e "${RED} WARNING: THIS WILL CLEAR ALL OF YOUR DATA, INCLUDING STUDY RESULTS${NC}"
    prompt_confirm "Reset this developer observatory to its initial state" || exit 0

    # Run docker-compose down
    docker-compose down

    # Clean generated configuration files
    rm landing/webpageConf/config.php
    rm nginx/nginx.conf
    rm postgres/*.sql
    rm postgres/Dockerfile

    # Purge db volume
    docker volume rm docker_devob-data

fi
