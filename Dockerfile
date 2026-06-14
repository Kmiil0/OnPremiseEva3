# 1. Usar imagen oficial de Node.js ligera para no consumir mucha RAM
FROM node:18-alpine

# 2. Crear el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copiar los archivos de configuración (package.json)
COPY package*.json ./

# 4. Instalar las dependencias (Express, pg, jsonwebtoken, etc.)
RUN npm install

# 5. Copiar todo el resto de tu código al contenedor
COPY . .

# 6. Exponer el puerto 3000 para que se comunique con el exterior
EXPOSE 3000

# 7. El comando mágico para iniciar tu servidor
CMD ["node", "acme.js"]