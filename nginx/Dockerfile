# Utilise l'image officielle Nginx stable
FROM nginx:stable-alpine

# Copie les fichiers de config
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d /etc/nginx/conf.d

# Expose le port 80
EXPOSE 80

# Commande par défaut
CMD ["nginx", "-g", "daemon off;"]
