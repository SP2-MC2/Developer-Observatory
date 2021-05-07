FROM redis
COPY redis.conf /usr/local/etc/redis/redis.conf
CMD [ "sh", "-c", "rm -f /data/dumb.rdb && redis-server /usr/local/etc/redis/redis.conf"]

