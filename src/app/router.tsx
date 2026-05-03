import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./App";
import { WalletInit } from "../features/wallet/WalletInit";
import { SignGuard } from "../features/sign-guard/SignGuard";
import { VoiceCommander } from "../features/voice-commander/VoiceCommander";
import { PortfolioChat } from "../features/portfolio-brain/PortfolioChat";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <WalletInit /> },
      { path: "wallet", element: <WalletInit /> },
      { path: "sign", element: <SignGuard /> },
      { path: "voice", element: <VoiceCommander /> },
      { path: "chat", element: <PortfolioChat /> },
    ],
  },
]);
