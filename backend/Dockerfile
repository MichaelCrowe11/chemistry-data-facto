FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps that commonly help scientific/chemistry wheels and RDKit runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        git \
        curl \
        ca-certificates \
        libstdc++6 \
        libgcc-s1 \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt /app/requirements.txt

RUN pip install --upgrade pip \
    && pip install -r /app/requirements.txt

# Copy app code
COPY src /app/src

ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

CMD ["python", "src/api.py"]
