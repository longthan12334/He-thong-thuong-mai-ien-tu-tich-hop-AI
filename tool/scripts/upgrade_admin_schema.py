import sqlite3

def upgrade():
    conn = sqlite3.connect('backend/src/Ecommerce.API/fashion_mall.db')
    cur = conn.cursor()
    cols = [c[1] for c in cur.execute('PRAGMA table_info(Users)').fetchall()]
    columns_to_add = [
        ('SellerStatus TEXT DEFAULT "Active"', 'SellerStatus'),
        ('IsMallVerified INTEGER DEFAULT 1', 'IsMallVerified'),
        ('SuspendedReason TEXT NULL', 'SuspendedReason'),
        ('KycNotes TEXT NULL', 'KycNotes'),
        ('CommissionRate REAL DEFAULT 3.5', 'CommissionRate')
    ]
    for col_def, col_name in columns_to_add:
        if col_name not in cols:
            cur.execute(f'ALTER TABLE Users ADD COLUMN {col_def}')
            print(f'Added {col_name}')
        else:
            print(f'{col_name} already exists')

    # Phân bổ một số trạng thái thực tế cho Admin quản trị:
    # 5 Shop cuối ở trạng thái Chờ duyệt KYC (PendingKYC)
    cur.execute("""
        UPDATE Users 
        SET SellerStatus = 'PendingKYC', IsMallVerified = 0, KycNotes = 'Đang chờ thẩm định giấy phép nhãn hiệu'
        WHERE Role = 2 AND Id IN (
            SELECT Id FROM Users WHERE Role = 2 ORDER BY Id DESC LIMIT 5
        )
    """)

    # 1 Shop ở trạng thái Tạm khóa (Suspended)
    cur.execute("""
        UPDATE Users 
        SET SellerStatus = 'Suspended', SuspendedReason = 'Tạm dừng để đối soát chất lượng khiếu nại khách hàng'
        WHERE Role = 2 AND Id IN (
            SELECT Id FROM Users WHERE Role = 2 ORDER BY Id DESC LIMIT 1 OFFSET 5
        )
    """)

    conn.commit()
    print('Schema updated successfully!')
    cur.execute('SELECT SellerStatus, COUNT(*) FROM Users WHERE Role = 2 GROUP BY SellerStatus')
    print('Seller status breakdown:', cur.fetchall())
    conn.close()

if __name__ == '__main__':
    upgrade()
