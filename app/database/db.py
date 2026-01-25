import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv, find_dotenv

# 載入環境變數
load_dotenv(find_dotenv())

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

def get_connection():
    try:
        conn = pool.get_connection()
        # 檢查與 MySQL 的連接是否仍然可以使用
        conn.ping(reconnect=True, attempts=3, delay=2)
        cursor = conn.cursor(dictionary=True)
        return conn, cursor
    except mysql.connector.Error as e:
        print("資料庫連線錯誤:", e)
        raise

def get_db_conn():
    conn, cursor = get_connection()
    try:
        yield conn, cursor
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()