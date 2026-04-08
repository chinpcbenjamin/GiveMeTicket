import React, { createContext, useContext, useEffect, useState } from "react";
import { connectWallet as connectWalletFn } from "./useContract";

const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    // initialize from MetaMask or localStorage
    const init = async () => {
      try {
        if (window?.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            localStorage.setItem("connectedAccount", accounts[0]);
          } else {
            const saved = localStorage.getItem("connectedAccount");
            if (saved) setAccount(saved);
          }

          const handleAccountsChanged = (accounts) => {
            if (!accounts || accounts.length === 0) {
              setAccount(null);
              localStorage.removeItem("connectedAccount");
            } else {
              setAccount(accounts[0]);
              localStorage.setItem("connectedAccount", accounts[0]);
            }
          };

          const handleChainChanged = () => {
            // simple approach: reload on network change
            window.location.reload();
          };

          window.ethereum.on("accountsChanged", handleAccountsChanged);
          window.ethereum.on("chainChanged", handleChainChanged);

          return () => {
            try {
              window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
              window.ethereum.removeListener("chainChanged", handleChainChanged);
            } catch (e) {
              // ignore
            }
          };
        } else {
          // fallback to localStorage
          const saved = localStorage.getItem("connectedAccount");
          if (saved) setAccount(saved);
        }
      } catch (err) {
        console.error("Account init failed:", err);
      }
    };

    const cleanupPromise = init();
    return () => {
      // nothing to cleanup from init promise
      cleanupPromise && cleanupPromise.cancel && cleanupPromise.cancel();
    };
  }, []);

  const connectWallet = async () => {
    const acct = await connectWalletFn();
    if (acct) {
      setAccount(acct);
      localStorage.setItem("connectedAccount", acct);
    }
    return acct;
  };

  return (
    <AccountContext.Provider value={{ account, setAccount, connectWallet }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}

export default AccountContext;
