FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]