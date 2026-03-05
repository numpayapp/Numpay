import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import Layout from "./components/Layout";
import { PrivyProvider } from '@privy-io/react-auth';
import { AuthProvider } from "./context/AuthContext";
import { WalletProvider } from "./context/WalletContext";
import { SolanaWalletProvider } from "./context/SolanaWalletProvider";

// Pages
import Activity from "./pages/Activity";
import AddFunds from "./pages/AddFunds";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import QRCode from "./pages/QRCode";
import RequestMoney from "./pages/RequestMoney/RequestMoney";
import Send from "./pages/SendMoney/Send";

import Settings from "./pages/Settings/settings";
// Settings Sub-pages
import PaymentMethods from "./pages/Settings/account/payment-methods";
import PersonalInformation from "./pages/Settings/account/personal-information";
import Notifications from "./pages/Settings/security/notifications";
import SecuritySettings from "./pages/Settings/security/security-settings";
import HelpCenter from "./pages/Settings/support/help-center";

const queryClient = new QueryClient();
const PRIVY_APP_ID = import.meta.env.VITE_APP_PRIVY_APP_ID;
const PRIVY_CLIENT_ID = import.meta.env.VITE_APP_PRIVY_CLIENT_ID;

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: "home",
        element: <Home />,
      },
      {
        path: "send",
        element: <Send />,
      },
      {
        path: "send/:requestId",
        element: <Send />,
      },
      {
        path: "request",
        element: <RequestMoney />,
      },
      {
        path: "add-funds",
        element: <AddFunds />,
      },
      {
        path: "activity",
        element: <Activity />,
      },
      {
        path: "qr",
        element: <QRCode />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      // Settings sub-routes
      {
        path: "settings/account/personal-information",
        element: <PersonalInformation />,
      },
      {
        path: "settings/account/payment-methods",
        element: <PaymentMethods />,
      },
      {
        path: "settings/security/security-settings",
        element: <SecuritySettings />,
      },
      {
        path: "settings/security/notifications",
        element: <Notifications />,
      },
      {
        path: "settings/support/help-center",
        element: <HelpCenter />,
      },
    ],
  },
  {
    path: "login",
    element: <Login />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        clientId={PRIVY_CLIENT_ID}
        config={{
          loginMethods: ['sms'],
          embeddedWallets: {
            showWalletUIs: false,
            createOnLogin: 'off'
          }
        }}
      >
        <AuthProvider>
          <SolanaWalletProvider>
            <WalletProvider>
              <Toaster />
              <RouterProvider router={router} />
            </WalletProvider>
          </SolanaWalletProvider>
        </AuthProvider>
      </PrivyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
