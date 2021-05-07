#!/bin/bash
# DO NOT RUN OUTSIDE OF INSTANCE CONTAINER


# Since notebook is behind a cool proxy (by me), we need to change the baseURL with the hostname
sed -i "s|%contID%|$HOSTNAME|g" /home/jupyter/.jupyter/jupyter_notebook_config.py
# Start supervisord
#/usr/bin/supervisord

# Start Flask
/usr/bin/python3 /usr/src/app/app.py &
P1=$!

# Start Jupyter
su jupyter -s /bin/sh -c "cd /home/jupyter/; jupyter notebook --no-browser" &
P2=$!

wait $P1 $P2

