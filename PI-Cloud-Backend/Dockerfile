# Stage 1: Build the Spring Boot application

# Use JDK because Maven needs to compile the application
FROM eclipse-temurin:17-jdk-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy Maven Wrapper and make it executable
COPY mvnw ./
RUN chmod +x mvnw

# Copy Maven configuration and project descriptor
COPY .mvn .mvn
COPY pom.xml ./

# Download project dependencies
# This layer is cached unless pom.xml changes
RUN ./mvnw dependency:go-offline -B

# Copy the application source code
COPY src ./src

# Build the executable Spring Boot JAR
# Tests are skipped because they should run in the CI pipeline
RUN ./mvnw clean package -DskipTests


# Stage 2: Create the production runtime image

# Use a lightweight JRE image to run the application
FROM eclipse-temurin:17-jre-alpine

# Set the working directory
WORKDIR /app

# Create a non-root user for better security
RUN addgroup -S spring && adduser -S spring -G spring

# Copy the generated JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Give ownership of the application to the non-root user
RUN chown spring:spring app.jar

# Run the application as the non-root user
USER spring

# Document the port used by the Spring Boot application
EXPOSE 8090

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]