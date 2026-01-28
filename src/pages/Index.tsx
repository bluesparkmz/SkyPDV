import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SkyPDV } from "@/components/SkyPDV";
import { Login } from "@/components/Login";
import { LandingPage } from "@/components/LandingPage";
import { terminalApi, ApiError } from "@/services/api";
import { TerminalSetup } from "@/components/TerminalSetup";

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [setupNonce, setSetupNonce] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  const terminalQuery = useQuery({
    queryKey: ["terminal", setupNonce],
    queryFn: () => terminalApi.get(),
    enabled: isAuthenticated,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showLogin ? <Login /> : <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  const terminalNotSetup =
    terminalQuery.isError &&
    terminalQuery.error instanceof ApiError &&
    terminalQuery.error.status === 404 &&
    terminalQuery.error.message === "PDV not setup";

  if (terminalQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <FluentProvider theme={webLightTheme}>
      {terminalNotSetup ? (
        <TerminalSetup onSuccess={() => setSetupNonce((v) => v + 1)} />
      ) : (
        <SkyPDV />
      )}
    </FluentProvider>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
