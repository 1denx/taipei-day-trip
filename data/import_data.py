import json
import os
from database.db import get_connection

def image_urls(file_string):
    parts = file_string.split("http")[1:]
    urls = [f"http{part}" for part in parts]

    valid_ext = (".jpg", ".jpeg", ".png")
    urls = [url for url in urls if url.lower().endswith(valid_ext)]

    # print(f"部分 URL: {parts}")
    # print(f"正確的 URL: {urls}")
    return urls

def load_json():
    file_path = os.path.join(os.path.dirname(__file__),"taipei-attractions.json")
    with open(file_path, mode="r", encoding="utf-8") as file:
        return json.load(file)["result"]["results"]

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
    data = load_json()

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

        images = image_urls(attraction["file"])
        images_json = json.dumps(images, ensure_ascii=False) # 轉成 JSON 字串寫入

        cursor.execute(query, (attraction_id, name, category, description, address, transport, mrt, lat, lng, images_json))
        
    
    conn.commit()
    cursor.close()
    conn.close()
    print("匯入完成")

# 測試 url 過濾
def test_image_urls():
    test_string = "https://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11003994.JPGhttps://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11003995.JPGhttps://www.travel.taipei/d_upload_ttn/sceneadmin/pic/11003996.jpg"
    result = image_urls(test_string)
    print("測試結果:", result)

def main():
    print("開始匯入台北景點資料...")
    import_data()

if __name__ == "__main__":
    test_image_urls()
    main()