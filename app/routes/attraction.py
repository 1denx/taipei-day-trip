from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from typing import Optional, Annotated, List
from app.schemas.schemas import AttractionResponse
from app.database.db import get_db_conn
from app.models.attraction import (
    get_attractions_list,
    get_single_attraction,
    get_categories_list,
    get_mrt_list
)

router = APIRouter(prefix="/api")

@router.get("/attractions", response_model=AttractionResponse)
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

@router.get("/attraction/{attractionId}")
async def attraction_id_api(
	attractionId: int,
	db=Depends(get_db_conn)
):
	conn,cursor = db

	try:
		data = get_single_attraction(conn, cursor, attractionId)

		if not data:
			return JSONResponse(
				content={"error": True, "message": "景點編號不正確"},
				status_code=400
			)
		return {"data": data}
	
	except Exception as e:
		print("[ERROR]", e)
		return JSONResponse(
			content={"error": True, "message": "伺服器錯誤"},
			status_code=500
		)

@router.get('/categories')
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

@router.get("/mrts")
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