# SQLite Database Container
FROM alpine:latest

# Install SQLite and basic tools
RUN apk add --no-cache sqlite

# Create directory for database
RUN mkdir -p /data

# Set working directory
WORKDIR /data

# Copy initialization script
COPY init-db.sql /data/

# Create initialization script
RUN echo '#!/bin/sh' > /init-and-run.sh && \
    echo 'echo "Initializing SQLite database..."' >> /init-and-run.sh && \
    echo 'sqlite3 /data/petshop.db < /data/init-db.sql' >> /init-and-run.sh && \
    echo 'echo "Database initialized successfully!"' >> /init-and-run.sh && \
    echo 'echo "SQLite database container is running..."' >> /init-and-run.sh && \
    echo 'echo "Database file: /data/petshop.db"' >> /init-and-run.sh && \
    echo 'echo "Use: docker exec -it <container> sqlite3 /data/petshop.db"' >> /init-and-run.sh && \
    echo 'while true; do sleep 3600; done' >> /init-and-run.sh && \
    chmod +x /init-and-run.sh

# Expose a port (not needed for SQLite but useful for health checks)
EXPOSE 8080

# Initialize database and keep container running
CMD ["/init-and-run.sh"]
