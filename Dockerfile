
FROM node:20 AS frontend-builder

WORKDIR /app/frontend
COPY frontend/ ./
RUN npm install
RUN npm run build


FROM python:3.11-slim

WORKDIR /app


COPY backend/ ./backend/
COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt


COPY --from=frontend-builder /app/frontend/dist ./backend/static/


COPY backend/ ./backend/

EXPOSE 8000:8000


CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
