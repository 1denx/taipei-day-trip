def get_user(conn, cursor, email: str):
	query = "SELECT * FROM users WHERE email = %s"
	cursor.execute(query,(email,))
	user = cursor.fetchone()
	return user

def create_user(conn, cursor, name: str, email: str, password: str):
	query = "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)"
	cursor.execute(query,(name, email, password))
	conn.commit()

def update_user_password(conn, cursor, user_id: int, newPwd: str):
	query = "UPDATE users SET password = %s WHERE id = %s"
	cursor.execute(query,(newPwd, user_id))
	conn.commit()

def update_user_name(conn, cursor, user_id: int, name: str):
	query = "UPDATE users SET name = %s WHERE id = %s"
	cursor.execute(query,(name, user_id))
	conn.commit()

def update_user_avatar(conn, cursor, user_id: int, avatar: str):
	query = "UPDATE users SET avatar = %s WHERE id = %s"
	cursor.execute(query,(avatar, user_id))
	conn.commit()