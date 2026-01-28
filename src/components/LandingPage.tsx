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
      const offset = 80; // height of sticky nav
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
            <button onClick={() => scrollTo('how-it-works')} className="text-xs font-black hover:text-primary transition-all uppercase tracking-[0.2em]">Metodologia</button>
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

      {/* Hero Section with Image Background */}
      <header className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        {/* Background Image with sophisticated overlays */}
        <div className="absolute inset-0 -z-10">
          <img
            src="/hero.png"
            alt="SkyPDV Premium POS System"
            className="w-full h-full object-cover grayscale-[20%] brightness-[0.8] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"></div>
        </div>

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="max-w-4xl text-left space-y-10">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-primary shadow-2xl shadow-primary/50 text-xs font-black text-white tracking-[0.2em] uppercase mb-4 animate-bounce">
              <Rocket24Regular className="w-5 h-5" />
              BlueSpark Innovation 2026
            </div>

            <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tighter mb-8 leading-[0.85] text-foreground drop-shadow-2xl">
              Venda como <br />
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-blue-400 bg-clip-text text-transparent italic pr-2">
                Gigante.
              </span>
            </h1>

            <p className="text-xl md:text-3xl text-muted-foreground max-w-2xl leading-relaxed font-semibold italic border-l-4 border-primary pl-6">
              SkyPDV: Elevando o padrão comercial de Moçambique com gestão em tempo real e inteligência nativa.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-start pt-6">
              <Button size="lg" className="h-20 px-14 text-2xl font-black group rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(79,70,229,0.5)] bg-primary hover:bg-primary/90 transition-all overflow-hidden relative active:scale-95" onClick={onLoginClick}>
                <span className="relative z-10 flex items-center gap-3">
                  Iniciar Jornada
                  <ArrowRight24Regular className="group-hover:translate-x-3 transition-transform h-8 w-8" />
                </span>
              </Button>
              <div className="flex flex-col gap-1 px-4 py-2 bg-background/30 backdrop-blur-sm rounded-2xl border border-white/10">
                <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest opacity-60">Verified Ecosystem</span>
                <span className="text-lg font-black tracking-tighter text-primary">BlueSpark MZ Group</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-primary/20 blur-[150px] rounded-full animate-pulse"></div>
            <div className="acrylic-surface border-2 border-white/20 p-2 rounded-[50px] shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
              <div className="bg-slate-900 rounded-[45px] aspect-video border border-white/10 flex flex-col items-center justify-center p-12 overflow-hidden relative">
                <div className="absolute top-6 left-6 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/30"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/30"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/30"></div>
                </div>
                <div className="text-white/20 text-3xl font-black italic select-none">PREMIUM INTERFACE</div>
                <div className="mt-8 grid grid-cols-4 gap-4 w-full">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-2 bg-primary/20 rounded-full w-full"></div>)}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 w-full opacity-50">
                  {[1, 2, 3].map(i => <div key={i} className="h-2 bg-white/10 rounded-full w-full"></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce cursor-pointer group" onClick={() => scrollTo('features')}>
          <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.4em] group-hover:text-primary transition-colors">Explore Experience</span>
          <ArrowDown24Regular className="text-primary w-6 h-6" />
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-40 bg-secondary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="container mx-auto px-6 relative">
          <div className="flex flex-col lg:flex-row items-baseline justify-between mb-32 gap-10">
            <div className="max-w-4xl space-y-6">
              <span className="text-primary font-black uppercase tracking-[0.5em] text-xs">Innovation Hub</span>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight">Arquitetura de <br /> <span className="text-primary italic underline decoration-primary/20 underline-offset-8">Alta Performance</span>.</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-sm leading-relaxed font-medium italic opacity-70">
              "Desenvolvido pela elite tecnológica moçambicana para o mundo." — Team BlueSpark
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="group p-12 rounded-[50px] bg-background border border-border/50 hover:border-primary/40 hover:shadow-[0_40px_80px_-15px_rgba(79,70,229,0.15)] transition-all duration-700 hover:-translate-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[60px] rounded-full translate-x-24 -translate-y-24 group-hover:bg-primary/10 transition-colors"></div>
                <div className="w-24 h-24 rounded-[30px] bg-primary/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-inner shadow-primary/20 border border-primary/10">
                  <feature.icon className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-3xl font-black mb-5 tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg font-medium opacity-80">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialty Delivery / FastFood Showcase */}
      <section id="delivery" className="py-40 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-primary/30 via-transparent to-transparent"></div>
        <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-12">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl bg-amber-500 text-white font-black text-xs tracking-widest uppercase shadow-2xl shadow-amber-500/40">
              <FoodPizza24Regular className="w-5 h-5" />
              Specialized Gastro Module
            </div>
            <h2 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85]">
              FastFood <br />
              <span className="text-amber-500 italic">Connected.</span>
            </h2>
            <p className="text-2xl md:text-3xl text-white/50 leading-relaxed font-bold">
              O único sistema que integra catálogo digital e delivery nativo no POS de balcão.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8">
              {[
                "Visual Live Catalog",
                "Mesa QR Integration",
                "Automated Dispatch",
                "Cook View Terminal"
              ].map((item, id) => (
                <div key={id} className="flex items-center gap-5 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                  <Checkmark24Regular className="text-amber-500 w-6 h-6 group-hover:scale-125 transition-transform" />
                  <span className="font-black text-lg tracking-tight uppercase tracking-[0.1em]">{item}</span>
                </div>
              ))}
            </div>

            <Button size="lg" className="h-20 px-14 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-amber-500/50 text-2xl active:scale-95 transition-all" onClick={onLoginClick}>
              Dominar Delivery
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 blur-[200px] rounded-full animate-pulse"></div>
            <div className="relative acrylic-surface p-4 rounded-[60px] border border-white/10 shadow-3xl hover:scale-105 transition-transform duration-700">
              <div className="aspect-square rounded-[50px] bg-slate-900 flex items-center justify-center overflow-hidden border border-white/10 relative">
                <FoodPizza24Regular className="w-80 h-80 text-amber-500 opacity-20 animate-pulse" />
                <div className="absolute inset-20 border-4 border-amber-500/20 rounded-full border-dashed animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute bottom-10 inset-x-10 p-8 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <div className="text-amber-500 font-black mb-2 tracking-[0.3em] text-xs">LIVE ORDER #2026</div>
                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-3/4 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Methodology */}
      <section id="how-it-works" className="py-40 relative bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-32 space-y-6">
            <span className="text-primary font-black uppercase tracking-[0.6em] text-sm">Deployment Strategy</span>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter">Metodologia SkyFlow</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-24 relative">
            <div className="hidden lg:block absolute top-[40px] left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            {[
              { step: "01", title: "Ative a Nuvem", icon: CloudCheckmark24Regular, color: "text-blue-500", desc: "Integração instantânea com o core SkyVenda MZ." },
              { step: "02", title: "Configure UX", icon: DeviceEq24Regular, color: "text-primary", desc: "Personalização profunda de catálogo e terminais." },
              { step: "03", title: "Venda Full", icon: Rocket24Regular, color: "text-emerald-500", desc: "Performance extrema para escala comercial." }
            ].map((item, idx) => (
              <div key={idx} className="relative text-center group space-y-8">
                <div className="w-24 h-24 rounded-[35px] bg-background border-2 border-border shadow-2xl mx-auto flex items-center justify-center group-hover:border-primary group-hover:shadow-primary/20 group-hover:-translate-y-4 transition-all duration-700 relative z-10">
                  <item.icon className={`w-12 h-12 ${item.color}`} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-black tracking-tighter uppercase">{item.title}</h3>
                  <p className="text-muted-foreground font-bold text-lg max-w-xs mx-auto italic opacity-70 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="text-[12rem] font-black absolute top-0 left-1/2 -translate-x-1/2 -translate-y-24 text-primary/5 select-none -z-0 group-hover:text-primary/10 transition-colors">{item.step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fixed Pricing Plans */}
      <section id="pricing" className="py-40 bg-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>
        <div className="container mx-auto px-6 relative z-10 text-center mb-32 space-y-6">
          <h2 className="text-6xl md:text-9xl font-black tracking-tighter">Planos de Poder.</h2>
          <p className="text-2xl md:text-3xl text-muted-foreground font-black uppercase tracking-tight opacity-60">Faturamento Real começa aqui.</p>
        </div>

        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
            {[
              { name: "Basic", price: "2.500", highlight: false, features: ["1 Terminal PDV", "CRM Essencial", "Relatórios Diários"] },
              { name: "Professional", price: "5.500", highlight: true, features: ["Terminais Ilimitados", "Módulo Gastro Full", "Fidelização CRM", "Analytics em Tempo Real", "Delivery Integrado", "Suporte VIP 24/7"] },
              { name: "Enterprise", price: "Custom", highlight: false, features: ["API Dedicada", "SLA Garantido", "UI Customizada", "Multi-Empresa"] }
            ].map((plan, i) => (
              <div key={i} className={`p-16 rounded-[4rem] border-4 transition-all duration-700 flex flex-col h-full relative group ${plan.highlight
                ? "bg-primary text-white border-primary shadow-[0_60px_120px_-30px_rgba(79,70,229,0.5)] scale-110 z-20"
                : "bg-background border-border hover:border-primary/40 shadow-2xl z-10"
                }`}>
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-primary px-8 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Recomendado</div>
                )}
                <h3 className="text-4xl font-black mb-4 tracking-tighter uppercase">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-12">
                  <span className="text-7xl font-black tracking-tighter">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-2xl font-bold opacity-60">MT</span>}
                </div>
                <ul className="space-y-6 flex-grow mb-16">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-5 font-black text-lg tracking-tight">
                      <Checkmark24Regular className={`w-6 h-6 flex-shrink-0 ${plan.highlight ? "text-white" : "text-primary"}`} />
                      <span className={`${plan.highlight ? "opacity-90" : "opacity-80"}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full h-20 rounded-[2.5rem] text-2xl font-black shadow-2xl transition-all active:scale-95 ${plan.highlight ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-white"
                    }`}
                  onClick={onLoginClick}
                >
                  Selecionar {plan.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Performance CTA */}
      <section className="py-40">
        <div className="container mx-auto px-6">
          <div className="relative p-16 md:p-32 rounded-[5rem] overflow-hidden bg-slate-950 text-white text-center shadow-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-blue-500/10 -z-0"></div>
            <div className="relative z-10 space-y-16">
              <h2 className="text-5xl md:text-[8rem] font-black leading-[0.85] tracking-tighter max-w-6xl mx-auto drop-shadow-2xl">
                Sua revolução <br /> começa <span className="text-primary italic">Hoje.</span>
              </h2>
              <p className="text-2xl md:text-4xl text-white/50 max-w-3xl mx-auto leading-relaxed font-bold italic underline decoration-primary underline-offset-[12px]">
                "Gestão de elite produz resultados de elite."
              </p>
              <div className="flex flex-col sm:flex-row gap-10 justify-center items-center">
                <Button size="lg" className="h-24 px-16 text-3xl font-black rounded-[2.5rem] bg-primary hover:bg-primary/90 shadow-[0_40px_80px_-20px_rgba(79,70,229,0.5)] group overflow-hidden active:scale-95 transition-all" onClick={onLoginClick}>
                  Ativar Registro Grátis
                  <ArrowRight24Regular className="ml-5 group-hover:translate-x-4 transition-transform h-10 w-10 text-white/50" />
                </Button>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-12 pt-10 opacity-40 grayscale group hover:grayscale-0 transition-all">
                <span className="flex items-center gap-3 font-black uppercase tracking-widest text-sm"><ShieldCheckmark24Regular className="w-6 h-6" /> Data Security Protocol</span>
                <span className="flex items-center gap-3 font-black uppercase tracking-widest text-sm"><Rocket24Regular className="w-6 h-6" /> Zero Latency System</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Detailed Footer */}
      <footer className="bg-secondary/20 pt-40 pb-20 border-t border-border/50 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-primary/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2"></div>
        <div className="container mx-auto px-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24 mb-32">
            <div className="space-y-10">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-2xl shadow-xl">S</div>
                <span className="text-3xl font-black tracking-tighter">SkyPDV</span>
              </div>
              <p className="text-xl text-muted-foreground font-semibold leading-relaxed italic opacity-70">
                Liderando o futuro tecnológico em Moçambique com o talento incomparável da BlueSpark MZ Group.
              </p>
              <div className="space-y-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-4 text-primary group cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-primary/10">
                    <Call24Regular className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">Suporte / WhatsApp</span>
                    <span className="text-2xl font-black">860716912</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground group cursor-pointer hover:text-primary transition-colors">
                  <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center group-hover:border-primary transition-all">
                    <Mail24Regular className="w-6 h-6" />
                  </div>
                  <span className="text-lg font-bold">contato@bluesparkmz.com</span>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <h4 className="text-[0.6rem] font-black uppercase tracking-[0.5em] text-primary">Navegação Legal</h4>
              <nav className="flex flex-col gap-6 font-black text-lg tracking-tight uppercase tracking-[0.05em] text-muted-foreground">
                <span onClick={() => scrollTo('features')} className="hover:text-primary cursor-pointer transition-all flex items-center gap-3"><ArrowRight24Regular className="w-4 h-4 opacity-30" /> Recursos</span>
                <span onClick={() => scrollTo('pricing')} className="hover:text-primary cursor-pointer transition-all flex items-center gap-3"><ArrowRight24Regular className="w-4 h-4 opacity-30" /> Preços</span>
                <span className="hover:text-primary cursor-pointer transition-all flex items-center gap-3"><Eye24Regular className="w-4 h-4 opacity-30" /> Privacidade</span>
                <span className="hover:text-primary cursor-pointer transition-all flex items-center gap-3"><QuestionCircle24Regular className="w-4 h-4 opacity-30" /> Ajuda / FAQ</span>
              </nav>
            </div>

            <div className="space-y-10">
              <h4 className="text-[0.6rem] font-black uppercase tracking-[0.5em] text-primary">Ecosystem Hub</h4>
              <nav className="flex flex-col gap-6 font-black text-lg tracking-tight uppercase tracking-[0.05em] text-muted-foreground">
                <a href="https://bluesparkmz.com" target="_blank" className="hover:text-primary transition-all flex items-center gap-3"><Globe24Regular className="w-4 h-4 opacity-30 text-blue-500" /> BlueSpark MZ</a>
                <a href="https://skyvenda.com" target="_blank" className="hover:text-primary transition-all flex items-center gap-3"><Globe24Regular className="w-4 h-4 opacity-30 text-primary" /> SkyVenda.com</a>
                <a href="https://fastfood.skyvenda.com" target="_blank" className="hover:text-primary transition-all flex items-center gap-3"><Globe24Regular className="w-4 h-4 opacity-30 text-amber-500" /> FastFood Sky</a>
                <a href="https://smartmoz.skyvenda.com" target="_blank" className="hover:text-primary transition-all flex items-center gap-3"><Globe24Regular className="w-4 h-4 opacity-30 text-emerald-500" /> SmartMoz</a>
              </nav>
            </div>

            <div className="space-y-10">
              <h4 className="text-[0.6rem] font-black uppercase tracking-[0.5em] text-primary">Global Presence</h4>
              <div className="p-8 rounded-[40px] bg-background border-2 border-primary/20 space-y-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full translate-x-16 -translate-y-16"></div>
                <div className="flex items-center gap-4 font-black text-xl tracking-tighter">
                  <ShieldCheckmark24Regular className="text-primary w-8 h-8" />
                  Secured Data
                </div>
                <p className="text-sm font-bold text-muted-foreground leading-relaxed italic opacity-70">
                  Sua operação em total conformidade com protocolos de segurança bancária.
                </p>
                <div className="flex items-center gap-2 font-black text-[0.6rem] text-primary tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span> Live Security Status
                </div>
              </div>
            </div>
          </div>

          <div className="pt-20 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-8 font-black text-xs uppercase opacity-40 tracking-[0.3em]">
                <span>© 2026 BLUESPARK MZ Group</span>
                <span>Mozambique HQ</span>
              </div>
              <span className="text-[0.6rem] font-black opacity-20 uppercase tracking-[0.8em] text-center md:text-left">All Rights Reserved</span>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="flex items-center gap-4 px-8 py-4 rounded-[2rem] bg-primary text-white font-black shadow-2xl shadow-primary/40 transform hover:scale-110 transition-transform">
                <Building24Regular className="w-7 h-7" />
                <span className="text-lg tracking-tighter">MOZAMBIQUE TECHNOLOGY 🇲🇿</span>
              </div>
              <span className="text-[0.6rem] font-black opacity-40 uppercase tracking-[0.4em]">Designed & Engineered with ❤️ in MZ</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Global Dialog */}
      {showCookieConsent && (
        <div className="fixed bottom-10 left-10 right-10 z-[100] animate-[slide-up_0.8s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="max-w-6xl mx-auto acrylic-surface border-4 border-primary/40 p-10 rounded-[3rem] shadow-[0_50px_150px_-20px_rgba(0,0,0,0.6)] flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500"></div>
            <div className="w-24 h-24 rounded-[30px] bg-primary/10 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Eye24Regular className="text-primary w-12 h-12" />
            </div>
            <div className="flex-grow space-y-4 text-center lg:text-left">
              <h4 className="text-4xl font-black tracking-tighter uppercase whitespace-nowrap">Conexão Segura</h4>
              <p className="text-xl text-muted-foreground font-bold leading-relaxed italic opacity-80 max-w-2xl">
                Utilizamos tecnologia de cookies para garantir a máxima performance operacional e segurança dos seus dados conforme o protocolo **BlueSpark Privacy Framework**.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-5 w-full lg:w-auto">
              <Button variant="outline" className="h-16 px-10 rounded-[1.5rem] font-black border-4 text-xl hover:bg-red-500/5 transition-all" onClick={() => setShowCookieConsent(false)}>Recusar</Button>
              <Button className="h-16 px-16 rounded-[1.5rem] font-black shadow-2xl shadow-primary/40 text-xl bg-primary hover:bg-primary/90 transition-all active:scale-95" onClick={acceptCookies}>Permitir Acesso</Button>
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
        ::selection {
          background: #4f46e5;
          color: white;
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
