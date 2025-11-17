import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            {t('auth.title')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-2 border-red-500">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
                minLength={6}
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors mt-6"
              disabled={loading}
            >
              {loading ? t('auth.loggingIn') : t('auth.loginButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
