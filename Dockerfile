# Se define la version de node que tiene el contenedor
FROM oraclelinux:7-slim

RUN  yum -y install oracle-release-el7 oracle-nodejs-release-el7 && \
     yum-config-manager --disable ol7_developer_EPEL && \
     yum -y install oracle-instantclient19.6-basiclite nodejs && \
     rm -rf /var/cache/yum

# Defino el directorio en donde se va a ejecutar mi configuración dentro del contenedor
WORKDIR /home/edwar.zapata/projects/environment/production

# Copio el archivo package.json para despues instalar las dependencias de mi repositorio
COPY package*.json ./

RUN npm install

# Instalo de manera global pm2
RUN npm install pm2 -g

# Copio todos los archivos de mi repositorio al workdir
COPY . .

# Expondo el puerto por donde va a escuchar mi aplicación
EXPOSE 3000

CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]