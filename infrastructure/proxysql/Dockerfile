# ProxySQL Dockerfile
# Using sysown/proxysql official image (alternative to docker library)
FROM proxysql/proxysql:2.4.2

# Copy custom configuration
COPY proxysql.cnf /etc/proxysql.cnf

# Expose ProxySQL admin and client ports
EXPOSE 6032 6033

# Start ProxySQL in foreground mode with custom config
CMD ["proxysql", "-f", "-c", "/etc/proxysql.cnf"]
