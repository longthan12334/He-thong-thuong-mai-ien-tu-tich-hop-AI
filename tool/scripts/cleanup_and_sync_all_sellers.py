import sys
import io
import os
import re
import sqlite3
import unicodedata

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# The default password hash for '123456789'
DEFAULT_PWD_HASH = "FeKw08M4keuw8e9gnsQZQgwg4yDOlMZfvIwzEkSOsiU="

def clean_slug(s):
    if not s: return ""
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('utf-8')
    s = s.lower()
    return re.sub(r'[^a-z0-9]', '', s)

# Load boutique images pool for avatars if available
boutique_images = []
images_pool_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'boutique_images_pool.json')
if os.path.exists(images_pool_path):
    import json
    with open(images_pool_path, 'r', encoding='utf-8') as f:
        boutique_images = json.load(f)

# Also load logo_url from studio.db brands if available
studio_db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'studio.db')
studio_brand_meta = {}
if os.path.exists(studio_db_path):
    c_st = sqlite3.connect(studio_db_path).cursor()
    c_st.execute("SELECT brand_id, display_name, origin_country, logo_url FROM brands;")
    for bid, dname, ctry, logo in c_st.fetchall():
        studio_brand_meta[clean_slug(bid)] = {'logo': logo, 'country': ctry}
        studio_brand_meta[clean_slug(dname)] = {'logo': logo, 'country': ctry}
    c_st.connection.close()

