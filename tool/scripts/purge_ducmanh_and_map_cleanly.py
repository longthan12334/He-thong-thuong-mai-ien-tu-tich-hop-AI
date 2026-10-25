import sys, io, os, sqlite3, unicodedata, re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def clean_slug(s):
    if not s: return ""
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('utf-8')
    s = s.lower()
    return re.sub(r'[^a-z0-9]', '', s)

dbs = [
    r'backend/src/Ecommerce.API/fashion_mall.db',
    r'backend/fashion_mall.db'
]

for db in dbs:
    if not os.path.exists(db):
        continue
    print(f"\n========================================================")
    print(f"CLEANING UP MOCK SELLER (ducmanh) ON: {db}")
    print(f"========================================================")
    
    conn = sqlite3.connect(db)
    cur = conn.cursor()
    
    # 1. Load all brand users (email -> Id)
    cur.execute("SELECT Id, Email FROM Users WHERE Role = 2;")
    brand_users = {r[1]: r[0] for r in cur.fetchall()}
    print(f"Found {len(brand_users)} brand Seller users.")
    
    # Helper to find seller ID by keyword
    def find_seller_id(brand_keyword):
        kw_slug = clean_slug(brand_keyword)
        # exact match on email
        target_email = f"{kw_slug}@gmail.com"
        if target_email in brand_users:
            return brand_users[target_email]
        # partial match
        for email, uid in brand_users.items():
            slug = email.split('@')[0]
            if kw_slug in slug or slug in kw_slug:
                return uid
        return None

    # 2. Get all products currently owned by SellerId = 1 (ducmanh)
    cur.execute("SELECT Id, Name FROM Products WHERE SellerId = 1;")
    ducmanh_prods = cur.fetchall()
    print(f"Products currently owned by ducmanh: {len(ducmanh_prods)}")
    
    deleted_prods = 0
    remapped_prods = 0
    
    for pid, pname in ducmanh_prods:
        if 'aethelgard' in pname.lower():
            # Delete mock cushion product and its variants
            cur.execute("DELETE FROM ProductVariants WHERE ProductId = ?;", (pid,))
            cur.execute("DELETE FROM Products WHERE Id = ?;", (pid,))
            deleted_prods += 1
            print(f"  [DELETED MOCK PRODUCT] {pid}: {pname}")
            continue
            
        # Extract brand keyword
        target_uid = None
        # Check brand name in pname
        for kw in [
            'adidas Originals', 'adidas', 'balenciaga', 'gucci', 'nike', 'puma', 'kiko kostadinov',
            'mcqueen', 'rick owens lilies', 'rick owens drkshdw', 'rick owens', 'maryam nassir zadeh',
            'manolo blahnik', 'isabel marant', 'veja', 'vans', 'le monde beryl', 'maison margiela',
            'thom browne', 'coperni', 'jude', 'lemaire', 'tom ford', 'valentino garavani', 'valentino',
            'moon boot', 'khaite'
        ]:
            if kw in pname.lower():
                target_uid = find_seller_id(kw)
                if target_uid:
                    break
                    
        if not target_uid:
            # Try from first word or before hyphen
            first_part = pname.split(' - ')[0].strip() if ' - ' in pname else pname.split()[0].strip()
            target_uid = find_seller_id(first_part)
            
        if target_uid:
            cur.execute("UPDATE Products SET SellerId = ? WHERE Id = ?;", (target_uid, pid))
            remapped_prods += 1
        else:
            print(f"  [UNMATCHED PRODUCT] {pid}: {pname}")

    print(f"Re-mapped {remapped_prods} products to authentic brand sellers.")
    print(f"Deleted {deleted_prods} mock test products.")
    
    # 3. Delete ducmanh@gmail.com from Users table
    cur.execute("DELETE FROM Users WHERE Email = 'ducmanh@gmail.com';")
    print("Deleted 'ducmanh@gmail.com' from Users table.")
    
    # Check if any products still have SellerId = 1
    cur.execute("SELECT COUNT(*) FROM Products WHERE SellerId = 1;")
    rem_count = cur.fetchone()[0]
    print(f"Remaining products with SellerId = 1: {rem_count}")
    
    conn.commit()
    
    # Verification
    cur.execute("SELECT COUNT(*) FROM Users;")
    print(f"Total Users: {cur.fetchone()[0]}")
    cur.execute("SELECT Role, COUNT(*) FROM Users GROUP BY Role;")
    print(f"Users by Role: {cur.fetchall()}")
    cur.execute("SELECT COUNT(*) FROM Products;")
    print(f"Total Products: {cur.fetchone()[0]}")
    cur.execute("SELECT COUNT(DISTINCT SellerId) FROM Products;")
    print(f"Distinct Sellers: {cur.fetchone()[0]}")
    
    conn.close()

print("\n[SUCCESS] Hoàn tất xóa sạch tài khoản và dữ liệu rác của ducmanh!")
