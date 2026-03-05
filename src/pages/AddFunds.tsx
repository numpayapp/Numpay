import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import Header from "../components/Header";
import AmountInput from "../components/AmountInput";
import Button from "../components/Button";
import { Card, CardContent } from "../components/ui/card";
import { useAuth } from "../context/AuthContext";
import { showError, showSuccess } from "../lib/utils";
import { Loader, Wallet, LogOut } from "lucide-react";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

const AddFunds = () => {
    const [amount, setAmount] = useState("0.00");
    const [loading, setLoading] = useState(false);
    const [walletUsdcBalance, setWalletUsdcBalance] = useState<number | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { connection } = useConnection();
    const { publicKey, sendTransaction, disconnect, connected } = useWallet();
    const { setVisible } = useWalletModal();

    // Fetch connected wallet's USDC balance whenever wallet connects/changes
    useEffect(() => {
        if (!publicKey || !connected) { setWalletUsdcBalance(null); return; }
        setBalanceLoading(true);
        (async () => {
            try {
                const ata = await getAssociatedTokenAddress(USDC_MINT, publicKey);
                const ataInfo = await connection.getAccountInfo(ata);
                if (!ataInfo) { setWalletUsdcBalance(0); return; }
                const tokenBalance = await connection.getTokenAccountBalance(ata);
                setWalletUsdcBalance(tokenBalance.value.uiAmount ?? 0);
            } catch {
                setWalletUsdcBalance(0);
            } finally {
                setBalanceLoading(false);
            }
        })();
    }, [publicKey, connected, connection]);

    const truncate = (addr: string) =>
        `${addr.slice(0, 4)}...${addr.slice(-4)}`;

    const handleDeposit = async () => {
        if (!publicKey || !sendTransaction || !user?.wallet?.address) return;
        if (!canDeposit) return;

        setLoading(true);
        try {
            const numpayPubkey = new PublicKey(user.wallet.address);
            const senderAta = await getAssociatedTokenAddress(USDC_MINT, publicKey);
            const recipientAta = await getAssociatedTokenAddress(USDC_MINT, numpayPubkey);

            const { blockhash } = await connection.getLatestBlockhash("finalized");
            const tx = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey });

            // Create recipient ATA if it doesn't exist (sender pays ~0.002 SOL once)
            const recipientAtaInfo = await connection.getAccountInfo(recipientAta);
            if (!recipientAtaInfo) {
                tx.add(
                    createAssociatedTokenAccountInstruction(
                        publicKey,
                        recipientAta,
                        numpayPubkey,
                        USDC_MINT,
                        TOKEN_PROGRAM_ID,
                        ASSOCIATED_TOKEN_PROGRAM_ID
                    )
                );
            }

            const amountRaw = BigInt(Math.round(numericAmount * 1_000_000));
            tx.add(
                createTransferInstruction(
                    senderAta,
                    recipientAta,
                    publicKey,
                    amountRaw,
                    [],
                    TOKEN_PROGRAM_ID
                )
            );

            // Wallet adapter: signs in user's wallet app (MWA on Android, extension on desktop)
            const txhash = await sendTransaction(tx, connection);
            await connection.confirmTransaction(txhash, "confirmed");

            showSuccess("Deposit successful", `$${numericAmount.toFixed(2)} USDC added to your NumPay wallet`);
            navigate("/home");
        } catch (err: any) {
            showError("Deposit failed", err?.message || "Transaction was rejected or failed");
        } finally {
            setLoading(false);
        }
    };

    const numericAmount = parseFloat(amount);
    const isAmountValid = numericAmount > 0;
    const isInsufficientBalance = walletUsdcBalance !== null && numericAmount > walletUsdcBalance;
    const canDeposit = isAmountValid && connected && !loading && !isInsufficientBalance;

    return (
        <div className="max-w-7xl mx-auto md:p-6">
            <Header title="Add Funds" showBackButton />

            <div className="grid gap-4">
                {/* Wallet connection card */}
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        {connected && publicKey ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <Wallet className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Connected wallet</p>
                                        <p className="text-sm font-mono font-medium">{truncate(publicKey.toBase58())}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Balance:{" "}
                                            {balanceLoading ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <Loader className="animate-spin w-3 h-3" /> loading…
                                                </span>
                                            ) : walletUsdcBalance !== null ? (
                                                <span className={isInsufficientBalance ? "text-destructive font-medium" : "text-foreground font-medium"}>
                                                    ${walletUsdcBalance.toFixed(2)} USDC
                                                </span>
                                            ) : "—"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => disconnect()}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <LogOut className="w-3 h-3" />
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setVisible(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                            >
                                <Wallet className="w-5 h-5" />
                                <span className="font-medium">Connect Wallet</span>
                            </button>
                        )}
                    </CardContent>
                </Card>

                {/* Amount + deposit */}
                <Card className="bg-card border-border">
                    <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground mb-4 px-1">
                            USDC will be transferred from your connected wallet to your NumPay wallet.
                        </p>
                        <div className="mb-8">
                            <AmountInput value={amount} onChange={setAmount} />
                        </div>

                        {isInsufficientBalance && (
                            <p className="text-xs text-destructive mb-2 px-1">
                                Insufficient balance. Your wallet only has ${walletUsdcBalance?.toFixed(2)} USDC.
                            </p>
                        )}
                        <Button
                            onClick={handleDeposit}
                            className={`w-full mt-2 ${!canDeposit ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={!canDeposit}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader className="animate-spin w-4 h-4" />
                                    Confirming…
                                </span>
                            ) : !connected ? (
                                "Connect wallet first"
                            ) : isInsufficientBalance ? (
                                "Insufficient balance"
                            ) : (
                                `Deposit $${numericAmount.toFixed(2)} USDC`
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AddFunds;
