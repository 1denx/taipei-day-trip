import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

pool = pooling.MySQLConnectionPool(
    pool_name = "tpe_pool",
    pool_size = 5,
    pool_reset_session = True,
    host = DB_HOST,
    user = DB_USER,
    password = DB_PASSWORD,
    database = DB_NAME,
    charset="utf8mb4"
)

def get_db_conn():
    conn = pool.get_connection()
    try:
        yield conn
    finally:
        conn.close()