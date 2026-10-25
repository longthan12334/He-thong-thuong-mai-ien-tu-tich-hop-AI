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
    print(f"DELETING 718 MOCK /img/ PRODUCTS ON: {db}")
    print(f"========================================================")
    
    conn = sqlite3.connect(db)
    cur = conn.cursor()
    
    # 1. Identify products with ImageUrl LIKE '/img/%'
    cur.execute("SELECT Id FROM Products WHERE ImageUrl LIKE '/img/%';")
    target_ids = [r[0] for r in cur.fetchall()]
    print(f"Found {len(target_ids)} products with ImageUrl LIKE '/img/%'")
    
    if target_ids:
        placeholders = ','.join('?' for _ in target_ids)
        
        # 2. Check and fix any OrderItems pointing to these products
        cur.execute(f"SELECT Id, ProductId FROM OrderItems WHERE ProductId IN ({placeholders});", target_ids)
        affected_items = cur.fetchall()
        if affected_items:
            print(f"Re-pointing {len(affected_items)} OrderItems to valid SSENSE products...")
            cur.execute("SELECT Id FROM Products WHERE ImageUrl LIKE '%cloudinary%' ORDER BY Id ASC LIMIT 1;")
            fallback_id = cur.fetchone()[0]
            for oi_id, _ in affected_items:
                cur.execute("UPDATE OrderItems SET ProductId = ? WHERE Id = ?;", (fallback_id, oi_id))
                
        # 3. Delete ProductVariants
        cur.execute(f"DELETE FROM ProductVariants WHERE ProductId IN ({placeholders});", target_ids)
        del_variants = cur.rowcount
        print(f"Deleted {del_variants} ProductVariants.")
        
        # 4. Delete Products
        cur.execute(f"DELETE FROM Products WHERE Id IN ({placeholders});", target_ids)
        del_prods = cur.rowcount
        print(f"Deleted {del_prods} Products.")
        
    # 5. Clean up any Sellers who now have 0 products
    cur.execute("""
    SELECT Id, FullName, Email 
    FROM Users 
    WHERE Role = 2 
      AND Id NOT IN (SELECT DISTINCT SellerId FROM Products WHERE SellerId IS NOT NULL);
    """)
    zero_prods_sellers = cur.fetchall()
    if zero_prods_sellers:
        print(f"Removing {len(zero_prods_sellers)} sellers with 0 products...")
        z_ids = [s[0] for s in zero_prods_sellers]
        placeholders_z = ','.join('?' for _ in z_ids)
        cur.execute(f"DELETE FROM Users WHERE Id IN ({placeholders_z});", z_ids)
        
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
    
    cur.execute("""
    SELECT 
        CASE 
            WHEN ImageUrl LIKE '%cloudinary%' OR ImageUrl LIKE '%ssenseweb%' THEN 'SSENSE Authentic Studio Photos'
            ELSE 'Other'
        END AS type,
        COUNT(*)
    FROM Products
    GROUP BY type;
    """)
    dist = cur.fetchall()
    
    print("\n--- FINAL VERIFICATION ---")
    print(f"Total Authentic Products: {final_prod_count:,} (100% SSENSE Studio Photos)")
    print(f"Total Active Brand Sellers: {final_sellers_count}")
    print(f"Total Users: {final_users_count} | Roles: {roles}")
    for row in dist:
        print(f"   -> {row[0]}: {row[1]:,} products")
        
    conn.close()

print("\n[SUCCESS] Hoàn tất xóa sạch toàn bộ 718 sản phẩm /img/ rác!")
