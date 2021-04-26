FROM ubuntu

WORKDIR /usr/src/app

RUN apt-get update && DEBIAN_FRONTEND="noninteractive" apt-get install -yqq nginx python3-pip \
    python3-flask \
    python3-requests \
    supervisor

RUN pip3 install -U pip jupyter

RUN adduser jupyter --system --group --shell=/usr/bin/nologin --disabled-login

# Start setting up jupyter
RUN mkdir -p /home/jupyter/.jupyter/custom/
RUN mkdir -p /home/jupyter/.jupyter/nbconfig/
RUN chown -R jupyter:jupyter /home/jupyter
COPY nb_template/custom.js /home/jupyter/.jupyter/custom/
COPY nb_template/custom.css /home/jupyter/.jupyter/custom/
COPY nb_template/notebook.html /usr/local/lib/python3.8/dist-packages/notebook/templates/notebook.html
COPY nb_template/jupyter_notebook_config.py /home/jupyter/.jupyter/
COPY nb_template/nbconfig/ /home/jupyter/.jupyter/nbconfig/


# Copy configurations
COPY config/supervisord.conf /etc/supervisor/supervisord.conf
COPY config/nginxTaskServer.conf /etc/nginx/sites-enabled/default
COPY config/compiled_app.py ./app.py

CMD ["/usr/bin/supervisord"]
