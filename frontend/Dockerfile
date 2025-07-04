

FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install
# # For prod:
# RUN npm run build

# FROM nginx:alpine
# COPY --from=builder /app/dist /usr/share/nginx/html
# COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
# EXPOSE 3112

# For Dev
EXPOSE 3112:3112
CMD ["npm", "run", "dev", "--", "--host"]