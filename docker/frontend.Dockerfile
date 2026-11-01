ARG NGINX_IMAGE
FROM ${NGINX_IMAGE}
USER root
RUN rm -f /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY .shifter-developer-delivery/production/stage/frontend/browser/ /usr/share/nginx/html/
COPY .shifter-developer-delivery/production/stage/THIRD-PARTY-NOTICES.txt /usr/share/nginx/html/THIRD-PARTY-NOTICES.txt
USER 101:101
EXPOSE 8080
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
