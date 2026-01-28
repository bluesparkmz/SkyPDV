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
  Building24Regular
} from "@fluentui/react-icons";

interface LandingPageProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  const features = [
    {
      icon: Cart24Regular,
      title: "Gestão de Vendas",
      description: "Controle completo de vendas locais e delivery em tempo real"
    },
    {
      icon: FoodPizza24Regular,
      title: "Catálogo Digital Fastfood",
      description: "Menu digital integrado para restaurantes e delivery"
    },
    {
      icon: ChartMultiple24Regular,
      title: "Relatórios Avançados",
      description: "Análise detalhada de vendas, produtos e desempenho"
    },
    {
      icon: People24Regular,
      title: "Gestão de Clientes",
      description: "Cadastro e histórico completo de clientes"
    },
    {
      icon: Trophy24Regular,
      title: "Multi-Terminal",
      description: "Suporte para múltiplos pontos de venda simultâneos"
    },
    {
      icon: Building24Regular,
      title: "Parte do SkyVenda MZ",
      description: "Integrado ao ecossistema completo de gestão empresarial"
    }
  ];

  const pricingPlans = [
    {
      name: "Básico",
      price: "2.500",
      period: "mês",
      description: "Ideal para pequenos negócios",
      features: [
        "1 Terminal PDV",
        "Até 100 produtos",
        "Relatórios básicos",
        "Suporte por email",
        "Catálogo digital"
      ],
      highlighted: false
    },
    {
      name: "Profissional",
      price: "5.500",
      period: "mês",
      description: "Para negócios em crescimento",
      features: [
        "Até 5 Terminais PDV",
        "Produtos ilimitados",
        "Relatórios avançados",
        "Suporte prioritário",
        "Catálogo digital + Delivery",
        "Gestão de estoque",
        "Múltiplos usuários"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Personalizado",
      period: "",
      description: "Solução completa para grandes empresas",
      features: [
        "Terminais ilimitados",
        "Todos os recursos",
        "Suporte dedicado 24/7",
        "Customizações",
        "Integração com ERP",
        "Treinamento incluído",
        "API dedicada"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 pt-20 pb-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center backdrop-blur-sm border border-primary/20">
                <span className="text-4xl font-bold">
                  <span className="text-primary">Sky</span>
                  <span className="text-foreground">PDV</span>
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Sistema de Gestão e <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Controle de Vendas
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              SkyPDV é um sistema completo de gestão e controle de vendas que permite catálogo digital com fastfood.
              Controle vendas locais e vendas de fastfood para delivery.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-medium group"
                onClick={onLoginClick}
              >
                Começar Agora
                <ArrowRight24Regular className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg font-medium"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Planos
              </Button>
            </div>

            {/* Badge */}
            <div className="flex justify-center pt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                <Checkmark24Regular className="w-4 h-4" />
                Criado pela equipa BlueSpark MZ
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Recursos Poderosos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seu negócio de forma eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="fluent-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos e Preços
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para o seu negócio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`fluent-card relative ${plan.highlighted
                  ? 'border-primary/50 shadow-strong scale-105 md:scale-110'
                  : 'border-border/50'
                  } transition-all duration-300 hover:-translate-y-2`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      Mais Popular
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base mb-6">
                    {plan.description}
                  </CardDescription>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center gap-2">
                      {plan.price === "Personalizado" ? (
                        <span className="text-3xl font-bold">{plan.price}</span>
                      ) : (
                        <>
                          <span className="text-4xl font-bold">{plan.price}</span>
                          <span className="text-muted-foreground">MT</span>
                        </>
                      )}
                    </div>
                    {plan.period && (
                      <p className="text-sm text-muted-foreground">por {plan.period}</p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Checkmark24Regular className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-11 text-base ${plan.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : ''
                      }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={onLoginClick}
                  >
                    {plan.price === "Personalizado" ? "Contactar" : "Começar"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="acrylic-surface border-border/50 max-w-4xl mx-auto">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Pronto para começar?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Junte-se a centenas de empresas que já transformaram sua gestão de vendas com o SkyPDV
              </p>
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-medium"
                onClick={onLoginClick}
              >
                Entrar Agora
                <ArrowRight24Regular className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <span className="text-2xl font-bold">
                <span className="text-primary">Sky</span>
                <span className="text-foreground">PDV</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Sistema de Gestão e Controle de Vendas
            </p>
            <p className="text-sm text-muted-foreground">
              Subsistema da <span className="font-medium text-primary">SkyVenda MZ</span> •
              Criado pela <span className="font-medium text-foreground">BlueSpark MZ</span>
            </p>
            <p className="text-xs text-muted-foreground pt-4">
              © 2026 BlueSpark MZ. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
