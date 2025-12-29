
import React, { useState, useEffect } from 'react';
import { PublicLayout } from './components/public/PublicLayout';
import { Home } from './components/public/Home';
import { SocialPage } from './components/public/SocialPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/Dashboard';
import { AdminMembers } from './components/admin/Members';
import { AdminFinance } from './components/admin/Finance';
import { AdminSiteContent } from './components/admin/SiteContent';
import { AdminEvents } from './components/admin/Events';
import { AdminResources } from './components/admin/Resources'; 
import { AdminSocialProjects } from './components/admin/SocialProjects';
import { PageView, SiteContent, AppUser } from './types';
import { INITIAL_SITE_CONTENT } from './data';
import { Button } from './components/ui/Button';
import { signOut, signInAnonymously } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { Loader2, Quote } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getSiteContent } from './services/firestore';

const About = () => (
  <div className="py-20 bg-stone-50 min-h-[60vh]">
    <div className="container mx-auto px-6 text-center max-w-3xl">
       <span className="text-gold-600 font-sans tracking-[0.2em] uppercase text-xs mb-4 block">Nossa Identidade</span>
       <h2 className="text-4xl md:text-5xl font-serif text-navy-900 mb-8">Quem Somos</h2>
       <div className="p-8 bg-white rounded-xl shadow-soft">
           <p className="text-gray-600 leading-relaxed font-light text-lg">
             Página em construção com Missão, Visão e Valores. Em breve contaremos nossa história completa.
           </p>
       </div>
    </div>
  </div>
);

const Contact = () => {
  const openMap = () => {
    const address = "R. Icaraçu, 1110 - Barroso, Fortaleza - CE, 60862-735";
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-20 bg-stone-50">
        <div className="text-center mb-16">
           <span className="text-gold-600 font-sans tracking-[0.2em] uppercase text-xs mb-4 block">Fale Conosco</span>
           <h2 className="text-4xl font-serif text-navy-900">Contato & Localização</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-xl shadow-soft border-t-4 border-gold-500">
                    <h3 className="font-serif font-bold text-2xl mb-4 text-navy-900">Endereço</h3>
                    <p className="text-gray-600 font-light text-lg">
                        R. Icaraçu, 1110 - Barroso<br />
                        Fortaleza - CE, 60862-735
                    </p>
                </div>
                
                <div className="bg-white p-8 rounded-xl shadow-soft border-t-4 border-navy-900">
                   <h3 className="font-serif font-bold text-2xl mb-4 text-navy-900">Canais de Atendimento</h3>
                   <div className="space-y-2">
                       <p className="text-gray-600 text-lg font-light flex justify-between border-b border-gray-100 pb-2"><span>Email:</span> <span className="font-medium">contato@iboc.com</span></p>
                       <p className="text-gray-600 text-lg font-light flex justify-between pt-2"><span>Tel:</span> <span className="font-medium">(85) 99999-9999</span></p>
                   </div>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-gray-600 mb-6 font-light italic">
                    "Alegrei-me quando me disseram: Vamos à casa do Senhor."
                  </p>
                  <Button onClick={openMap} variant="primary" className="w-full py-4 text-sm shadow-lg">
                    Abrir no Google Maps
                  </Button>
                </div>
            </div>
            
            <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-xl bg-white border-4 border-white">
                <iframe 
                    width="100%" 
                    height="100%" 
                    id="gmap_canvas" 
                    src="https://maps.google.com/maps?q=R.+Icara%C3%A7u,+1110+-+Barroso,+Fortaleza+-+CE,+60862-735&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0}
                    title="Mapa da Igreja"
                    className="filter grayscale-[20%]"
                ></iframe>
            </div>
        </div>
    </div>
  );
};