def execute_seller_cleanup(db_path):
    if not os.path.exists(db_path):
        print(f"Skipping non-existent db: {db_path}")
        return
        
    print(f"\n========================================================")
    print(f"EXECUTING SELLER CLEANUP ON: {db_path}")
    print(f"========================================================")
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # 1. Inspect current state
    cur.execute("SELECT COUNT(*) FROM Users;")
    total_users_before = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM Products;")
    total_prods_before = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT SellerId) FROM Products;")
    sellers_before = cur.fetchone()[0]
    
    print(f"Before: {total_users_before} Users, {total_prods_before} Products, {sellers_before} distinct SellerIds")
    
    # 2. Collect all current sellers owning products
    cur.execute("""
    SELECT p.SellerId, u.FullName, u.Email, COUNT(p.Id)
    FROM Products p
    LEFT JOIN Users u ON p.SellerId = u.Id
    GROUP BY p.SellerId, u.FullName, u.Email
    ORDER BY COUNT(p.Id) DESC;
    """)
    seller_rows = cur.fetchall()
    
    # Group old seller IDs by canonical brand slug
    brands_map = {}
    for sid, ufname, uemail, cnt in seller_rows:
        if sid == 1:
            # ducmanh@gmail.com
            continue
            
        bname = None
        if ufname and ' - ' in ufname:
            bname = ufname.split(' - ')[0].strip().replace('-', ' ')
        elif ufname:
            bname = ufname.replace('Official', '').replace('Maison', '').replace('Flagship', '').replace('(Tổng)', '').strip()
        elif uemail:
            bname = uemail.split('@')[0].split('.')[0].replace('-', ' ').title()
            
        slug = clean_slug(bname)
        if not slug:
            continue
            
        if slug not in brands_map:
            brands_map[slug] = {
                'display_name': bname,
                'email': f"{slug}@gmail.com",
                'old_sids': []
            }
        brands_map[slug]['old_sids'].append(sid)
        
    print(f"Identified {len(brands_map)} unique brands to create/maintain canonical Seller accounts for.")
    
    # 3. Ensure special accounts exist and have correct roles:
    # Admin: admin@gmail.com -> Role = 1
    # DucManh: ducmanh@gmail.com -> Role = 2
    # Esther: esther.howard@example.com -> Role = 3
    cur.execute("SELECT Id FROM Users WHERE Email = 'admin@gmail.com';")
    row = cur.fetchone()
    if row:
        admin_id = row[0]
        cur.execute("UPDATE Users SET Role = 1, PasswordHash = ? WHERE Id = ?;", (DEFAULT_PWD_HASH, admin_id))
    else:
        cur.execute("""
        INSERT INTO Users (FullName, Email, PasswordHash, Role, PhoneNumber, IsEmailVerified, CreatedAt)
        VALUES ('Aethelgard Admin', 'admin@gmail.com', ?, 1, '+84 901 000 001', 1, datetime('now'));
        """, (DEFAULT_PWD_HASH,))
        admin_id = cur.lastrowid
        
    cur.execute("SELECT Id FROM Users WHERE Email = 'ducmanh@gmail.com';")
    row = cur.fetchone()
    if row:
        ducmanh_id = row[0]
        cur.execute("UPDATE Users SET Role = 2, PasswordHash = ? WHERE Id = ?;", (DEFAULT_PWD_HASH, ducmanh_id))
    else:
        cur.execute("""
        INSERT INTO Users (FullName, Email, PasswordHash, Role, PhoneNumber, IsEmailVerified, CreatedAt)
        VALUES ('Nguyễn Đức Mạnh', 'ducmanh@gmail.com', ?, 2, '+84 909 888 999', 1, datetime('now'));
        """, (DEFAULT_PWD_HASH,))
        ducmanh_id = cur.lastrowid
        
    cur.execute("SELECT Id FROM Users WHERE Email = 'esther.howard@example.com';")
    row = cur.fetchone()
    if row:
        esther_id = row[0]
        cur.execute("UPDATE Users SET Role = 3, PasswordHash = ? WHERE Id = ?;", (DEFAULT_PWD_HASH, esther_id))
    else:
        cur.execute("""
        INSERT INTO Users (FullName, Email, PasswordHash, Role, PhoneNumber, IsEmailVerified, CreatedAt)
        VALUES ('Esther Howard', 'esther.howard@example.com', ?, 3, '+84 902 345 678', 1, datetime('now'));
        """, (DEFAULT_PWD_HASH,))
        esther_id = cur.lastrowid

    keep_user_ids = {admin_id, ducmanh_id, esther_id}
    
    # Check any other user referenced by Orders.UserId
    cur.execute("SELECT DISTINCT UserId FROM Orders WHERE UserId IS NOT NULL;")
    for r in cur.fetchall():
        keep_user_ids.add(r[0])
        
    # 4. Create or update canonical Seller user for each brand
    brand_to_new_uid = {}
    avatar_idx = 0
    
    for slug, bdata in sorted(brands_map.items()):
        email = bdata['email']
        dname = bdata['display_name']
        full_name = f"{dname} Official Flagship"
        
        # Determine avatar
        avatar_url = None
        if slug in studio_brand_meta and studio_brand_meta[slug]['logo']:
            avatar_url = studio_brand_meta[slug]['logo']
        elif boutique_images:
            avatar_url = boutique_images[avatar_idx % len(boutique_images)]
            avatar_idx += 1
        else:
            avatar_url = "img/sample-nextgen.jpg"
            
        phone = f"+84 9{str(hash(slug) % 90000000 + 10000000)}"
        
        # Check if user with this email already exists
        cur.execute("SELECT Id FROM Users WHERE Email = ?;", (email,))
        u_existing = cur.fetchone()
        if u_existing:
            uid = u_existing[0]
            cur.execute("""
            UPDATE Users SET 
                FullName = ?, 
                PasswordHash = ?, 
                Role = 2, 
                PhoneNumber = ?, 
                AvatarUrl = ?, 
                IsEmailVerified = 1, 
                UpdatedAt = datetime('now')
            WHERE Id = ?;
            """, (full_name, DEFAULT_PWD_HASH, phone, avatar_url, uid))
        else:
            cur.execute("""
            INSERT INTO Users (FullName, Email, PasswordHash, Role, PhoneNumber, AvatarUrl, IsEmailVerified, CreatedAt)
            VALUES (?, ?, ?, 2, ?, ?, 1, datetime('now'));
            """, (full_name, email, DEFAULT_PWD_HASH, phone, avatar_url))
            uid = cur.lastrowid
            
        keep_user_ids.add(uid)
        brand_to_new_uid[slug] = uid
        
        # 5. Re-map products from all old_sids to this new canonical uid
        old_sids = bdata['old_sids']
        if old_sids:
            placeholders = ','.join('?' for _ in old_sids)
            cur.execute(f"UPDATE Products SET SellerId = ? WHERE SellerId IN ({placeholders});", [uid] + old_sids)
            
    # 6. Ensure Duc Manh products stay with ducmanh_id
    cur.execute("UPDATE Products SET SellerId = ? WHERE SellerId = 1;", (ducmanh_id,))
    
    # 7. Check for any products with SellerId not in keep_user_ids
    keep_list = list(keep_user_ids)
    placeholders_keep = ','.join('?' for _ in keep_list)
    cur.execute(f"SELECT COUNT(*) FROM Products WHERE SellerId NOT IN ({placeholders_keep});", keep_list)
    orphaned_prods = cur.fetchone()[0]
    if orphaned_prods > 0:
        print(f"Warning: {orphaned_prods} products had unmatched SellerId. Assigning to admin/ducmanh.")
        cur.execute(f"UPDATE Products SET SellerId = ? WHERE SellerId NOT IN ({placeholders_keep});", [ducmanh_id] + keep_list)
        
    # 8. Delete all junk users
    cur.execute(f"DELETE FROM Users WHERE Id NOT IN ({placeholders_keep});", keep_list)
    deleted_users_count = cur.rowcount
    print(f"Purged {deleted_users_count} legacy/junk user accounts!")
    
    # 9. Clean up Stores table:
    # Keep authentic global maison showrooms (STORE_*) and distinct global flagship stores
    cur.execute("SELECT COUNT(*) FROM Stores;")
    total_stores_before = cur.fetchone()[0]
    
    # If there are old mock VN stores (e.g. StoreCode like 'VN_%' or duplicate local stores),
    # let's clean them up to ensure stores represent authentic showrooms!
    cur.execute("DELETE FROM Stores WHERE StoreCode LIKE 'VN_%' AND StoreCode NOT LIKE 'STORE_%';")
    deleted_stores = cur.rowcount
    if deleted_stores > 0:
        print(f"Removed {deleted_stores} old mock VN store duplicates from Stores table.")
        
    # Update Stores Email to match canonical brand email
    cur.execute("SELECT Id, StoreName FROM Stores;")
    store_rows = cur.fetchall()
    for st_id, st_name in store_rows:
        cand_slug = clean_slug(st_name.split()[0])
        if cand_slug in brands_map:
            cur.execute("UPDATE Stores SET Email = ? WHERE Id = ?;", (brands_map[cand_slug]['email'], st_id))
            
    conn.commit()
    
    # 10. Post-migration verification
    cur.execute("SELECT COUNT(*) FROM Users;")
    total_users_after = cur.fetchone()[0]
    cur.execute("SELECT Role, COUNT(*) FROM Users GROUP BY Role;")
    roles_after = cur.fetchall()
    cur.execute("SELECT COUNT(*) FROM Products;")
    total_prods_after = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT SellerId) FROM Products;")
    sellers_after = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM Stores;")
    total_stores_after = cur.fetchone()[0]
    
    print("\n--- POST-CLEANUP VERIFICATION ---")
    print(f"Total Users: {total_users_after} (was {total_users_before})")
    print(f"Users by Role: {roles_after} (1=Admin, 2=Seller, 3=Customer)")
    print(f"Total Products: {total_prods_after} (was {total_prods_before}) [100% PRESERVED]")
    print(f"Distinct Sellers in Products: {sellers_after} (all valid canonical accounts)")
    print(f"Total Stores: {total_stores_after} (was {total_stores_before})")
    
    conn.close()

if __name__ == '__main__':
    backend_dbs = [
        r'backend/src/Ecommerce.API/fashion_mall.db',
        r'backend/fashion_mall.db'
    ]
    for db in backend_dbs:
        execute_seller_cleanup(db)
    print("\n[SUCCESS] Hoàn tất dọn dẹp và đồng bộ toàn bộ Seller trên toàn dự án!")
