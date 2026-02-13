import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import AmountInput from "../../components/AmountInput";
import PhoneInput from "../../components/PhoneInput";
import Button from "../../components/Button";
import { useWallet } from "../../context/WalletContext";
import { useSmartWalletBalance } from "../../hooks/use-balance";
import { formatUnits } from "viem";
import { Plus, ArrowLeft, Send as SendIcon, User2, Loader2, AlertCircle } from "lucide-react";
import { Card } from "../../components/ui/card";
import { useAuth } from "../../context/AuthContext";
import { countries } from "../../components/CountrySelector";

interface MoneyRequest {
  id: string;
  requesterId: string;
  payerId: string;
  amountRequested: number;
  requestStatus: "PENDING" | "CANCELED" | "APPROVED" | "REJECTED";
  requestDate: Date;
  requestMessage?: string;
  requestType: "GLOBAL" | "DIRECT";
  requester: {
    name: string | null;
    phoneNumber: string;
  };
}

type Step = "amount" | "recipient" | "summary" | "error";

const Send: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId: requestIdFromParams } = useParams();
  const { user } = useAuth();
  const balanceWei = useSmartWalletBalance();
  const balance = parseFloat(formatUnits(balanceWei, 6));
  const { sendMoney, updateRequestStatus, getRequestDetails } = useWallet();

  // Get requestId from URL query params or route params
  const searchParams = new URLSearchParams(location.search);
  const requestIdFromUrl = searchParams.get('requestId');
  const requestId = requestIdFromParams || requestIdFromUrl;
  
  const navState = location.state as { recipientPhone?: string; amount?: number | string; requestId?: string } | undefined;
  const stateRequestId = navState?.requestId;

  const [step, setStep] = useState<Step>(navState && navState.recipientPhone && navState.amount ? "summary" : "amount");
  const [amount, setAmount] = useState(() => navState && navState.amount ? String(navState.amount) : "0.00");
  const [phoneNumber, setPhoneNumber] = useState(() => navState && navState.recipientPhone ? navState.recipientPhone : "");
  const [country, setCountry] = useState(
    countries.find(c => c.code === "US") || { code: "US", flag: "US", dialCode: "+1" }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<MoneyRequest | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (requestId && !user) {
      // Store the current URL in localStorage to redirect back after login
      localStorage.setItem('redirectAfterLogin', window.location.href);
      // Redirect to login page
      navigate('/login');
      return;
    }
  }, [requestId, user, navigate]);

  // Validate request if requestId is present
  useEffect(() => {
    const validateRequest = async () => {
      if (requestId && user) {
        try {
          setIsLoading(true);
          console.log("Validating request for user:", user.dbId);
          const request = await getRequestDetails(requestId);
          console.log("Received request:", request);
          
          if (!request) {
            console.error("No request found");
            setError("Invalid request link");
            setStep("error");
            return;
          }

          if (request.requestStatus !== "PENDING") {
            console.log("Request status:", request.requestStatus);
            setError("This request has already been fulfilled");
            setStep("error");
            return;
          }

          if (request.payerId && request.payerId !== user?.dbId) {
            console.log("Payer ID mismatch:", { requestPayerId: request.payerId, currentUserId: user.dbId });
            setError("This request is not meant for you");
            setStep("error");
            return;
          }

          // Prevent requester from paying their own request
          if (request.requesterId === user?.dbId) {
            setError("You can't pay your own request");
            setStep("error");
            return;
          }

          // If all validations pass, set the request details and move to summary
          setRequestDetails(request);
          setAmount(String(request.amountRequested));
          setPhoneNumber(request.requester.phoneNumber);
          setStep("summary");
        } catch (error) {
          console.error("Error validating request:", error);
          setError("Error validating request");
          setStep("error");
        } finally {
          setIsLoading(false);
        }
      }
    };

    validateRequest();
  }, [requestId, user?.dbId]);

  // If user lands here with state, ensure summary is shown and values are set
  useEffect(() => {
    if (navState && navState.recipientPhone && navState.amount) {
      setAmount(String(navState.amount));
      setPhoneNumber(navState.recipientPhone);
      setStep("summary");
    }
  }, [navState]);

  const enteredAmount = parseFloat(amount);
  const insufficientFunds = enteredAmount > balance;

  const isContinueDisabled =
    enteredAmount <= 0 ||
    insufficientFunds ||
    (step === "recipient" && phoneNumber.length < 10);

  const handleContinue = () => {
    if (step === "amount" && enteredAmount > 0 && !insufficientFunds) {
      setStep("recipient");
    } else if (step === "recipient" && phoneNumber.length >= 10) {
      setStep("summary");
    }
  };

  const handleBack = () => {
    if (step === "recipient") {
      setStep("amount");
    } else if (step === "summary") {
      setStep("recipient");
    }
  };

  const handleSend = async () => {
    try {
      setIsLoading(true);
      const success = await sendMoney(enteredAmount, phoneNumber);
      if (success) {
        // Update request status if this was initiated from a money request
        if (requestId || stateRequestId) {
          await updateRequestStatus(requestId || stateRequestId, 'APPROVED');
        }
        navigate("/home");
      }
    } catch (error) {
      console.error("Error sending money:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsLoading(true);
      if (requestId || stateRequestId) {
        await updateRequestStatus(requestId || stateRequestId, 'REJECTED');
        navigate("/home");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFunds = () => {
    navigate("/add-funds");
  };

  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
        <p className="text-muted-foreground">
          Please wait while we send ${amount} to {phoneNumber}
        </p>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case "error":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="sm" onClick={() => navigate("/home")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Error</h1>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        );

      case "amount":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="text-sm text-muted-foreground">
                Balance: ${balance.toFixed(2)}
              </div>
            </div>
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold mb-2">Send Money</h1>
              <p className="text-muted-foreground">Enter the amount to send</p>
            </div>
            <AmountInput value={amount} onChange={setAmount} />
            {insufficientFunds && (
              <p className="text-sm text-red-500">
                You only have ${balance.toFixed(2)} available.
              </p>
            )}
          </div>
        );

      case "recipient":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold mb-2">Send Money</h1>
              <p className="text-muted-foreground">Enter recipient's phone number</p>
            </div>
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="Enter phone number"
              setCountry={setCountry}
            />
          </div>
        );

      case "summary":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="text-sm font-medium">Transaction Summary</div>
            </div>

            <Card className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Sending</p>
                  <div className="text-4xl font-bold mb-1">${amount}</div>
                  <p className="text-sm text-muted-foreground">
                    Available balance: ${balance.toFixed(2)}
                  </p>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">To</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {phoneNumber}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mobile Number
                      </div>
                    </div>
                  </div>
                </div>

                {requestDetails?.requestMessage && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Message</p>
                      <p className="text-sm">{requestDetails.requestMessage}</p>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree that this transaction cannot be reversed
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {isLoading && <LoadingOverlay />}
      <div>{renderStep()}</div>
      <div className="py-4">
        {step === "summary" ? (
          requestId || stateRequestId ? (
            <div className="flex gap-3">
              <Button
                onClick={handleReject}
                variant="outline"
                className="flex-1"
                size="lg"
                disabled={isLoading}
              >
                Reject
              </Button>
              {insufficientFunds ? (
                <Button
                  onClick={handleAddFunds}
                  className="flex-1 bg-primary"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add funds
                </Button>
              ) : (
                <Button 
                  onClick={handleSend} 
                  className="flex-1" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <SendIcon className="mr-2 h-5 w-5" />
                  )}
                  {isLoading ? "Processing..." : "Accept & Pay"}
                </Button>
              )}
            </div>
          ) : (
            insufficientFunds ? (
              <Button
                onClick={handleAddFunds}
                className="w-full bg-primary"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add funds
              </Button>
            ) : (
              <Button 
                onClick={handleSend} 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <SendIcon className="mr-2 h-5 w-5" />
                )}
                {isLoading ? "Processing..." : "Send Money"}
              </Button>
            )
          )
        ) : (
          <Button
            onClick={handleContinue}
            size="lg"
            disabled={isContinueDisabled}
            className={`w-full transition-opacity duration-150 ${
              isContinueDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
};

export default Send;