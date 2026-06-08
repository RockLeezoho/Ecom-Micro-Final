FROM alpine:3.19

RUN apk add --no-cache pgbouncer curl && \
    addgroup -g 72 pgbouncer || true && \
    adduser -D -u 72 -G pgbouncer pgbouncer || true

COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini

RUN chmod 640 /etc/pgbouncer/pgbouncer.ini && \
    mkdir -p /var/log/pgbouncer && \
    chmod 755 /var/log/pgbouncer && \
    chown -R pgbouncer:pgbouncer /etc/pgbouncer /var/log/pgbouncer

EXPOSE 6432

USER pgbouncer

CMD ["pgbouncer", "/etc/pgbouncer/pgbouncer.ini"]
