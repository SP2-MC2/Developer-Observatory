FROM ubuntu:xenial

WORKDIR /usr/src/app

# Add jupyter user
RUN useradd jupyter --shell=/usr/bin/nologin

RUN apt-get update && DEBIAN_FRONTEND="noninteractive" apt-get install -yqq \
    build-essential \
    python \
    python-dev \
    python3-flask \
    python3-requests \
    libcrypto++-dev \
    libssl-dev \
    runit

# Install pip for python2
ADD https://bootstrap.pypa.io/pip/2.7/get-pip.py .
RUN python2 get-pip.py

# Install python2 dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Add custom jupyter files
RUN mkdir -p /home/jupyter/.jupyter/custom/
RUN mkdir -p /home/jupyter/.jupyter/nbconfig/
COPY jupyter/custom.js /home/jupyter/.jupyter/custom/
COPY jupyter/custom.css /home/jupyter/.jupyter/custom/
COPY jupyter/notebook.html /usr/local/lib/python3.8/dist-packages/notebook/templates/notebook.html
COPY jupyter/jupyter_notebook_config.py /home/jupyter/.jupyter/
COPY jupyter/nbconfig/ /home/jupyter/.jupyter/nbconfig/
RUN chown -R jupyter /home/jupyter

# Copy flask app
COPY app.py .

# Copy runscript
COPY run_instance.sh .
# Copy runit directory and services
COPY ./services/ ./services/

EXPOSE 60000 8888

CMD ["./run_instance.sh"]
