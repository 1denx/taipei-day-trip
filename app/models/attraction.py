import json
from typing import Optional

def get_attractions_list(
	conn,
	cursor,
	page: int = 0,
	keyword: Optional[str] = None,
	category: Optional[str] = None,
):
	limit = 8
	offset = page * limit

	base_query = """
		SELECT id, name, category, description, address, transport, mrt, lat, lng, images
		FROM attractions
	"""

	conditions = []
	params = []

	# category 精確比對
	if category:
		conditions.append("category  = %s")
		params.append(category)

	# keyword 模糊搜尋 name LIKE + mrt 完全比對
	if keyword:
		like = f"%{keyword}%"
		conditions.append("(name LIKE %s OR mrt = %s)")
		params.extend([like, keyword])

	if conditions:
		base_query += " WHERE " + " AND ".join(conditions)

	# LIMIT 多抓一筆判斷 nextPage
	query = base_query + " LIMIT %s OFFSET %s"
	params.extend([limit + 1, offset])

	cursor.execute(query, params)
	rows = cursor.fetchall()

	if len(rows) > limit:
		next_page = page + 1
		rows = rows[:limit]
	else:
		next_page = None
	
	for row in rows:
		try:
			row["images"] = json.loads(row["images"])
		except:
			row["images"] = []
		
		for key in ("lat", "lng"):
			try:
				row[key] = float(row[key])
			except:
				row[key] = None
	
	return rows, next_page

def get_single_attraction(conn, cursor, attraction_id: int):
	query = """
		SELECT id, name, category, description, address, transport, mrt, lat, lng, images
		FROM attractions
		WHERE id = %s
		LIMIT 1
	"""
	cursor.execute(query,(attraction_id,))
	row = cursor.fetchone()

	if not row:
		return None
	
	try:
		row["images"] = json.loads(row["images"])
	except:
		row["images"] = []

	return row

def get_categories_list(conn, cursor):
	query = """
		SELECT DISTINCT category
		FROM attractions
		WHERE category IS NOT NULL
		ORDER BY category
	"""
	cursor.execute(query)
	rows = cursor.fetchall()
	result = [row["category"] for row in rows]

	return result

def get_mrt_list(conn, cursor):
	query = """
		SELECT DISTINCT mrt
		FROM attractions
		WHERE mrt IS NOT NULL AND mrt != 'Unknown'
		ORDER BY mrt
	"""
	cursor.execute(query)
	rows = cursor.fetchall()
	result = [row["mrt"] for row in rows]

	return result