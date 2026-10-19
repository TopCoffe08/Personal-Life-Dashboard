import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Compass, Lock, Mail, User as UserIcon, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, register, forgotPassword, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password reset specific
  const [recoveryToken, setRecoveryToken] = useState('');
  const [generatedTokenNotice, setGeneratedTokenNotice] = useState<string | null>(null);

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessInfo(null);
    setGeneratedTokenNotice(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Kata sandi harus minimal 8 karakter demi keamanan.');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, confirmPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Pendaftaran gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessInfo(null);
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccessInfo(res.message);
      if (res.recoveryToken) {
        setGeneratedTokenNotice(res.recoveryToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses permintaan.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 8) {
      setErrorMsg('Kata sandi baru minimal 8 karakter.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(recoveryToken, password);
      setSuccessInfo('Kata sandi berhasil direset! Silakan login menggunakan kata sandi baru Anda.');
      setMode('login');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await login('demo@example.com', 'Password123!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk dengan akun demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Personal Life Dashboard
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
          Aplikasi Pengelolaan Rutinitas, Kebiasaan, Target, dan Jurnal Pribadi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800">
          {/* Quick Demo Login Banner */}
          <div className="mb-6 p-3.5 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-semibold text-blue-200 block">Ingin mencoba langsung?</span>
              <span className="text-slate-400 text-[11px]">Gunakan akun demo dengan data sampel 2026</span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition shrink-0 cursor-pointer disabled:opacity-50"
            >
              Masuk Demo
            </button>
          </div>

          {/* Mode Switch Tabs */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex rounded-xl bg-slate-800/80 p-1 mb-6 border border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetFormState();
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Masuk (Login)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  resetFormState();
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daftar Akun Baru
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successInfo && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Berhasil:</span>
              </div>
              <p>{successInfo}</p>
            </div>
          )}

          {generatedTokenNotice && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs space-y-2">
              <p className="font-bold text-amber-300">Token Pemulihan Akun Anda:</p>
              <div className="bg-slate-950 p-2 rounded border border-amber-500/20 font-mono text-center font-bold tracking-wider select-all text-amber-400">
                {generatedTokenNotice}
              </div>
              <button
                type="button"
                onClick={() => {
                  setRecoveryToken(generatedTokenNotice);
                  setMode('reset');
                  setGeneratedTokenNotice(null);
                }}
                className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition"
              >
                Lanjut ke Reset Kata Sandi →
              </button>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Kata Sandi</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      resetFormState();
                    }}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Tampilan</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi (Min. 8 Karakter)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ulangi Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Ketik ulang kata sandi"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="text-center pb-2">
                <KeyRound className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-white">Pemulihan Kata Sandi</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Masukkan email akun Anda untuk mendapatkan token pemulihan yang aman.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Terdaftar</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-slate-950 text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Memproses...' : 'Dapatkan Token Pemulihan'}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    resetFormState();
                  }}
                  className="text-blue-400 hover:underline"
                >
                  Sudah punya token?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    resetFormState();
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  Kembali ke Login
                </button>
              </div>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="text-center pb-2">
                <KeyRound className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-white">Atur Kata Sandi Baru</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Masukkan token pemulihan dan buat kata sandi baru.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Token Pemulihan</label>
                <input
                  type="text"
                  required
                  placeholder="Tempel token pemulihan di sini"
                  value={recoveryToken}
                  onChange={(e) => setRecoveryToken(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi Baru (Min. 8 Karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Kata sandi baru"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    resetFormState();
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Kembali ke Halaman Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
