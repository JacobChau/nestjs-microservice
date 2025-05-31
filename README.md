# NestJS Kafka Microservices Demo

This project demonstrates a comprehensive microservice architecture using NestJS and Kafka for communication between services. It includes several domain-specific microservices that communicate through a message broker and use different databases optimized for their specific needs.

## Architecture

```
┌────────────────┐       ┌──────────────────────────────────┐
│                │       │                                  │
│   API Gateway  │◄──────┤          Kafka Broker            │
│                │       │                                  │
└───────┬────────┘       └──┬─────────┬─────────────┬───────┘
        │                   │         │             │     
        │                   │         │             │      
        │                   ▼         ▼             ▼     
        │          ┌──────────┐  ┌──────────┐  ┌──────────┐
        └──────────► Product  │  │   Auth   │  │  Order   │
                   │ Service  │  │ Service  │  │ Service  │
                   └────┬─────┘  └────┬─────┘  └────┬─────┘
                        │             │             │
                        ▼             │             │
                   ┌──────────┐       │             │
                   │ MongoDB  │       │             │
                   └──────────┘       └─────┬───────┘
                                            │
                                            ▼
                                      ┌──────────┐
                                      │PostgreSQL│
                                      └──────────┘
```

### Components

- **API Gateway**: Serves as the entry point for all client requests. It routes requests to appropriate microservices via Kafka.
- **Product Service**: Handles product management (creating, listing, retrieving products).
  - Uses **MongoDB** for flexible product schema and queries.
- **Auth Service**: Manages user authentication and authorization.
  - Uses **PostgreSQL** for reliable relationship data and transaction support.
- **Order Service**: Processes order-related operations, with dependencies on both Product and Auth services.
  - Also uses **PostgreSQL** in a separate database but same instance to minimize resource usage.
- **Kafka**: Message broker enabling asynchronous communication between services.

## Project Structure

```
nestjs-microservice/
├── apps/
│   ├── api-gateway/             # API Gateway service
│   │   ├── src/
│   │   │   ├── controllers/     # HTTP controllers for each domain
│   │   │   ├── dtos/            # Data Transfer Objects
│   │   │   └── app.module.ts    # Main module
│   │   └── main.ts              # Entry point
│   │
│   ├── product-service/         # Product microservice
│   │   ├── src/
│   │   │   ├── controllers/     # Kafka message handlers
│   │   │   ├── dtos/            # Data Transfer Objects
│   │   │   ├── schemas/         # MongoDB schemas
│   │   │   ├── services/        # Business logic
│   │   │   └── product.module.ts # Main module
│   │   └── main.ts              # Entry point
│   │
│   ├── auth-service/            # Auth microservice
│   │   ├── src/
│   │   │   ├── controllers/     # Kafka message handlers
│   │   │   ├── dtos/            # Data Transfer Objects
│   │   │   ├── entities/        # TypeORM entities
│   │   │   ├── services/        # Business logic
│   │   │   └── auth.module.ts   # Main module
│   │   └── main.ts              # Entry point
│   │
│   └── order-service/           # Order microservice
│       ├── src/
│       │   ├── controllers/     # Kafka message handlers
│       │   ├── dtos/            # Data Transfer Objects
│       │   ├── entities/        # TypeORM entities
│       │   ├── services/        # Business logic
│       │   └── order.module.ts  # Main module
│       └── main.ts              # Entry point
│
├── libs/
│   └── common/                  # Shared code
│       └── src/
│           ├── constants/       # Constants like Kafka topics
│           └── interfaces/      # Shared interfaces
│
├── docker-compose.yml           # Docker configuration for infrastructure
├── docker-compose.all.yml       # Docker configuration for all services
├── Dockerfile.*                 # Dockerfiles for each service
├── package.json                 # Project dependencies
└── tsconfig.json                # TypeScript configuration
```

## Prerequisites

- Node.js (v14 or later)
- Docker and Docker Compose

## Getting Started

### Option 1: Running Infrastructure in Docker and Services Locally

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start infrastructure (Kafka, Zookeeper, and databases):
   ```
   docker-compose up -d
   ```
4. Start all services locally:
   ```]
   npm run start:all
   ```

### Option 2: Running Everything in Docker

For a fully containerized setup:

1. Build and start all containers:
   ```
   docker-compose -f docker-compose.all.yml up -d
   ```

## API Endpoints

### Products
- `POST /products` - Create a new product
  ```json
  {
    "name": "Example Product",
    "price": 19.99,
    "description": "This is an example product"
  }
  ```
- `GET /products` - Get all products
- `GET /products/:id` - Get a product by ID

### Authentication
- `POST /auth/register` - Register a new user
  ```json
  {
    "username": "user1",
    "email": "user1@example.com",
    "password": "password123"
  }
  ```
- `POST /auth/login` - Login a user
  ```json
  {
    "email": "user1@example.com",
    "password": "password123"
  }
  ```

### Orders
- `POST /orders` - Create a new order (requires authentication)
  ```json
  {
    "productIds": [1, 2, 3]
  }
  ```
  Headers:
  ```
  Authorization: auth_token_1_1633046400000
  ```
- `GET /orders` - Get all orders for authenticated user
- `GET /orders/:id` - Get an order by ID
- `PUT /orders/:id/status` - Update order status
  ```json
  {
    "status": "processing"
  }
  ```

## Troubleshooting

### Kafka Connection Issues

If you encounter Kafka connection issues like:
```
INFO Socket error occurred: localhost/127.0.0.1:2181: Connection refused
```

Try these solutions:

1. **Ensure correct broker addresses**:
   - When running services **locally**: Use `localhost:9092` 
   - When running services **in Docker**: Use `kafka:29092`

2. **Restart Docker containers**: 
   ```
   docker-compose down
   docker-compose up -d
   ```

3. **Verify Kafka topics are created**:
   ```
   docker exec -it kafka kafka-topics --bootstrap-server kafka:29092 --list
   ```

4. **Inspect container logs**:
   ```
   docker logs kafka
   docker logs zookeeper
   ```
   
5. **Check container status**:
   ```
   docker ps
   ```

6. **If using Windows**, you may need to update host mappings:
   - Try using `host.docker.internal` instead of `localhost` in configurations

7. **Check that the services are listening**:
   ```
   npm run start:product
   npm run start:auth
   npm run start:order
   npm run start:api
   ```

### Common Solutions

1. **Switched to Confluent Images**:
   We're now using official Confluent Kafka and Zookeeper images which are more reliable and better configured.

2. **Internal vs External Communication**:
   Kafka is configured with two listeners:
   - `PLAINTEXT` at `kafka:29092` for internal Docker network communication
   - `PLAINTEXT_HOST` at `localhost:9092` for external access from host

3. **Clean restart**:
   If all else fails, completely remove all containers and volumes:
   ```
   docker-compose down -v
   docker-compose up -d
   ```

## Key Benefits of this Architecture

1. **Service Isolation**: Each service can be developed, deployed, and scaled independently.
2. **Database Optimization**: Each service uses a database type optimized for its specific domain needs.
3. **Resource Efficiency**: Shared PostgreSQL instance reduces resource usage while maintaining separation.
4. **Resilience**: Services can handle failures gracefully without bringing down the entire system.
5. **Scalability**: Services can be scaled independently based on their specific load and requirements. 