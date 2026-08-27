'use strict';

/**
 * Bộ nhớ đệm trong tiến trình, có thời gian sống.
 * Dùng để tránh truy vấn lại bảng quyền ở mỗi request.
 * Khi hệ thống chạy nhiều bản sao (nhân bản container), thay lớp này
 * bằng Redis là đủ — phần còn lại của mã nguồn không phải sửa.
 */
class TtlCache {
  constructor(ttlMs = 60_000) {
    this.ttl = ttlMs;
    this.store = new Map();
  }

  get(key) {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key, value) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttl });
    return value;
  }

  /** Xóa đệm khi quyền hoặc vai trò của người dùng vừa bị thay đổi. */
  invalidate(key) {
    if (key === undefined) this.store.clear();
    else this.store.delete(key);
  }

  get size() {
    return this.store.size;
  }
}

module.exports = {
  userCache: new TtlCache(60_000),   // hồ sơ và vai trò của người dùng
  roleCache: new TtlCache(300_000),  // ánh xạ vai trò sang quyền
  TtlCache,
};
