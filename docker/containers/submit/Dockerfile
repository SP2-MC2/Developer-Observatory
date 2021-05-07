FROM tiangolo/uwsgi-nginx-flask:python3.8

RUN pip install SQLAlchemy Flask-SQLAlchemy psycopg2 pygments

COPY submit.py /app/main.py
COPY configSubmit.py /app/
COPY tasks/ /app/tasks/
