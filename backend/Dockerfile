# Build
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app

COPY mvnw mvnw.cmd ./
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw package -DskipTests -B

# Runtime
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN groupadd --system neobank && useradd --system --gid neobank neobank
COPY --from=builder /app/target/*.jar app.jar

ENV TZ=UTC
ENV JAVA_OPTS="-Duser.timezone=UTC -XX:+UseZGC -XX:MaxRAMPercentage=75.0"

USER neobank
EXPOSE 8081

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
