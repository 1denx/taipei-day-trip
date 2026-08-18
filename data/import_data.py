import json
import os
from app.database.db import get_connection

def image_urls(imgurls, img_host):
    if not imgurls:
        return []

    # "/imgs/1-0.jpg/imgs/1-1.jpg" -> ["1-0.jpg", "1-1.jpg"]
    parts = imgurls.split("/imgs/")[1:]

    valid_ext = (".jpg", ".jpeg", ".png")
    return [
        f"{img_host}/imgs/{part}"
        for part in parts
        if part.lower().endswith(valid_ext)
    ]

def load_json():
    file_path = os.path.join(os.path.dirname(__file__),"taipei-attractions.json")
    with open(file_path, mode="r", encoding="utf-8") as file:
        data = json.load(file)
    return data["img_host"],data["list"]

def import_data():
    conn, cursor = get_connection()

    query = """
        INSERT INTO attractions
        (id, name, category, description, address, transport, mrt, lat, lng, images)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            category = VALUES(category),
            description = VALUES(description),
            address = VALUES(address),
            transport = VALUES(transport),
            mrt = VALUES(mrt),
            lat = VALUES(lat),
            lng = VALUES(lng),
            images = VALUES(images)
    """
    img_host, data = load_json()

    for attraction in data:
        attraction_id = int(attraction["_id"])
        name = attraction["name"]
        category = attraction["CAT"]
        description = attraction["description"]
        address = attraction["address"]
        transport = attraction["direction"]
        mrt = attraction.get("MRT", None)
        if mrt is None:
            mrt = "Unknown"
        lat = attraction["latitude"]
        lng = attraction["longitude"]

        images = image_urls(attraction.get("imgurls", ""), img_host)
        images_json = json.dumps(images, ensure_ascii=False) # 轉成 JSON 字串寫入

        cursor.execute(query, (attraction_id, name, category, description, address, transport, mrt, lat, lng, images_json))
        
    
    conn.commit()
    cursor.close()
    conn.close()
    print("匯入完成")

# 測試 url 過濾
def test_image_urls():
    test_string = "/imgs/1-0.jpg/imgs/1-1.jpg/imgs/1-2.jpg"
    host = "https://padax.github.io/taipei-day-trip-resources"
    print("測試結果:", image_urls(test_string, host))

def main():
    print("開始匯入台北景點資料...")
    import_data()

if __name__ == "__main__":
    test_image_urls()
    main()

