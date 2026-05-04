# Initialize MySQLdb compatibility using PyMySQL when running under Docker
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except Exception:
    # If PyMySQL isn't available at import time, Django will error later during startup.
    pass
