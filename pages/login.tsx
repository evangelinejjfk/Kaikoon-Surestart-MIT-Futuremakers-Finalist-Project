import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Info } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/Tabs";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { PasswordRegisterForm } from "../components/PasswordRegisterForm";
import styles from "./login.module.css";

const LoginPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.type === "authenticated") {
      navigate("/");
    }
  }, [authState, navigate]);

  if (authState.type === "loading") {
    // Render a minimal loading state or nothing to avoid flicker
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Login | Kaikoon</title>
        <meta
          name="description"
          content="Log in or create an account to start managing your tasks with Kaikoon."
        />
      </Helmet>
      <div className={styles.pageContainer}>
        <div className={styles.loginCard}>
          <h1 className={styles.logo}>
            <Link to="/">KAIKOON</Link>
          </h1>

          <Tabs defaultValue="login" className={styles.tabsContainer}>
            <TabsList className={styles.tabsList}>
              <TabsTrigger value="login" className={styles.tabTrigger}>
                Log In
              </TabsTrigger>
              <TabsTrigger value="register" className={styles.tabTrigger}>
                Create Account
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className={styles.tabContent}>
              <PasswordLoginForm />
            </TabsContent>
            <TabsContent value="register" className={styles.tabContent}>
              <PasswordRegisterForm />
            </TabsContent>
          </Tabs>

          <div className={styles.testCredentials}>
            <Info size={20} className={styles.infoIcon} />
            <div className={styles.credentialsContent}>
              <p className={styles.credentialsTitle}>For Testing</p>
              <p className={styles.credentialsText}>
                <strong>Email:</strong> <span>test@example.com</span>
              </p>
              <p className={styles.credentialsText}>
                <strong>Password:</strong> <span>Password123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;