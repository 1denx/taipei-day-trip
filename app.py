from fastapi import FastAPI, Depends, Request, Query
from fastapi.responses import FileResponse, JSONResponse
from database.db import get_db_conn
from typing import Annotated, Optional
import json

app=FastAPI()

# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static/index.html", media_type="text/html")
@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static/attraction.html", media_type="text/html")
@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/booking.html", media_type="text/html")
@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")

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

	# keyword 模糊搜尋 name / mrt / description
	if keyword:
		like = f"%{keyword}%"
		conditions.append("(name LIKE %s OR mrt LIKE %s OR description LIKE %s)")
		params.extend([like, like, like])

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

@app.get("/api/attractions")
async def attraction_api(
	request: Request,
	page: Annotated[int, Query(ge=0)],
	keyword: Optional[str] = None,
	category: Optional[str] = None,
	db=Depends(get_db_conn)
):
	conn, cursor = db

	try:
		attractions_data, next_page = get_attractions_list(
			conn=conn,
			cursor=cursor,
			page=page,
			keyword=keyword,
			category=category
		)
	
		print(f"[DEBUG] page={page}, keyword={keyword}, category={category}, next_page={next_page}, count={len(attractions_data)}")

		if not attractions_data:
			return JSONResponse(
				content={"error": True, "message": "查無景點資料"},
				status_code=200
			)

		return JSONResponse({
			"nextPage": next_page,
			"data": attractions_data
		}, status_code=200)

	except Exception as e:
		print("[ERROR]", e)
		return JSONResponse(
			content={"error": True, "message": "伺服器錯誤"},
			status_code=500
		)

@app.get("/api/attraction/{attractionId}")
async def attraction_id_api(
	attractionId: int,
	db=Depends(get_db_conn)
):
	conn,cursor = db

	try:
		data = get_single_attraction(conn, cursor, attractionId)

		if not data:
			return JSONResponse(
				content={"error": True, "message": "景點不存在"},
				status_code=400
			)
		return {"data": data}
	
	except Exception as e:
		print("[ERROR]", e)
		return JSONResponse(
			content={"error": True, "message": "伺服器錯誤"},
			status_code=500
		)

@app.get('/api/categories')
async def categories_api(db=Depends(get_db_conn)):
	conn,cursor = db

	try:
		categories = get_categories_list(conn, cursor)
		return {"data": categories}
	
	except Exception as e:
		print("[ERROR]", e)
		return JSONResponse(
			content={"error": True, "message": "伺服器錯誤"},
			status_code=500
		)

@app.get("/api/mrts")
async def mrt_api(db=Depends(get_db_conn)):
	conn, cursor = db

	try:
		mrts = get_mrt_list(conn, cursor)
		return {"data": mrts}

	except Exception as e:
		print("[ERROR]", e)
		return JSONResponse(
			content={"error": True, "message": "伺服器錯誤"},
			status_code=500
		)