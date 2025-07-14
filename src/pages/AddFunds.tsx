import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AmountInput from "../components/AmountInput";
import Button from "../components/Button";
import { useWallet } from "../context/WalletContext";
import { Card, CardContent } from "../components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../components/ui/tooltip";
import { Info } from 'lucide-react';

const AddFunds = () => {
  const [amount, setAmount] = useState("0.00");
  const [selectedMethod, setSelectedMethod] = useState("card");
  const navigate = useNavigate();
  const { addFunds } = useWallet();

  const handleAddFunds = async () => {
    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) return;

    const success = await addFunds(numericAmount, selectedMethod as "card" | "apple_pay" | "google_pay");
    if (success) {
      navigate("/home");
    }
  };

  const isAmountValid = parseFloat(amount) > 0;

  return (
    <div className="max-w-7xl mx-auto md:p-6">
      <div className="flex items-center gap-2">
        <Header title="Add Funds" showBackButton />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-5 h-5" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs p-2 text-xs">
              <div>
                You can also directly add funds to your wallet using wallet address in the settings.<br />
                <span className="text-red-600 text-muted-foreground block mt-2">
                  ⚠️ Important: Only USDC on Base is supported. Do not send or use any other token or network, doing so may result in a permanent loss of funds.
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid gap-6 md:p-0">
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="mb-8">
              <AmountInput value={amount} onChange={setAmount} />
            </div>

            <Button
              onClick={handleAddFunds}
              className={`w-full mt-6 ${!isAmountValid ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!isAmountValid}
            >
              Add Funds
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddFunds;