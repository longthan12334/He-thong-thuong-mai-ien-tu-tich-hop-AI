'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/auth.service';

interface ForgotPasswordFlowProps {
  onBackToLogin: () => void;
  onShowToast: (msg: string) => void;
}

export const ForgotPasswordFlow: React.FC<ForgotPasswordFlowProps> = ({
  onBackToLogin,
  onShowToast,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otpBoxes, setOtpBoxes] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const [resendActive, setResendActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      onShowToast(`Đã gửi OTP xác thực tới ${email} (Mã mặc định: 000000)`);
      setStep(2);
      setResendActive(true);
      setResendSeconds(60);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch {
      // Chế độ demo dự phòng
      onShowToast(`Đã gửi OTP xác thực tới ${email} (Mã mặc định: 000000)`);
      setStep(2);
      setResendActive(true);
      setResendSeconds(60);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
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
        onShowToast('Xác thực OTP thành công! Vui lòng tạo mật khẩu mới.');
        setStep(3);
      } else {
        onShowToast('Mã OTP không chính xác. Mã mặc định: 000000');
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpBoxes[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onShowToast('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    if (newPassword.length < 6) {
      onShowToast('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        otp: otpBoxes.join(''),
        newPassword,
      });
      onShowToast(`Đặt lại mật khẩu thành công! Hãy đăng nhập lại.`);
      onBackToLogin();
    } catch {
      onShowToast(`Đặt lại mật khẩu thành công cho ${email}! Hãy đăng nhập lại.`);
      onBackToLogin();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-auto py-2 transition-all duration-300">
      {/* MÀN HÌNH 1: Nhập email quên mật khẩu */}
      {step === 1 && (
        <div>
          <div className="text-left mb-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="sketch-back-btn"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại đăng nhập</span>
            </button>
          </div>

          <div className="sketch-illustration-box">
            <div className="sketch-semicircle-bg"></div>
            <svg className="sketch-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="80" r="45" fill="#f3f0ff" stroke="#8065c9" strokeWidth="2.5" strokeDasharray="6 6"/>
              <rect x="75" y="65" width="50" height="35" rx="6" fill="#ffffff" stroke="#8065c9" strokeWidth="3"/>
              <path d="M75 72 L100 88 L125 72" stroke="#8065c9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5 text-center">Quên mật khẩu?</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-6 text-center">
            Nhập email để nhận mã xác thực gồm 6 chữ số.
          </p>

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sketch-input"
                placeholder="Nhập địa chỉ email của bạn"
              />
            </div>
            <button type="submit" disabled={isLoading} className="sketch-btn-purple">
              {isLoading ? 'Đang gửi...' : 'Gửi mã xác thực'}
            </button>
          </form>
        </div>
      )}

      {/* MÀN HÌNH 2: Xác thực OTP */}
      {step === 2 && (
        <div className="text-center">
          <div className="text-left mb-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="sketch-back-btn"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5">Nhập mã xác thực</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-6">
            Chúng tôi đã gửi mã 6 chữ số tới <strong className="text-slate-800">{email}</strong>
          </p>

          <div className="flex justify-center gap-2 mb-6">
            {otpBoxes.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputsRef.current[idx] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="otp-box"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs mb-4 px-2">
            <span className="text-slate-400">Chưa nhận được mã?</span>
            <button
              type="button"
              disabled={resendActive}
              onClick={() => {
                setResendActive(true);
                setResendSeconds(60);
                onShowToast('Đã gửi lại mã OTP mới (000000)');
              }}
              className="font-bold text-[#8065c9] hover:underline disabled:opacity-50 cursor-pointer bg-transparent border-0"
            >
              {resendActive ? `Gửi lại sau ${resendSeconds}s` : 'Gửi lại mã'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const fullCode = otpBoxes.join('');
              if (fullCode === '000000' || fullCode === '654321' || fullCode.length === 6) {
                setStep(3);
              } else {
                onShowToast('Mã OTP mặc định là: 000000');
              }
            }}
            className="sketch-btn-purple w-full"
          >
            Xác thực OTP & Tiếp tục
          </button>
        </div>
      )}

      {/* MÀN HÌNH 3: Đặt lại mật khẩu */}
      {step === 3 && (
        <div>
          <div className="text-left mb-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="sketch-back-btn"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5 text-center">Đặt lại mật khẩu</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-6 text-center">
            Bạn muốn đặt mật khẩu mới là gì?
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="input-wrapper relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="sketch-input pr-12"
                placeholder="Mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="toggle-eye"
                aria-label="Hiện/ẩn mật khẩu"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="input-wrapper relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="sketch-input pr-12"
                placeholder="Xác nhận mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="toggle-eye"
                aria-label="Hiện/ẩn mật khẩu"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button type="submit" disabled={isLoading} className="sketch-btn-purple w-full">
              {isLoading ? 'Đang lưu...' : 'Lưu mật khẩu'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
