'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ArrowLeft, Shield, Store, User } from 'lucide-react';
import GoogleButton from '@/components/auth/GoogleButton';
import { authService } from '@/services/auth.service';

const DUAL_IMAGE_PAIRS = [
  { left: '/img/login/1.jpg', right: '/img/login/2.jpg' },
  { left: '/img/login/3.jpg', right: '/img/login/4.jpg' },
  { left: '/img/login/5.jpg', right: '/img/login/6.jpg' },
  { left: '/img/login/7.jpg', right: '/img/login/8.jpg' },
  { left: '/img/login/9.jpg', right: '/img/login/10.jpg' },
  { left: '/img/login/11.jpg', right: '/img/login/12.jpg' },
  { left: '/img/login/13.jpg', right: '/img/login/14.jpg' },
  { left: '/img/login/15.jpg', right: '/img/login/16.jpg' },
  { left: '/img/login/17.jpg', right: '/img/login/1.jpg' }
];

/**
 * Điều hướng sau đăng nhập/đăng ký:
 * - Khách hàng (Customer) về khu mua sắm /shop thay vì trang quản trị gian hàng "/"
 * - Seller/Admin giữ nguyên hành vi cũ
 */
function resolvePostLoginPath(role: string | undefined, savedPath: string | null): string {
  const isCustomer = !role || role === 'Customer';
  if (!isCustomer) return savedPath || '/';
  if (savedPath && savedPath !== '/' && savedPath !== '/login') return savedPath;
  return '/shop';
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Trạng thái luồng quên mật khẩu
  const [forgotFlowOpen, setForgotFlowOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);

  // Giá trị form
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Seller' | 'Customer' | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpBoxes, setOtpBoxes] = useState<string[]>(['', '', '', '', '', '']);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Trạng thái độ mạnh mật khẩu
  const [regStrength, setRegStrength] = useState({ score: 0, label: '—', color: '#cbd5e1', width: '0%', hint: 'Mật khẩu đạt tiêu chuẩn an toàn khi đáp ứng đủ tiêu chuẩn' });
  const [forgotStrength, setForgotStrength] = useState({ score: 0, label: '—', color: '#cbd5e1', width: '0%' });

  // Bộ đếm gửi lại OTP
  const [resendSeconds, setResendSeconds] = useState(60);
  const [resendActive, setResendActive] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Trình chiếu ảnh
  const [currentSlide, setCurrentSlide] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Tự chuyển ảnh 2 cột mỗi 15 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % DUAL_IMAGE_PAIRS.length);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Đếm ngược gửi lại OTP
  useEffect(() => {
    if (!resendActive) return;
    if (resendSeconds <= 0) {
      setResendActive(false);
      return;
    }
    const timer = setInterval(() => {
      setResendSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendActive, resendSeconds]);

  const evaluateStrength = (val: string) => {
    if (!val) {
      return { score: 0, label: '—', color: '#cbd5e1', width: '0%', hint: 'Mật khẩu cần ít nhất 8 ký tự, chữ hoa, số và ký tự đặc biệt' };
    }
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 2) {
      return { score, label: 'Yếu', color: '#ef4444', width: '20%', hint: 'Mật khẩu quá yếu — dễ bị bẻ khóa trong vài giây' };
    } else if (score === 3) {
      return { score, label: 'Trung bình', color: '#f59e0b', width: '45%', hint: 'Thêm chữ hoa, số hoặc ký tự đặc biệt để tăng độ bảo mật' };
    } else if (score === 4) {
      return { score, label: 'Mạnh', color: '#3b82f6', width: '70%', hint: 'Khá tốt — thêm ký tự đặc biệt để đạt mức tối ưu' };
    } else {
      return { score, label: 'Rất mạnh', color: '#10b981', width: '100%', hint: 'Tuyệt vời! Mật khẩu đạt tiêu chuẩn bảo mật cao nhất' };
    }
  };

  const handleRegPasswordChange = (val: string) => {
    setRegPassword(val);
    setRegStrength(evaluateStrength(val));
  };

  const handleForgotNewPassChange = (val: string) => {
    setNewPass(val);
    const s = evaluateStrength(val);
    setForgotStrength({ score: s.score, label: s.label, color: s.color, width: s.width });
  };

  const handleGoogleCredential = async (credential: string) => {
    try {
      showToast('Đang xác thực bảo mật tài khoản Google...');
      const res = await authService.googleLogin(credential);
      if (res && res.token) {
        localStorage.setItem('aethelgard_token', res.token);
        localStorage.setItem('aethelgard_user', JSON.stringify(res));
        showToast(`Đăng nhập Google thành công! Chào mừng ${res.fullName}.`);
        const dest = resolvePostLoginPath(res.role, sessionStorage.getItem('redirect_after_login'));
        sessionStorage.removeItem('redirect_after_login');
        setTimeout(() => {
          window.location.href = dest;
        }, 500);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Đăng nhập Google thất bại');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await authService.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      localStorage.setItem('aethelgard_token', data.token);
      localStorage.setItem('aethelgard_user', JSON.stringify(data));
      showToast(`Đăng nhập thành công! Chào mừng ${data.fullName || loginEmail} trở lại.`);
      const dest = resolvePostLoginPath(data.role, sessionStorage.getItem('redirect_after_login'));
      sessionStorage.removeItem('redirect_after_login');
      setTimeout(() => {
        window.location.href = dest;
      }, 500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Email hoặc mật khẩu không chính xác.';
      showToast(errorMsg);
    }
  };

  const handleRoleSelect = (role: 'Admin' | 'Seller' | 'Customer') => {
    setSelectedRole(role);
    setActiveTab('login');
    if (role === 'Admin') {
      setLoginEmail('admin@gmail.com');
      setLoginPassword('123456789');
    } else if (role === 'Seller') {
      setLoginEmail('gucci@gmail.com');
      setLoginPassword('123456789');
    } else {
      setLoginEmail('esther.howard@example.com');
      setLoginPassword('123456789');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await authService.register({
        fullName: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: 'Customer',
      });

      localStorage.setItem('aethelgard_token', data.token);
      localStorage.setItem('aethelgard_user', JSON.stringify(data));
      showToast(`Đăng ký thành công! Chào mừng ${data.fullName || regName} đến với Aethelgard.`);
      setTimeout(() => {
        window.location.href = resolvePostLoginPath(data.role, '/');
      }, 600);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Đăng ký tài khoản thất bại.';
      showToast(errorMsg);
    }
  };

  const handleForgotStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.endsWith('@gmail.com')) {
      showToast('Hệ thống chỉ chấp nhận địa chỉ Email có đuôi @gmail.com.');
      return;
    }
    setForgotStep(2);
    setResendSeconds(60);
    setResendActive(true);
    showToast(`[DỊCH VỤ EMAIL] Đã gửi OTP xác thực tới ${forgotEmail} (Mã mặc định: 000000)`);
    setTimeout(() => {
      otpInputsRef.current[0]?.focus();
    }, 100);
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpBoxes];
    newOtp[index] = cleanVal;
    setOtpBoxes(newOtp);

    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    const fullCode = newOtp.join('');
    if (fullCode.length === 6) {
      if (fullCode === '000000' || fullCode === '654321') {
        showToast('Xác thực OTP 6 số thành công! Vui lòng tạo mật khẩu mới.');
        setForgotStep(3);
      } else {
        showToast('Mã OTP không chính xác. Vui lòng nhập mã mặc định: 000000');
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpBoxes[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const digits = paste.split('');
    const newOtp = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtpBoxes(newOtp);
    if (paste.length === 6) {
      if (paste === '000000' || paste === '654321') {
        showToast('Xác thực OTP 6 số thành công! Vui lòng tạo mật khẩu mới.');
        setForgotStep(3);
      } else {
        showToast('Mã OTP không chính xác. Vui lòng nhập mã mặc định: 000000');
      }
    }
  };

  const handleForgotStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      showToast('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    if (newPass.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    showToast(`Đặt lại mật khẩu thành công cho ${forgotEmail}! Hãy đăng nhập bằng mật khẩu mới.`);
    setLoginEmail(forgotEmail);
    setLoginPassword(newPass);
    setTimeout(() => {
      setForgotFlowOpen(false);
      setForgotStep(1);
      setActiveTab('login');
    }, 1200);
  };

  return (
    <div className="login-split-page antialiased font-jakarta">
      
      {/* Thông báo nổi */}
      {toastMsg && (
        <div className="fixed bottom-7 right-7 z-50 bg-slate-900/90 backdrop-blur border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl text-xs font-semibold tracking-wide animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* ────────────────── CỘT TRÁI: ĐĂNG NHẬP & KHÔI PHỤC MẬT KHẨU ────────────────── */}
      <div className="login-left-col">
        
        {/* Logo thương hiệu & thanh trên cùng */}
        <div className="mb-4 flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-serif font-bold text-xl shadow-md border border-slate-800 tracking-tighter group-hover:scale-105 transition-all">
              <span className="bg-gradient-to-tr from-slate-200 via-white to-slate-400 bg-clip-text text-transparent italic">Æ</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-[0.18em] text-slate-900 uppercase font-serif">Aethelgard</span>
              <span className="text-[10px] tracking-[0.2em] text-slate-400 font-semibold uppercase -mt-0.5">Trung Tâm Mua Sắm • Tích Hợp AI</span>
            </div>
          </a>
        </div>

        {/* ════════ 1. THẺ XÁC THỰC CHÍNH (ĐĂNG NHẬP & ĐĂNG KÝ) ════════ */}
        {!forgotFlowOpen ? (
          <div className="my-auto py-2 transition-all duration-300">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
              {activeTab === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
            </h1>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-6">
              {activeTab === 'login'
                ? 'Chào mừng bạn trở lại! Đăng nhập để vào không gian cá nhân, nhận ưu đãi độc quyền và mua sắm thông minh cùng AI.'
                : 'Không gian mua sắm của riêng bạn bắt đầu từ đây. Tạo tài khoản để sử dụng đầy đủ tính năng.'}
            </p>

            {/* Nút đăng nhập Google (GIS OAuth) */}
            <div>
              <GoogleButton onCredential={handleGoogleCredential} label="Tiếp tục với Google" />
            </div>

            {/* Hàng chọn nhanh vai trò - tối giản & thanh lịch */}
            <div className="mt-3.5 mb-6">
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('Admin')}
                  className={`group relative flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedRole === 'Admin'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                  }`}
                  title="Chọn vai trò Quản trị viên (admin@gmail.com)"
                >
                  <Shield className={`w-3.5 h-3.5 transition-colors ${
                    selectedRole === 'Admin' ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                  }`} />
                  <span className="text-[12px] font-semibold tracking-wide">Quản trị</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('Seller')}
                  className={`group relative flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedRole === 'Seller'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                  }`}
                  title="Chọn vai trò Người bán (gucci@gmail.com)"
                >
                  <Store className={`w-3.5 h-3.5 transition-colors ${
                    selectedRole === 'Seller' ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                  }`} />
                  <span className="text-[12px] font-semibold tracking-wide">Người bán</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('Customer')}
                  className={`group relative flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedRole === 'Customer'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                  }`}
                  title="Chọn vai trò Khách hàng (esther.howard@example.com)"
                >
                  <User className={`w-3.5 h-3.5 transition-colors ${
                    selectedRole === 'Customer' ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                  }`} />
                  <span className="text-[12px] font-semibold tracking-wide">Khách hàng</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            {/* Tab chuyển đổi phân đoạn */}
            <div className="relative bg-slate-100 rounded-xl p-1 flex mb-6">
              <div className={`tab-slider ${activeTab === 'login' ? 'slide-right' : ''}`}></div>
              <button
                type="button"
                className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Đăng Ký
              </button>
              <button
                type="button"
                className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Đăng Nhập
              </button>
            </div>

            {/* Form Đăng nhập */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
                <div>
                  <label className="input-label">Địa chỉ Email</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="input-field !pl-4"
                    placeholder="dior@gmail.com"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="input-label mb-0">Mật khẩu</label>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setForgotFlowOpen(true);
                        setForgotStep(1);
                      }}
                      className="text-xs font-semibold text-sketch-purple hover:underline transition-colors flex items-center gap-1"
                    >
                      <span>Quên mật khẩu?</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                      </svg>
                    </a>
                  </div>
                  <div className="input-wrapper relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="input-field !pl-4 pr-12"
                      placeholder={showLoginPassword ? "Mật khẩu" : "••••••••"}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowLoginPassword((prev) => !prev);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      className="toggle-eye"
                      style={{ zIndex: 20 }}
                      aria-label="Hiện/ẩn mật khẩu"
                    >
                      {showLoginPassword ? <EyeOff className="w-5 h-5 text-purple-600" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-sketch-purple hover:opacity-90 text-white rounded-lg font-bold text-sm transition-all shadow-md mt-4"
                >
                  Đăng Nhập
                </button>
              </form>
            )}

            {/* Form Đăng ký */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in">
                <div>
                  <label className="input-label">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="input-field !pl-4"
                    placeholder="Nguyễn Đức Mạnh"
                  />
                </div>

                <div>
                  <label className="input-label">Địa chỉ Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="input-field !pl-4"
                    placeholder="seller@gmail.com"
                  />
                </div>

                <div>
                  <label className="input-label">Mật khẩu</label>
                  <div className="input-wrapper relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => handleRegPasswordChange(e.target.value)}
                      className="input-field !pl-4 pr-12"
                      placeholder="Tạo mật khẩu an toàn"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowRegPassword((prev) => !prev);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      className="toggle-eye"
                      style={{ zIndex: 20 }}
                      aria-label="Hiện/ẩn mật khẩu"
                    >
                      {showRegPassword ? <EyeOff className="w-5 h-5 text-purple-600" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Thước đo độ mạnh mật khẩu */}
                  {regPassword && (
                    <div className="mt-3 transition-all duration-300">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">Độ mạnh mật khẩu</span>
                        <span className="text-xs font-semibold" style={{ color: regStrength.color }}>
                          {regStrength.label}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: regStrength.width, backgroundColor: regStrength.color }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">{regStrength.hint}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-sketch-purple hover:opacity-90 text-white rounded-lg font-bold text-sm transition-all shadow-md mt-4"
                >
                  Tiếp tục
                </button>
              </form>
            )}

            <p className="text-xs text-slate-400 mt-5 leading-relaxed text-center">
              Khi tiếp tục, bạn đồng ý với{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); showToast('Điều khoản dịch vụ'); }} className="text-slate-700 underline font-medium">
                Điều khoản dịch vụ
              </a>{' '}
              và{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); showToast('Chính sách bảo mật'); }} className="text-slate-700 underline font-medium">
                Chính sách bảo mật
              </a>.
            </p>
          </div>
        ) : (
          /* ════════ 2. KHUNG QUÊN MẬT KHẨU (3 MÀN HÌNH) ════════ */
          <div className="my-auto py-2 text-center max-w-sm mx-auto w-full animate-fade-in">
            
            {/* ════ MÀN HÌNH 1: Quên mật khẩu ════ */}
            {forgotStep === 1 && (
              <div>
                <div className="text-left mb-2">
                  <button
                    type="button"
                    onClick={() => setForgotFlowOpen(false)}
                    className="sketch-back-btn"
                    title="Quay lại đăng nhập"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>
                </div>

                {/* Hình minh họa SVG 1: Người đang suy nghĩ với dấu ? */}
                <div className="sketch-illustration-box">
                  <div className="sketch-semicircle-bg"></div>
                  <svg className="sketch-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="20" y1="140" x2="180" y2="140" stroke="#8065c9" strokeWidth="2.5" strokeDasharray="14 8 4 6" strokeLinecap="round"/>
                    <path d="M70 140 C70 115, 80 105, 100 105 C120 105, 130 115, 130 140" stroke="#8065c9" strokeWidth="3.5" fill="#e8e2fc" strokeLinecap="round"/>
                    <circle cx="100" cy="80" r="22" stroke="#8065c9" strokeWidth="3.5" fill="#ffffff"/>
                    <path d="M78 78 C78 60, 122 60, 122 78 C120 62, 80 62, 78 78 Z" fill="#8065c9"/>
                    <circle cx="93" cy="78" r="2.5" fill="#8065c9"/>
                    <circle cx="107" cy="78" r="2.5" fill="#8065c9"/>
                    <path d="M96 90 Q100 88 104 90" stroke="#8065c9" strokeWidth="2" strokeLinecap="round"/>
                    <text x="60" y="55" fontFamily="sans-serif" fontWeight="bold" fontSize="22" fill="#8065c9">?</text>
                    <text x="135" y="50" fontFamily="sans-serif" fontWeight="bold" fontSize="24" fill="#8065c9">?</text>
                    <text x="145" y="80" fontFamily="sans-serif" fontWeight="bold" fontSize="18" fill="#8065c9">?</text>
                    <text x="50" y="85" fontFamily="sans-serif" fontWeight="bold" fontSize="18" fill="#8065c9">?</text>
                  </svg>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5">Quên mật khẩu?</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-6">
                  Nhập địa chỉ email, chúng tôi sẽ gửi mã để bạn đặt lại mật khẩu
                </p>

                <form onSubmit={handleForgotStep1Submit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="sketch-input"
                      placeholder="Địa chỉ email (VD: ten@gmail.com)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotFlowOpen(false)}
                      className="sketch-btn-cancel"
                    >
                      Hủy
                    </button>
                    <button type="submit" className="sketch-btn-purple">
                      Đặt lại
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ════ MÀN HÌNH 2: Kiểm tra hộp thư ════ */}
            {forgotStep === 2 && (
              <div>
                <div className="text-left mb-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="sketch-back-btn"
                    title="Quay lại bước 1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>
                </div>

                {/* SVG Illustration 2: Open Envelope với tờ giấy ĐẶT LẠI */}
                <div className="sketch-illustration-box">
                  <div className="sketch-semicircle-bg"></div>
                  <svg className="sketch-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="20" y1="140" x2="180" y2="140" stroke="#8065c9" strokeWidth="2.5" strokeDasharray="14 8 4 6" strokeLinecap="round"/>
                    <rect x="75" y="45" width="50" height="55" rx="3" fill="#ffffff" stroke="#8065c9" strokeWidth="3"/>
                    <text x="82" y="64" fontFamily="sans-serif" fontWeight="bold" fontSize="10" fill="#8065c9" letterSpacing="1">ĐẶT LẠI</text>
                    <line x1="84" y1="74" x2="116" y2="74" stroke="#8065c9" strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="86" y1="82" x2="114" y2="82" stroke="#8065c9" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M60 80 L100 105 L140 80 L140 135 L60 135 Z" fill="#e8e2fc" stroke="#8065c9" strokeWidth="3.5" strokeLinejoin="round"/>
                    <path d="M60 80 L100 110 L140 80" stroke="#8065c9" strokeWidth="3" fill="none" strokeLinejoin="round"/>
                  </svg>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5">Kiểm tra hộp thư của bạn!</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-4">
                  Chúng tôi vừa gửi email hướng dẫn đặt lại mật khẩu cho bạn.
                </p>

                {/* Ô nhập mã OTP tương tác */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    {otpBoxes.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpInputsRef.current[idx] = el; }}
                        type="text"
                        maxLength={1}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        autoComplete="off"
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className={`otp-box ${digit ? 'filled' : ''}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs px-2">
                    <button type="button" onClick={() => setForgotStep(1)} className="text-slate-400 hover:text-slate-700">
                      ← Quay lại
                    </button>
                    <button
                      type="button"
                      disabled={resendActive}
                      onClick={() => {
                        setResendSeconds(60);
                        setResendActive(true);
                        setOtpBoxes(['', '', '', '', '', '']);
                        showToast('[DỊCH VỤ EMAIL] Đã gửi lại mã OTP. Vui lòng nhập mã mặc định: 000000');
                      }}
                      className={`text-sketch-purple font-semibold ${resendActive ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}
                    >
                      {resendActive ? `Gửi lại OTP (${resendSeconds}s)` : 'Gửi lại OTP'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const fullCode = otpBoxes.join('');
                      if (fullCode === '000000' || fullCode === '654321') {
                        showToast('Xác thực OTP 6 số thành công! Vui lòng tạo mật khẩu mới.');
                        setForgotStep(3);
                      } else {
                        showToast('Vui lòng nhập đủ 6 chữ số OTP (Mặc định: 000000)');
                      }
                    }}
                    className="sketch-btn-purple w-full"
                  >
                    Xác thực OTP & Tiếp tục
                  </button>
                </div>

                {/* Ghi chú cuối trang */}
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <p className="text-[11px] text-slate-400">Mọi thắc mắc hoặc sự cố, vui lòng gửi email tới</p>
                  <a href="mailto:helpdesk@aethelgard.com" className="text-xs font-bold text-sketch-purple hover:underline mt-0.5 inline-block">
                    helpdesk@aethelgard.com
                  </a>
                </div>
              </div>
            )}

            {/* ════ MÀN HÌNH 3: Đặt lại mật khẩu ════ */}
            {forgotStep === 3 && (
              <div>
                <div className="text-left mb-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(2)}
                    className="sketch-back-btn"
                    title="Quay lại bước nhập OTP"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>
                </div>

                {/* Hình minh họa SVG 3: Mũi tên cong và biểu tượng ổ khóa */}
                <div className="sketch-illustration-box">
                  <div className="sketch-semicircle-bg"></div>
                  <svg className="sketch-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="20" y1="140" x2="180" y2="140" stroke="#8065c9" strokeWidth="2.5" strokeDasharray="14 8 4 6" strokeLinecap="round"/>
                    <path d="M60 115 C50 60, 150 50, 140 120 M60 115 L80 100 M60 115 L80 130" stroke="#8065c9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <circle cx="130" cy="55" r="18" fill="#ffffff" stroke="#8065c9" strokeWidth="3"/>
                    <rect x="122" y="55" width="16" height="13" rx="2" fill="#8065c9"/>
                    <path d="M125 55 V50 A5 5 0 0 1 135 50 V55" stroke="#8065c9" strokeWidth="2.5" fill="none"/>
                  </svg>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5">Đặt lại mật khẩu</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-6">
                  Bạn muốn đặt mật khẩu mới là gì?
                </p>

                <form onSubmit={handleForgotStep3Submit} className="space-y-4">
                  <div>
                    <div className="input-wrapper relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPass}
                        onChange={(e) => handleForgotNewPassChange(e.target.value)}
                        className="sketch-input pr-12"
                        placeholder="Mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowNewPassword((prev) => !prev);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        className="toggle-eye"
                        style={{ zIndex: 20 }}
                        aria-label="Hiện/ẩn mật khẩu"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5 text-purple-600" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Thanh độ mạnh mật khẩu tối giản */}
                    {newPass && (
                      <div className="mt-2.5 transition-all duration-300 text-left">
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-slate-400">Độ mạnh mật khẩu:</span>
                          <span className="font-semibold" style={{ color: forgotStrength.color }}>
                            {forgotStrength.label}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: forgotStrength.width, backgroundColor: forgotStrength.color }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="input-wrapper relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className="sketch-input pr-12"
                        placeholder="Xác nhận mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowConfirmPassword((prev) => !prev);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        className="toggle-eye"
                        style={{ zIndex: 20 }}
                        aria-label="Hiện/ẩn mật khẩu"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5 text-purple-600" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="sketch-btn-purple w-full">
                    Lưu
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

        {/* Chân trang: danh mục nổi bật */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Khám Phá Danh Mục Nổi Bật
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap opacity-75 grayscale hover:grayscale-0 transition-all">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold text-[10px] text-slate-700 tracking-wider uppercase">THỜI TRANG</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold text-[10px] text-slate-700 tracking-wider uppercase">ĐIỆN TỬ</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold text-[10px] text-slate-700 tracking-wider uppercase">LÀM ĐẸP</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold text-[10px] text-slate-700 tracking-wider uppercase">NHÀ CỬA</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold text-[10px] text-slate-700 tracking-wider uppercase">TRỢ LÝ AI</span>
          </div>
        </div>

      </div>

      {/* ────────────────── CỘT PHẢI: TRÌNH CHIẾU ẢNH 2 CỘT TỰ ĐỘNG 15 GIÂY ────────────────── */}
      <div className="login-right-panel">
        <div className="dual-slider-wrapper relative w-full h-full min-h-screen">
          {DUAL_IMAGE_PAIRS.map((pair, idx) => (
            <div
              key={idx}
              className={`dual-slide-item ${idx === currentSlide ? 'active' : ''}`}
            >
              <div className="dual-col">
                <img
                  src={pair.left}
                  alt={`Slide ${idx * 2 + 1}`}
                  className="dual-col-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/img/login/1.jpg';
                  }}
                />
              </div>
              <div className="dual-col">
                <img
                  src={pair.right}
                  alt={`Slide ${idx * 2 + 2}`}
                  className="dual-col-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/img/login/2.jpg';
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
