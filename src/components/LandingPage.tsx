import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cart24Regular,
  FoodPizza24Regular,
  Trophy24Regular,
  ChartMultiple24Regular,
  People24Regular,
  ArrowRight24Regular,
  Checkmark24Regular,
  Building24Regular,
  Rocket24Regular,
  CloudCheckmark24Regular,
  DeviceEq24Regular,
  BookInformation24Regular,
  ShieldCheckmark24Regular,
  ArrowDown24Regular,
  Call24Regular,
  Globe24Regular,
  Mail24Regular,
  QuestionCircle24Regular,
  Eye24Regular
} from "@fluentui/react-icons";
import { useEffect, useState } from "react";

interface LandingPageProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // Check cookie consent
    const consent = localStorage.getItem("skypdv-cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setShowCookieConsent(true), 2500);
      return () => {
        window.removeEventListener("scroll", handleScroll);
        clearTimeout(timer);
      };
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("skypdv-cookie-consent", "true");
    setShowCookieConsent(false);
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const features = [
    {
      icon: Cart24Regular,
      title: "Gestão de Vendas",
      description: "Controle completo de vendas locais e delivery em tempo real com interface intuitiva."
    },
    {
      icon: FoodPizza24Regular,
      title: "Catálogo Digital",
      description: "Menu digital interativo para FastFood que permite pedidos diretos e rápidos."
    },
    {
      icon: ChartMultiple24Regular,
      title: "Relatórios IA",
      description: "Análise profunda de tendências de vendas e comportamento do consumidor."
    },
    {
      icon: People24Regular,
      title: "CRM Integrado",
      description: "Gestão de fidelidade e histórico de compras para um atendimento personalizado."
    },
    {
      icon: Trophy24Regular,
      title: "Performance Elite",
      description: "Sistema otimizado para alta carga, garantindo zero atrasos no fechamento."
    },
    {
      icon: Building24Regular,
      title: "Ecossistema Sky",
      description: "Integração total com SkyVenda MZ para sincronização de estoque e contabilidade."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth select-none selection:bg-primary/30">
      {/* Sticky Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "acrylic-surface border-b border-border/50 py-3 shadow-xl" : "bg-transparent py-6"
        }`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40 transform hover:scale-105 transition-transform">
              <span className="text-xl font-black text-white italic">S</span>
            </div>
            <span className="text-2xl font-black tracking-tighter">SkyPDV</span>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            <button onClick={() => scrollTo('features')} className="text-xs font-black hover:text-primary transition-all uppercase tracking-[0.2em]">Recursos</button>
            <button onClick={() => scrollTo('delivery')} className="text-xs font-black hover:text-primary transition-all uppercase tracking-[0.2em]">Delivery</button>
            <button onClick={() => scrollTo('devices')} className="text-xs font-black hover:text-primary transition-all uppercase tracking-[0.2em]">Dispositivos</button>
            <button onClick={() => scrollTo('pricing')} className="text-xs font-black hover:text-primary transition-all uppercase tracking-[0.2em]">Planos</button>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:inline-flex font-bold hover:bg-primary/5 rounded-xl transition-all" onClick={onLoginClick}>
              Entrar
            </Button>
            <Button className="shadow-2xl shadow-primary/40 h-11 px-8 font-black rounded-xl bg-primary hover:bg-primary/90 transition-all active:scale-95" onClick={onLoginClick}>
              Teste Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="hero.png"
            alt="Hero background"
            className="w-full h-full object-cover grayscale-[20%] brightness-[0.7] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="max-w-4xl text-left space-y-8">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-primary shadow-2xl shadow-primary/50 text-[10px] font-black text-white tracking-[0.2em] uppercase mb-4 animate-bounce">
              <Rocket24Regular className="w-5 h-5" />
              BlueSpark Innovation 2026
            </div>

            <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tighter mb-8 leading-[0.85] text-foreground drop-shadow-2xl uppercase">
              Venda como <br />
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-blue-400 bg-clip-text text-transparent italic pr-2">
                Gigante.
              </span>
            </h1>

            <p className="text-xl md:text-3xl text-muted-foreground max-w-2xl leading-relaxed font-semibold italic border-l-4 border-primary pl-6">
              SkyPDV: Elevando o padrão comercial de Moçambique com gestão em tempo real e inteligência nativa.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-start pt-6">
              <Button size="lg" className="h-20 px-14 text-2xl font-black group rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(79,70,229,0.5)] bg-primary hover:bg-primary/90 transition-all overflow-hidden relative active:scale-95 text-white" onClick={onLoginClick}>
                <span className="relative z-10 flex items-center gap-3">
                  Iniciar Jornada
                  <ArrowRight24Regular className="group-hover:translate-x-3 transition-transform h-8 w-8" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-32 bg-secondary/10 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24 space-y-4">
            <span className="text-primary font-black uppercase tracking-[0.5em] text-xs">Core Technology</span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">Funcionalidades de Elite</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div key={index} className="group p-10 rounded-[40px] bg-background border border-border/50 hover:border-primary/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialty Delivery / FastFood */}
      <section id="delivery" className="py-32 bg-slate-950 text-white relative overflow-hidden">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-xl bg-amber-500 text-white font-black text-[10px] tracking-widest uppercase">
              <FoodPizza24Regular className="w-4 h-4" />
              Especializado em Gastro
            </div>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
              FastFood <br />
              <span className="text-amber-500 italic uppercase">Próxima Geração.</span>
            </h2>
            <p className="text-xl md:text-2xl text-white/60 leading-relaxed font-medium">
              Integração nativa de catálogo digital e delivery direto no seu terminal de vendas.
            </p>
            <Button size="lg" className="h-16 px-12 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-3xl" onClick={onLoginClick}>
              Explore Delivery
            </Button>
          </div>
          <div className="relative aspect-square rounded-[40px] bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
            <FoodPizza24Regular className="w-64 h-64 text-amber-500/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Multi-Device Support */}
      <section id="devices" className="py-32 bg-background relative overflow-hidden">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative group grayscale-[20%] hover:grayscale-0 transition-all duration-700">
            <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full"></div>
            <img src="responsive.png" alt="Multi devices" className="relative z-10 w-full hover:scale-105 transition-transform duration-700 drop-shadow-2xl" />
          </div>
          <div className="space-y-8">
            <div className="text-primary font-black uppercase tracking-[0.4em] text-xs">Venda em qualquer lugar</div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
              Controle Total <br />
              <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent italic">Multi-Plataforma</span>.
            </h2>
            <p className="text-xl text-muted-foreground font-bold leading-relaxed">
              O SkyPDV foi desenhado para rodar perfeitamente no PC, Tablet ou Smartphone.
              Gerencie suas vendas do balcão ou do conforto da sua casa.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["Desktop / PC", "Tablets", "Android / iOS", "Cloud Dashboard"].map(item => (
                <div key={item} className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/50 border border-border">
                  <Checkmark24Regular className="text-primary w-5 h-5" />
                  <span className="font-black text-sm uppercase tracking-tighter">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section id="how-it-works" className="py-32 bg-primary/5">
        <div className="container mx-auto px-6 text-center mb-24">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter">SkyFlow Methodology</h2>
        </div>
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            { step: "01", title: "Ative", icon: CloudCheckmark24Regular, desc: "Crie sua conta no SkyVenda MZ em segundos." },
            { step: "02", title: "Configure", icon: DeviceEq24Regular, desc: "Personalize seu cardápio e terminais." },
            { step: "03", title: "Escalone", icon: Rocket24Regular, desc: "Aumente seu lucro com tecnologia de ponta." }
          ].map(item => (
            <div key={item.step} className="text-center group">
              <div className="w-20 h-20 rounded-[30px] bg-background shadow-2xl mx-auto flex items-center justify-center mb-8 border border-border group-hover:-translate-y-2 transition-transform">
                <item.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-3xl font-black mb-4">{item.title}</h3>
              <p className="text-muted-foreground font-bold italic opacity-70 px-4">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-40">
        <div className="container mx-auto px-6 text-center mb-24">
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter">Planos de Poder.</h2>
        </div>
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { name: "Basic", price: "2.500", highlight: false },
            { name: "Professional", price: "5.500", highlight: true },
            { name: "Enterprise", price: "Custom", highlight: false }
          ].map(plan => (
            <div key={plan.name} className={`p-16 rounded-[50px] border-4 flex flex-col h-full transition-all duration-700 ${plan.highlight ? "bg-primary text-white border-primary shadow-2xl scale-105 z-10" : "bg-background border-border hover:border-primary/20 shadow-xl"}`}>
              <h3 className="text-3xl font-black mb-10 uppercase tracking-tighter">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-12">
                <span className="text-7xl font-black tracking-tighter">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-2xl font-bold opacity-60">MT</span>}
              </div>
              <div className="flex-grow space-y-4 mb-12">
                {["Terminal Ilimitado*", "Suporte VIP", "Gestão Cloud"].map(f => (
                  <div key={f} className="flex items-center gap-3 font-bold text-lg">
                    <Checkmark24Regular className={`w-5 h-5 ${plan.highlight ? "text-white" : "text-primary"}`} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Button className={`w-full h-18 rounded-[2rem] text-xl font-black ${plan.highlight ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-white"}`} onClick={onLoginClick}>
                Escolher {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-secondary/20 border-t border-border/50">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl">S</div>
              <span className="text-2xl font-black tracking-tighter">SkyPDV</span>
            </div>
            <p className="text-lg text-muted-foreground font-semibold italic">Desenvolvido pela BlueSpark MZ Group em Moçambique.</p>
            <div className="flex flex-col gap-2 font-black">
              <span className="text-primary text-2xl tracking-tighter underline">860716912</span>
              <span className="text-muted-foreground opacity-50 underline">contato@bluesparkmz.com</span>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-8">Navegação</h4>
            <div className="flex flex-col gap-4 font-black text-muted-foreground uppercase text-sm">
              <span onClick={() => scrollTo('features')} className="hover:text-primary cursor-pointer transition-colors">Recursos</span>
              <span onClick={() => scrollTo('devices')} className="hover:text-primary cursor-pointer transition-colors">Dispositivos</span>
              <span onClick={() => scrollTo('pricing')} className="hover:text-primary cursor-pointer transition-colors">Preços</span>
              <span className="hover:text-primary cursor-pointer transition-colors italic">Privacidade</span>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-8">Ecossistema</h4>
            <div className="flex flex-col gap-4 font-black text-muted-foreground uppercase text-sm">
              <a href="https://bluesparkmz.com" target="_blank">BlueSpark MZ</a>
              <a href="https://skyvenda.com" target="_blank">SkyVenda</a>
              <a href="https://fastfood.skyvenda.com" target="_blank">FastFood</a>
              <a href="https://smartmoz.skyvenda.com" target="_blank">SmartMoz</a>
            </div>
          </div>
          <div className="p-8 rounded-[40px] bg-background border border-border shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 font-black text-primary mb-4">
              <ShieldCheckmark24Regular className="w-5 h-5" /> Secured Data
            </div>
            <p className="text-xs font-bold text-muted-foreground opacity-70">Operação em total conformidade com protocolos de segurança bancária.</p>
          </div>
        </div>
        <div className="container mx-auto px-6 pt-24 mt-24 border-t border-border/30 text-center">
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-black shadow-xl uppercase tracking-widest text-xs">
            <Building24Regular className="w-5 h-5" /> MOZAMBIQUE TECHNOLOGY 🇲🇿
          </div>
        </div>
      </footer>

      {/* Cookie Consent */}
      {showCookieConsent && (
        <div className="fixed bottom-10 left-10 right-10 z-[100] animate-[slide-up_0.8s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="max-w-6xl mx-auto acrylic-surface border-4 border-primary/30 p-10 rounded-[3rem] shadow-3xl flex flex-col lg:flex-row items-center gap-10">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
              <Eye24Regular className="w-10 h-10" />
            </div>
            <div className="flex-grow space-y-2 text-center lg:text-left">
              <h4 className="text-3xl font-black uppercase tracking-tighter">Segurança de Dados</h4>
              <p className="text-lg text-muted-foreground font-bold italic">Utilizamos cookies para otimizar sua performance conforme o protocolo BlueSpark Framework.</p>
            </div>
            <div className="flex gap-4 w-full lg:w-auto">
              <Button variant="outline" className="h-16 flex-grow lg:flex-none px-10 rounded-2xl font-black text-xl border-4" onClick={() => setShowCookieConsent(false)}>Recusar</Button>
              <Button className="h-16 flex-grow lg:flex-none px-12 rounded-2xl font-black text-xl bg-primary text-white shadow-2xl" onClick={acceptCookies}>Permitir</Button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        body {
          scrollbar-width: thin;
          scrollbar-color: #4f46e5 transparent;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background-color: #4f46e5;
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}
