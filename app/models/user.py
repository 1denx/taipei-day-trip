def get_user(conn, cursor, email:str):
	query = "SELECT * FROM users WHERE email = %s"
	cursor.execute(query,(email,))
	user = cursor.fetchone()
	return user

def create_user(conn, cursor, name: str, email: str, password: str):
	query = "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)"
	cursor.execute(query,(name, email, password))
	conn.commit()