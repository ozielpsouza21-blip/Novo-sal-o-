import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Camera, Trash2, Image as ImageIcon } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: (user: any) => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg('A imagem deve ter no máximo 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validações locais básicas
    if (!nome.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // 1. Registro no Supabase Auth com metadados padrão 'cliente' e avatar opcional
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: nome.trim(),
            nome: nome.trim(),
            role: 'cliente', // Definido explicitamente como 'cliente'
            avatar_url: avatarUrl || null
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // Persistência local para garantir exibição imediata
      if (avatarUrl) {
        try {
          localStorage.setItem(`studioroyale_user_avatar_${email.trim().toLowerCase()}`, avatarUrl);
          const currentProfileStr = localStorage.getItem('vitrine_customer_profile');
          if (currentProfileStr) {
            const parsed = JSON.parse(currentProfileStr);
            parsed.avatar = avatarUrl;
            parsed.name = nome.trim();
            parsed.email = email.trim();
            if (telefone.trim()) parsed.phone = telefone.trim();
            localStorage.setItem('vitrine_customer_profile', JSON.stringify(parsed));
          } else {
            localStorage.setItem('vitrine_customer_profile', JSON.stringify({
              name: nome.trim(),
              email: email.trim(),
              phone: telefone.trim(),
              address: '',
              avatar: avatarUrl,
              bio: 'Cliente VIP Studio Royale.'
            }));
          }
        } catch (storageErr) {
          console.warn('Erro ao salvar avatar no cache local:', storageErr);
        }
      }

      if (data.user) {
        // 2. Garantia complementar na tabela perfis com role 'cliente'
        try {
          const { error: profileError } = await supabase
            .from('perfis')
            .upsert([
              {
                id: data.user.id,
                nome: nome.trim(),
                email: email.trim(),
                telefone: telefone.trim() || null,
                avatar_url: avatarUrl || null,
                role: 'cliente' // Garantido como cliente
              }
            ], { onConflict: 'id' });

          if (profileError) {
            console.info('Criação do perfil gerida automaticamente pelo trigger do banco:', profileError.message);
          }
        } catch (pErr) {
          console.warn('Registro gerenciado nativamente pelo trigger da tabela perfis:', pErr);
        }

        setSuccessMsg('Conta criada com sucesso! O perfil de cliente foi registrado com segurança.');

        if (onSuccess) {
          onSuccess(data.user);
        }
      } else {
        setSuccessMsg('Cadastro iniciado. Verifique seu e-mail para confirmar a conta.');
      }
    } catch (err: any) {
      console.error('Erro no formulário de registro:', err);
      setErrorMsg(err.message || 'Falha ao realizar o cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Helper para monograma de avatar padrão
  const getInitials = (nameStr: string) => {
    if (!nameStr.trim()) return 'SR';
    const parts = nameStr.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Criar Sua Conta VIP</h2>
        <p className="text-xs text-slate-400 mt-1">
          Cadastre-se para agendar serviços e realizar compras no Studio Royale.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2 text-rose-300 text-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-2 text-emerald-300 text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        {/* Seletor Opcional de Foto de Perfil */}
        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Foto de perfil selecionada"
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg shadow-inner">
                {getInitials(nome)}
              </div>
            )}
            <label
              htmlFor="register-avatar-input"
              className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full cursor-pointer shadow-md transition-transform hover:scale-110"
              title="Carregar foto"
            >
              <Camera className="w-3.5 h-3.5" />
            </label>
            <input
              id="register-avatar-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Foto de Perfil</span>
              <span className="text-[10px] text-amber-400 font-medium">Opcional</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              {avatarUrl ? 'Foto selecionada com sucesso.' : 'Personalize sua experiência no Studio Royale.'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <label
                htmlFor="register-avatar-input"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 cursor-pointer transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{avatarUrl ? 'Substituir foto' : 'Escolher foto'}</span>
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors ml-2"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remover</span>
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Nome Completo */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome Completo</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* E-mail */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Telefone / WhatsApp (Opcional)</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* Senha */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirmar Senha */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirmar Senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a senha novamente"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400 flex items-center justify-between">
          <span>Tipo de Conta:</span>
          <span className="font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 uppercase text-[10px]">
            Cliente (Padrão)
          </span>
        </div>

        {/* Botão de Envio */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Criando conta segura...</span>
            </>
          ) : (
            <>
              <span>Concluir Cadastro</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {onSwitchToLogin && (
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Já possui uma conta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-amber-400 font-bold hover:underline transition-all"
            >
              Fazer Login
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
