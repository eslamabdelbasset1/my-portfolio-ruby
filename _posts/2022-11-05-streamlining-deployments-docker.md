---
layout: post
title: "Streamlining Enterprise Deployments with Docker and GitLab CI"
date: 2022-11-05 14:00:00 +0000
categories: [DevOps, CI/CD, Infrastructure]
tags: [docker, gitlab ci, deployments, linux, automation]
author: Eslam Abdelbasset
---

When managing enterprise CMS platforms at **Layout International**, pushing updates to production cannot involve "crossing your fingers and hoping for the best." Downtime costs money, and inconsistent environments lead to the dreaded "it works on my machine" syndrome.

To solve this, we heavily invested in containerization and automated CI/CD pipelines.

## 1. The Power of Dockerization

By wrapping our PHP, Nginx, and Redis environments into Docker containers, we ensured absolute parity between local development, staging, and production environments. 

Here is a simplified version of a robust `Dockerfile` for a Laravel application:

```dockerfile
# Start from the official PHP FPM Alpine image for a smaller footprint
FROM php:8.2-fpm-alpine

# Install system dependencies and PHP extensions
RUN apk add --no-cache libpng-dev libzip-dev unzip git bash \
    && docker-php-ext-install pdo_mysql gd zip opcache

# Copy application files
COPY . /var/www/html
WORKDIR /var/www/html

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
```

## 2. Orchestrating with Docker Compose

A `docker-compose.yml` file became the single source of truth for our infrastructure requirements.

```yaml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    volumes:
      - .:/var/www/html
  
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - .:/var/www/html
      - ./nginx/conf.d:/etc/nginx/conf.d
    depends_on:
      - app

  redis:
    image: redis:alpine
    restart: unless-stopped
```

## 3. Automating with GitLab CI

Manual deployments are prone to human error. We configured GitLab CI pipelines to automate our entire release cycle. Here is a snippet of how a `.gitlab-ci.yml` can automate tests and builds:

```yaml
stages:
  - test
  - build
  - deploy

run_tests:
  stage: test
  image: php:8.2-cli
  script:
    - apt-get update && apt-get install -y unzip zip
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - composer install
    - cp .env.example .env
    - php artisan key:generate
    - php artisan test

build_image:
  stage: build
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - master

deploy_production:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache openssh-client
    - mkdir -p ~/.ssh
    - echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - ssh -o StrictHostKeyChecking=no user@production_server "cd /app && docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA && docker-compose up -d"
  only:
    - master
```

## 4. Achieving Zero-Downtime Deployments

Updating a live enterprise application requires finesse. We utilized rolling updates and blue-green deployment strategies. By spinning up the new containers alongside the old ones, running database migrations carefully, and gracefully switching the Nginx load balancer to the new containers, we achieved zero-downtime releases.

Automating your deployment pipeline is an upfront investment that pays massive dividends in team velocity, software reliability, and overall peace of mind.
