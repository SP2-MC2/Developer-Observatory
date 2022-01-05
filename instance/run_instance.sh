#!/bin/bash
# DO NOT RUN OUTSIDE OF INSTANCE CONTAINER


# Since notebook is behind a cool proxy (by me), we need to change the baseURL with the hostname
sed -i "s|%contID%|$HOSTNAME|g" /home/jupyter/.jupyter/jupyter_notebook_config.py
exec runsvdir /usr/src/app/services
