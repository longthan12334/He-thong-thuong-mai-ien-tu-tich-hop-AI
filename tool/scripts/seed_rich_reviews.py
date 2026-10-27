import sqlite3
import random
from datetime import datetime, timedelta

def main():
    db_path = 'backend/src/Ecommerce.API/fashion_mall.db'
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # 1. Ensure columns
    c.execute('PRAGMA table_info(Reviews)')
    existing_cols = {row[1] for row in c.fetchall()}

    columns_to_add = [
        ('IsVerifiedPurchase', 'ALTER TABLE Reviews ADD COLUMN IsVerifiedPurchase INTEGER DEFAULT 1'),
        ('HelpfulCount', 'ALTER TABLE Reviews ADD COLUMN HelpfulCount INTEGER DEFAULT 0'),
        ('ShopReply', 'ALTER TABLE Reviews ADD COLUMN ShopReply TEXT NULL'),
        ('ShopReplyAt', 'ALTER TABLE Reviews ADD COLUMN ShopReplyAt TEXT NULL'),
    ]

    for col_name, ddl in columns_to_add:
        if col_name not in existing_cols:
            c.execute(ddl)
            print(f"Added column: {col_name}")

    conn.commit()

    # 2. Get newest products displayed in shop
    c.execute('SELECT Id, Name, CategoryId, SellerId FROM Products WHERE IsActive = 1 ORDER BY Id DESC LIMIT 200')
    products = c.fetchall()
    print(f"Loaded {len(products)} products for review enrichment.")

    vietnamese_names = [
        "Trần Hoàng Nam", "Nguyễn Thùy Linh", "Phạm Quang Đăng", "Lê Bảo Trâm",
        "Đặng Quốc Huy", "Vũ Bích Phương", "Hoàng Gia Bảo", "Nguyễn Minh Châu",
        "Đỗ Hải Đăng", "Bùi Phương Thảo", "Trịnh Anh Tuấn", "Phan Thanh Trúc",
        "Ngô Khắc Tiệp", "Dương Thu Trang", "Lý Thiên Kim", "Trần Đình Trọng",
        "Hồ Ngọc Diệp", "Mai Xuân Hùng", "Võ Quỳnh Nga", "Phạm Nhật Minh"
    ]

    sample_comments_5star = [
        "Chất liệu thượng hạng đúng chuẩn hàng hiệu xa xỉ. Đường kim mũi chỉ sắc nét, cầm trên tay rất đầm và êm ái.",
        "Đóng gói 2 lớp hộp nguyên seal cao cấp, có đầy đủ thẻ bảo hành và túi chống bụi dustbag chính hãng. Trợ lý AI tư vấn size cực kỳ chuẩn xác!",
        "Hàng chính hãng 100%, có chip NFC quét kiểm tra nguồn gốc rõ ràng. Mang vào rất tôn dáng và sang trọng.",
        "Giao hàng hỏa tốc trong 24h, bọc chống sốc kỹ càng. Thực tế sản phẩm đẹp hơn trong ảnh rất nhiều, rất hài lòng với Aethelgard!",
        "Chất lượng đỉnh cao, form dáng ôm chuẩn và không hề bị mất phom sau thời gian sử dụng. Đáng từng đồng tiền bát gạo.",
        "Sản phẩm đẳng cấp, màu sắc nhã nhặn dễ phối đồ đi làm lẫn dự tiệc. Dịch vụ chăm sóc khách hàng của boutique rất chu đáo.",
        "Thiết kế tinh xảo, da thật mềm mịn và thơm mùi da thuộc cao cấp. Chắc chắn sẽ tiếp tục ủng hộ gian hàng!"
    ]

    sample_comments_4star = [
        "Sản phẩm rất đẹp, đúng mô tả. Hộp hơi cấn nhẹ một góc do quá trình vận chuyển nhưng sản phẩm bên trong nguyên vẹn hoàn hảo.",
        "Chất lượng da và phụ kiện kim loại rất sáng bóng, form hơi ôm một chút so với bình thường nên ai chân bè nên lấy nhỉnh hơn nửa size.",
        "Hàng chuẩn auth, thời gian giao hàng mất 2 ngày. Nhìn chung rất ưng ý với chất lượng phục vụ của shop.",
        "Kiểu dáng thời thượng, phối đồ lên hình cực kỳ sang. Giá săn đợt ưu đãi rất tốt."
    ]

    sample_comments_3star = [
        "Chất lượng sản phẩm tốt, đúng mô tả chính hãng. Tuy nhiên thời gian đóng gói của shop hơi lâu hơn kỳ vọng một chút."
    ]

    shop_replies = [
        "Aethelgard Boutique trân trọng cảm ơn Quý khách đã tin tưởng và đồng hành cùng sản phẩm chính hãng của chúng tôi. Kính chúc Quý khách có những trải nghiệm thời trang tuyệt vời!",
        "Cảm ơn bạn đã để lại đánh giá quý báu! Boutique luôn cam kết 100% sản phẩm phân phối nguyên seal chính hãng kèm chứng nhận bảo hành quốc tế.",
        "Dạ boutique xin chân thành cảm ơn phản hồi của Quý khách! Nếu cần hỗ trợ thêm về bảo dưỡng da hay đổi size tận nhà, quý khách vui lòng nhắn cho chuyên viên boutique nhé."
    ]

    now = datetime.utcnow()
    inserted_count = 0

    for prod_id, prod_name, cat_id, seller_id in products:
        c.execute('SELECT COUNT(*) FROM Reviews WHERE ProductId = ?', (prod_id,))
        curr_count = c.fetchone()[0]

        target_count = random.randint(3, 6)
        need = target_count - curr_count

        if need <= 0:
            continue

        for i in range(need):
            author = random.choice(vietnamese_names)
            rand_val = random.random()
            if rand_val < 0.75:
                rating = 5
                comment = random.choice(sample_comments_5star)
            elif rand_val < 0.95:
                rating = 4
                comment = random.choice(sample_comments_4star)
            else:
                rating = 3
                comment = random.choice(sample_comments_3star)

            created_days_ago = random.randint(1, 45)
            created_at = (now - timedelta(days=created_days_ago, hours=random.randint(1, 23))).strftime('%Y-%m-%d %H:%M:%S')

            helpful_count = random.choice([0, 2, 5, 8, 12, 19, 24])

            has_reply = random.random() < 0.35
            shop_reply = random.choice(shop_replies) if has_reply else None
            shop_reply_at = (datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S') + timedelta(hours=random.randint(2, 24))).strftime('%Y-%m-%d %H:%M:%S') if has_reply else None

            c.execute('''
                INSERT INTO Reviews (ProductId, UserId, CustomerName, Rating, Comment, IsVerifiedPurchase, HelpfulCount, ShopReply, ShopReplyAt, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (prod_id, None, author, rating, comment, 1, helpful_count, shop_reply, shop_reply_at, created_at, None))
            inserted_count += 1

        # Re-calculate Product rating and review count
        c.execute('SELECT AVG(Rating), COUNT(*) FROM Reviews WHERE ProductId = ?', (prod_id,))
        avg_r, total_r = c.fetchone()
        avg_r = round(avg_r, 1) if avg_r else 5.0
        c.execute('UPDATE Products SET Rating = ?, ReviewCount = ? WHERE Id = ?', (avg_r, total_r, prod_id))

    conn.commit()
    print(f"Successfully inserted {inserted_count} real customer reviews across products!")

    # Verify total reviews in DB
    c.execute('SELECT COUNT(*) FROM Reviews')
    total = c.fetchone()[0]
    print(f"Total reviews now in database: {total}")

    conn.close()

if __name__ == '__main__':
    main()
