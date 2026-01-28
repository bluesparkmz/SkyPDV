import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthSkyPDV() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const next = searchParams.get("next") || "/";

    if (token) {
      localStorage.setItem("skypdv_token", token);
    }

    navigate(next, { replace: true });
  }, [navigate, searchParams]);

  return null;
}
