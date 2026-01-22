[cite_start][cite: 1]
FROM nginx:alpine

# On supprime la config par défaut de Nginx pour être sûr
RUN rm /etc/nginx/conf.d/default.conf

# On copie notre config globale
COPY nginx.conf /etc/nginx/nginx.conf

# On copie nos fichiers de config serveur (default.conf et active_upstream.conf)
COPY conf.d/ /etc/nginx/conf.d/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]