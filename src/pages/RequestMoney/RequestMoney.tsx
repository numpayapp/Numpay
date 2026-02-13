import React, { useState } from "react";
import { Share2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../context/WalletContext";
import { showSuccess, showError } from "../../lib/utils";
import { countries } from "../../components/CountrySelector";

import Header from "../../components/Header";
import AmountInput from "../../components/AmountInput";
import PhoneInput from "../../components/PhoneInput";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

type RequestStep = "amount" | "recipient" | "summary" | "share";
type RequestType = "anyone" | "specific";

const RequestMoney: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<RequestStep>("amount");
  const [amount, setAmount] = useState("0.00");
  const [requestType, setRequestType] = useState<RequestType>("specific");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState(
    countries.find(c => c.code === "US") || { code: "US", flag: "US", dialCode: "+1" }
  );
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const navigate = useNavigate();
  const { requestMoney } = useWallet();

  const handleContinue = () => {
    switch (currentStep) {
      case "amount":
        if (parseFloat(amount) > 0) {
          setCurrentStep("recipient");
        }
        break;
      case "recipient":
        if (
          requestType === "anyone" ||
          (requestType === "specific" && phoneNumber.length >= 10)
        ) {
          setCurrentStep("summary");
        }
        break;
      case "summary":
        handleSendRequest();
        break;
    }
  };

  const handleSendRequest = async () => {
    try {
      setIsLoading(true);
      const result = await requestMoney(
        parseFloat(amount),
        phoneNumber,
        requestType === "anyone" ? "GLOBAL" : "DIRECT",
        message
      );
      if (result.success) {
        if (requestType === "anyone") {
          setRequestId(result.requestId);
          setCurrentStep("share");
        } else {
          navigate("/home");
        }
      }
    } catch (error) {
      console.error("Error requesting money:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickShare = async () => {
    if (parseFloat(amount) <= 0 || phoneNumber.length < 10) return;
    try {
      setIsLoading(true);
      const result = await requestMoney(
        parseFloat(amount),
        phoneNumber,
        "DIRECT",
        message
      );
      if (result.success && result.requestId) {
        const requestLink = `${window.location.origin}/send?requestId=${result.requestId}`;
        setGeneratedLink(requestLink);
      }
    } catch (error) {
      console.error("Error creating request link:", error);
      showError("Failed to generate link", "Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = generatedLink;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    showSuccess("Link copied!", "Payment request link has been copied to clipboard");
  };

  const handleShare = async () => {
    if (!requestId) return;
    const requestLink = `${window.location.origin}/send?requestId=${requestId}`;
    try {
      await navigator.clipboard.writeText(requestLink);
      showSuccess(
        "Link copied!",
        "Payment request link has been copied to clipboard"
      );
    } catch {
      // Fallback for browsers/contexts where clipboard API is blocked
      const textArea = document.createElement("textarea");
      textArea.value = requestLink;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showSuccess(
        "Link copied!",
        "Payment request link has been copied to clipboard"
      );
    }
  };

  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Processing Request</h3>
        <p className="text-muted-foreground">
          Please wait while we send a request for ${amount} 
          {requestType === "specific" ? ` to ${phoneNumber}` : ""}
        </p>
      </div>
    </div>
  );

  const renderAmountStep = () => (
    <>
      <div className="flex-1 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Enter Amount</h2>
          <p className="text-muted-foreground">
            How much would you like to request?
          </p>
        </div>

        <Card className="p-6">
          <AmountInput value={amount} onChange={setAmount} />
        </Card>
      </div>

      <Button
        onClick={handleContinue}
        className="w-full"
        disabled={parseFloat(amount) <= 0}
      >
        Continue
      </Button>
    </>
  );

  const renderRecipientStep = () => (
    <>
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Who are you requesting from?
          </h2>
          <p className="text-muted-foreground">
            Choose how you want to share your request
          </p>
        </div>

        <Card
          className={`p-4 cursor-pointer ${
            requestType === "anyone" ? "border-primary" : ""
          }`}
          onClick={() => setRequestType("anyone")}
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Share2 className="text-primary" size={20} />
            </div>
            <div>
              <div className="font-medium">From anyone</div>
              <div className="text-sm text-muted-foreground">
                Generate a payment link
              </div>
            </div>
          </div>
        </Card>

        <div>
          <div className="text-sm font-medium mb-2">From a specific number</div>
          <Card
            className={`p-4 ${
              requestType === "specific" ? "border-primary" : ""
            }`}
            onClick={() => setRequestType("specific")}
          >
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="Enter phone number"
              setCountry={setCountry}
            />
          </Card>
        </div>
      </div>

      <Button
        onClick={handleContinue}
        className="w-full"
        disabled={requestType === "specific" && phoneNumber.length < 10}
      >
        Continue
      </Button>
    </>
  );

  const renderSummaryStep = () => (
    <>
      <div className="flex-1 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Review Request</h2>
          <div className="text-5xl font-bold my-8">${amount}</div>
        </div>

        <Card className="p-4">
          <div className="space-y-4">
            {requestType === "specific" && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Requesting from
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <img
                      src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
                      alt={country.code}
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{country.code}</div>
                    <div className="text-muted-foreground">{phoneNumber}</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Add a message (optional)
              </div>
              <textarea
                className="w-full p-2 border rounded-md"
                placeholder="What's this request for?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </Card>
      </div>

      <Button 
        onClick={handleContinue} 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : requestType === "anyone" ? (
          <Share2 size={18} className="mr-2" />
        ) : null}
        {isLoading 
          ? "Processing..." 
          : requestType === "specific" 
            ? "Send Request" 
            : "Share request link"
        }
      </Button>
    </>
  );

  const renderShareStep = () => (
    <>
      <div className="flex-1 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Share Payment Request</h2>
          <div className="text-5xl font-bold my-8">${amount}</div>
        </div>

        <Card className="aspect-square flex items-center justify-center">
          <div className="w-3/4 h-3/4 bg-contain bg-center bg-no-repeat"></div>
        </Card>
      </div>

      <Button onClick={handleShare} className="w-full">
        <Share2 size={18} className="mr-2" />
        Share request link
      </Button>
    </>
  );

  const renderStep = () => {
    switch (currentStep) {
      case "amount":
        return renderAmountStep();
      case "recipient":
        return renderRecipientStep();
      case "summary":
        return renderSummaryStep();
      case "share":
        return renderShareStep();
    }
  };

  return (
    <div className="max-w-md mx-auto py-6">
      {isLoading && <LoadingOverlay />}
      <div className="space-y-6">
        <Header
          title="Request Money"
          showBackButton
          onBack={() =>
            currentStep === "amount"
              ? navigate(-1)
              : setCurrentStep((prev) => {
                  if (prev === "recipient") return "amount";
                  if (prev === "summary") return "recipient";
                  if (prev === "share") return "summary";
                  return "amount";
                })
          }
        />

        <div className="space-y-8">{renderStep()}</div>
        {currentStep === "summary" && !generatedLink && (
          <p
            className="text-center py-3 hover:underline cursor-pointer underline-offset-4"
            onClick={handleQuickShare}
          >
            Request using Link
          </p>
        )}
        {generatedLink && (
          <Card className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">Your request link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 bg-muted text-sm p-2 rounded-md border truncate"
              />
              <Button size="sm" onClick={handleCopyLink}>
                Copy
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RequestMoney;