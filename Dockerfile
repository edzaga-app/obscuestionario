# Se define la version de node que tiene el contenedor
FROM node:14.6.0-alpine

# Defino el directorio en donde se va a ejecutar mi configuración dentro del contenedor
WORKDIR /home/edwar.zapata/projects/environment/production

# Librerías para que oracle se ejecute con nodejs
RUN yum install -y alien libaio1
RUN wget https://yum.oracle.com/repo/OracleLinux/OL7/oracle/instantclient/x86_64/getPackage/oracle-instantclient19.3-basiclite-19.3.0.0.0-1.x86_64.rpm
RUN alien -i --scripts oracle-instantclient*.rpm
RUN rm -f oracle-instantclient19.3*.rpm && yum -y autoremove && yum -y clean

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