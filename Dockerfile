# Base image with common dependencies
FROM python:3.12-slim as base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VERSION=1.7.1
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="${POETRY_HOME}/bin:${PATH}"

# Configure Poetry
RUN poetry config virtualenvs.create false

# Copy poetry files
COPY pyproject.toml poetry.lock* ./

# Install dependencies in a separate layer to leverage Docker cache
RUN poetry install --no-interaction --no-ansi --no-root

# Development image
FROM base as development

# Copy project files
COPY . .

# Install all dependencies including dev dependencies
RUN poetry install --no-interaction --no-ansi

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV ENVIRONMENT=development

CMD ["bash"]

# Production image
FROM base as production

# Copy project files
COPY . .

# Install only production dependencies
RUN poetry install --no-interaction --no-ansi --no-dev

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV ENVIRONMENT=production

CMD ["bash"]