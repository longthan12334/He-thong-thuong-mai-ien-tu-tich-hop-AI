'use strict';
const ApiError = require('../errors/ApiError');

/**
 * HTTMDTTHA-8 — Bước 2: phân quyền.
 *
 * Nhóm middleware kiểm tra quyền dựa trên vai trò (RBAC).
 * Luôn đặt SAU authenticate trong chuỗi middleware của route.
 */

function ensureAuthenticated(req) {
  if (!req.user) {
    throw ApiError.unauthorized('Middleware authorize phải đặt sau authenticate', 'NOT_AUTHENTICATED');
  }
}

/**
 * Yêu cầu người dùng có quyền.
 * @param {string|string[]} required một hoặc nhiều mã quyền
 * @param {{mode?: 'all'|'any'}} options 'all' (mặc định) buộc có đủ mọi quyền,
 *        'any' chỉ cần có ít nhất một quyền trong danh sách.
 *
 * Ví dụ:
 *   router.post('/products', authenticate, requirePermissions(P.PRODUCT_CREATE), handler)
 *   router.get('/orders', authenticate,
 *              requirePermissions([P.ORDER_VIEW_ALL, P.ORDER_VIEW_SHOP], { mode: 'any' }), handler)
 */
function requirePermissions(required, options = {}) {
  const list = Array.isArray(required) ? required : [required];
  const mode = options.mode === 'any' ? 'any' : 'all';

  return (req, _res, next) => {
    try {
      ensureAuthenticated(req);
      const owned = new Set(req.user.permissions);
      const missing = list.filter((p) => !owned.has(p));
      const passed = mode === 'any' ? missing.length < list.length : missing.length === 0;

      if (!passed) {
        throw ApiError.forbidden(
          'Bạn không có quyền thực hiện thao tác này',
          { required: list, mode, missing },
        );
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

/**
 * Yêu cầu người dùng thuộc một trong các vai trò chỉ định.
 * Dùng khi ranh giới nghiệp vụ theo vai trò rõ hơn theo quyền,
 * ví dụ toàn bộ nhóm endpoint dành riêng cho người bán.
 */
function requireRoles(...roleCodes) {
  const list = roleCodes.flat();
  return (req, _res, next) => {
    try {
      ensureAuthenticated(req);
      const has = req.user.roles.some((r) => list.includes(r));
      if (!has) {
        throw ApiError.forbidden('Vai trò của bạn không được phép truy cập', { required: list, current: req.user.roles });
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

/**
 * Cho phép truy cập nếu người dùng là chủ sở hữu tài nguyên,
 * HOẶC có một trong các quyền vượt cấp (thường là quyền xem toàn sàn của quản trị viên).
 *
 * @param {(req) => Promise<number|null>} resolveOwnerId hàm lấy user_id chủ sở hữu
 * @param {string|string[]} overridePermissions quyền cho phép bỏ qua kiểm tra sở hữu
 *
 * Ví dụ: khách chỉ xem được đơn của mình, quản trị viên xem được mọi đơn.
 *   router.get('/orders/:id', authenticate,
 *     requireOwnershipOr(async (req) => (await Order.findByPk(req.params.id))?.user_id,
 *                        [P.ORDER_VIEW_ALL]), handler)
 */
function requireOwnershipOr(resolveOwnerId, overridePermissions = []) {
  const overrides = Array.isArray(overridePermissions) ? overridePermissions : [overridePermissions];

  return async (req, _res, next) => {
    try {
      ensureAuthenticated(req);

      const owned = new Set(req.user.permissions);
      if (overrides.some((p) => owned.has(p))) return next();

      const ownerId = await resolveOwnerId(req);
      if (ownerId === null || ownerId === undefined) {
        throw ApiError.notFound('Không tìm thấy tài nguyên');
      }
      if (Number(ownerId) !== Number(req.user.userId)) {
        throw ApiError.forbidden('Bạn chỉ được thao tác trên dữ liệu của chính mình');
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

/**
 * Vượt qua nếu BẤT KỲ middleware con nào cho phép.
 * Hữu ích khi một endpoint có nhiều con đường hợp lệ,
 * ví dụ người bán xem đơn của gian hàng mình, còn quản trị viên xem mọi đơn.
 */
function requireAny(...guards) {
  return (req, res, next) => {
    let index = 0;
    let lastError = null;

    const attempt = () => {
      if (index >= guards.length) {
        return next(lastError || ApiError.forbidden('Bạn không có quyền thực hiện thao tác này'));
      }
      const guard = guards[index++];
      guard(req, res, (err) => {
        if (err) {
          lastError = err;
          return attempt();
        }
        return next();
      });
    };

    attempt();
  };
}

/** Chỉ dành cho quản trị viên — lối tắt hay dùng. */
const requireAdmin = requireRoles('ADMIN');

module.exports = {
  requirePermissions, requireRoles, requireOwnershipOr, requireAny, requireAdmin,
};
