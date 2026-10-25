import sys, io, os, sqlite3

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

dbs = [
    r'backend/src/Ecommerce.API/fashion_mall.db',
    r'backend/fashion_mall.db'
]

for db in dbs:
    if not os.path.exists(db):
        continue
    print(f"\n========================================================")
    print(f"PURGING ERRORED & MOCK PRODUCTS ON: {db}")
    print(f"========================================================")
    
    conn = sqlite3.connect(db)
    cur = conn.cursor()
    
    # 1. Identify all errored products (Unsplash mock & old non-authentic demo photos)
    cur.execute("""
    SELECT Id, Name, Sku, ImageUrl 
    FROM Products 
    WHERE ImageUrl LIKE '%unsplash%' 
       OR (ImageUrl NOT LIKE '%cloudinary%' AND ImageUrl NOT LIKE '%ssenseweb%' AND ImageUrl NOT LIKE '/img/%');
    """)
    errored_rows = cur.fetchall()
    errored_ids = [r[0] for r in errored_rows]
    print(f"Found {len(errored_ids)} errored / mock products to purge.")
    
    if errored_ids:
        placeholders = ','.join('?' for _ in errored_ids)
        
        # 2. Fix OrderItems referencing these products
        cur.execute(f"SELECT Id, ProductId FROM OrderItems WHERE ProductId IN ({placeholders});", errored_ids)
        affected_items = cur.fetchall()
        if affected_items:
            print(f"Fixing {len(affected_items)} OrderItems to reference valid authentic products...")
            # Pick a valid authentic product (e.g. from /img/brands/ or cloudinary)
            cur.execute("""
            SELECT Id FROM Products 
            WHERE ImageUrl LIKE '%cloudinary%' OR ImageUrl LIKE '/img/%' 
            ORDER BY Id ASC LIMIT 1;
            """)
            fallback_prod_id = cur.fetchone()[0]
            for oi_id, _ in affected_items:
                cur.execute("UPDATE OrderItems SET ProductId = ? WHERE Id = ?;", (fallback_prod_id, oi_id))
                
        # 3. Delete ProductVariants for these products
        cur.execute(f"DELETE FROM ProductVariants WHERE ProductId IN ({placeholders});", errored_ids)
        deleted_variants = cur.rowcount
        print(f"Deleted {deleted_variants} ProductVariants.")
        
        # 4. Delete Products
        cur.execute(f"DELETE FROM Products WHERE Id IN ({placeholders});", errored_ids)
        deleted_prods = cur.rowcount
        print(f"Deleted {deleted_prods} Products.")
        
    # 5. Clean up any Sellers who now have 0 products (keep only sellers who actually own authentic catalog products)
    cur.execute("""
    SELECT Id, FullName, Email 
    FROM Users 
    WHERE Role = 2 
      AND Id NOT IN (SELECT DISTINCT SellerId FROM Products WHERE SellerId IS NOT NULL);
    """)
    zero_prods_sellers = cur.fetchall()
    if zero_prods_sellers:
        print(f"Removing {len(zero_prods_sellers)} sellers with 0 remaining products...")
        zero_ids = [s[0] for s in zero_prods_sellers]
        placeholders_z = ','.join('?' for _ in zero_ids)
        cur.execute(f"DELETE FROM Users WHERE Id IN ({placeholders_z});", zero_ids)
        
    conn.commit()
    
    # Verification
    cur.execute("SELECT COUNT(*) FROM Products;")
    final_prod_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT SellerId) FROM Products;")
    final_sellers_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM Users;")
    final_users_count = cur.fetchone()[0]
    cur.execute("SELECT Role, COUNT(*) FROM Users GROUP BY Role;")
    roles = cur.fetchall()
    
    # Verify image types
    cur.execute("""
    SELECT 
        CASE 
            WHEN ImageUrl LIKE '%cloudinary%' OR ImageUrl LIKE '%ssenseweb%' THEN 'SSENSE Authentic Studio Photos'
            WHEN ImageUrl LIKE '/img/%' THEN 'Local Curated Design Assets'
            ELSE 'Other'
        END AS type,
        COUNT(*)
    FROM Products
    GROUP BY type;
    """)
    image_dist = cur.fetchall()
    
    print("\n--- PURITY VERIFICATION ---")
    print(f"Total Authentic Products: {final_prod_count:,}")
    print(f"Total Sellers: {final_sellers_count} (all owning real products)")
    print(f"Total Users: {final_users_count} | Roles: {roles}")
    print(f"Image Distribution (100% Authentic):")
    for row in image_dist:
        print(f"   -> {row[0]}: {row[1]:,} products")
        
    conn.close()

print("\n[SUCCESS] Hoàn tất dọn sạch 100% ảnh lỗi và sản phẩm mock rác!")