const LOGIN_VERSES = [
    { text: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.", ref: "Salmos 119:105" },
    { text: "Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai, a não ser por mim.", ref: "João 14:6" },
    { text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", ref: "Provérbios 3:5" },
    { text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.", ref: "Salmos 91:1" },
    { text: "Espera no Senhor, anima-te, e ele fortalecerá o teu coração; espera, pois, no Senhor.", ref: "Salmos 27:14" },
    { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
    { text: "Porque dele, e por ele, e para ele são todas as coisas; glória, pois, a ele eternamente.", ref: "Romanos 11:36" }
];

const Login: React.FC<{ onLogin: (user: AppUser) => void, onBack: () => void }> = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(LOGIN_VERSES[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * LOGIN_VERSES.length);
    setCurrentVerse(LOGIN_VERSES[randomIndex]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInAnonymously(auth);
    } catch (e: any) {
         console.warn("Auth warning:", e.code);
    }
    
    if (username === 'rorim' && password === '1234') {
        setTimeout(() => {
            onLogin({
                uid: 'master-001',
                email: 'master@iboc.com',
                type: 'master',
                displayName: 'Administrador Master',
                permissions: 'admin'
            });
            setLoading(false);
        }, 500);
        return;
    }

    try {
        const membersRef = collection(db, 'members');
        const q = query(membersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            let foundUser = false;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.password === password) {
                    foundUser = true;
                    onLogin({
                        uid: doc.id,
                        email: data.email,
                        type: 'member',
                        displayName: data.fullName,
                        permissions: data.permissions || 'viewer'
                    });
                }
            });

            if (foundUser) {
                setLoading(false);
                return;
            }
        }
        
        setError('Credenciais inválidas.');
    } catch (err: any) {
        console.error("Erro no login:", err);
        setError('Erro de conexão.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-[55%] relative bg-navy-900 items-center justify-center overflow-hidden">
         <img 
            src="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=2071&auto=format&fit=crop" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            alt="Caminho"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/40 to-navy-900/30 mix-blend-multiply" />
         <div className="relative z-10 p-16 max-w-2xl text-center">
            <div className="mb-8 opacity-80 flex justify-center">
                <div className="p-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm">
                    <Quote size={32} className="text-gold-400 fill-current" />
                </div>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-white italic leading-tight drop-shadow-lg mb-8">
                "{currentVerse.text}"
            </h2>
            <div className="inline-flex items-center justify-center gap-4">
                 <div className="h-[1px] w-12 bg-gold-500/60"></div>
                 <p className="text-gold-400 font-sans tracking-[0.2em] uppercase font-semibold text-sm">
                    {currentVerse.ref}
                 </p>
                 <div className="h-[1px] w-12 bg-gold-500/60"></div>
            </div>
         </div>
      </div>

      <div className="w-full lg:w-[45%] flex items-center justify-center bg-stone-50 relative">
         <div className="max-w-md w-full p-8 md:p-12 relative z-10">
            <div className="bg-white/90 backdrop-blur-xl lg:bg-white rounded-2xl shadow-2xl p-8 lg:p-10 border border-white/50 lg:border-gray-100">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-navy-900 rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-gold-500/20">
                        <span className="text-gold-500 font-serif text-2xl font-bold italic">I</span>
                    </div>
                    <h2 className="text-3xl font-serif text-navy-900 text-center">Área de Líderes</h2>
                    <p className="text-gray-500 text-xs tracking-[0.2em] uppercase mt-2">Acesso ao Sistema</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Usuário</label>
                    <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none bg-white text-gray-900 transition-all font-medium" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Identificação"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Senha</label>
                    <input 
                    type="password" 
                    required
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none bg-white text-gray-900 transition-all font-medium" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    />
                </div>
                {error && <div className="text-red-500 text-xs text-center font-medium bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
                    {error}
                </div>}
                <Button type="submit" disabled={loading} className="w-full shadow-glow py-4 mt-4 text-sm tracking-widest font-bold">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'ENTRAR'}
                </Button>
                </form>
                <div className="mt-8 text-center pt-6 border-t border-gray-100">
                <button onClick={onBack} className="text-xs text-gray-400 hover:text-navy-900 transition-colors uppercase tracking-widest font-medium">
                    Voltar ao site principal
                </button>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>(PageView.PUBLIC_HOME);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [siteContent, setSiteContent] = useState<SiteContent>(INITIAL_SITE_CONTENT);

  // BUSCA INICIAL: Sincroniza com o que está salvo no Firebase assim que abre o app
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const content = await getSiteContent();
        if (content) {
          setSiteContent(content);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações iniciais:", err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchSettings();
  }, []);

  const handleLoginSuccess = (loggedInUser: AppUser) => {
    setUser(loggedInUser);
    setCurrentPage(PageView.ADMIN_DASHBOARD);
  };

  const handleLogout = async () => {
    await signOut(auth).catch(() => {});
    setUser(null);
    setCurrentPage(PageView.PUBLIC_HOME);
  };

  const isPublic = [
    PageView.PUBLIC_HOME, 
    PageView.PUBLIC_ABOUT, 
    PageView.PUBLIC_CONTACT,
    PageView.PUBLIC_SOCIAL
  ].includes(currentPage);

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-navy-900 mb-4" size={32} />
        <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Iniciando IBOC Digital...</p>
      </div>
    );
  }

  if (currentPage === PageView.LOGIN) {
    if (user) {
      setCurrentPage(PageView.ADMIN_DASHBOARD);
      return null;
    }
    return <Login onLogin={handleLoginSuccess} onBack={() => setCurrentPage(PageView.PUBLIC_HOME)} />;
  }

  if (isPublic) {
    return (
      <PublicLayout activePage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === PageView.PUBLIC_HOME && <Home onNavigate={setCurrentPage} content={siteContent} />}
        {currentPage === PageView.PUBLIC_ABOUT && <About />}
        {currentPage === PageView.PUBLIC_SOCIAL && <SocialPage />}
        {currentPage === PageView.PUBLIC_CONTACT && <Contact />}
      </PublicLayout>
    );
  }

  if (user) {
    return (
      <AdminLayout activePage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout}>
        {currentPage === PageView.ADMIN_DASHBOARD && <AdminDashboard />}
        {currentPage === PageView.ADMIN_SOCIAL && <AdminSocialProjects />}
        {currentPage === PageView.ADMIN_MEMBERS && <AdminMembers currentUser={user} />}
        {currentPage === PageView.ADMIN_FINANCE && <AdminFinance />}
        {currentPage === PageView.ADMIN_CALENDAR && <AdminEvents />}
        {currentPage === PageView.ADMIN_RESOURCES && <AdminResources />}
        {currentPage === PageView.ADMIN_SITE_CONTENT && (
          <AdminSiteContent 
            content={siteContent} 
            onUpdate={setSiteContent} 
          />
        )}
      </AdminLayout>
    );
  }

  setCurrentPage(PageView.LOGIN);
  return null;
};

export default App;
