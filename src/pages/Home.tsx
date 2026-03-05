import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useWallet } from "../context/WalletContext";
import { formatNumber } from "../lib/utils";
import {
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  History,
  Plus,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Upload,
  Clock,
  Loader,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useSolanaBalance } from "../hooks/use-balance";
import { format } from "date-fns";
import { useTransactions } from "../hooks/use-transactions";
import { Transaction } from "../hooks/use-transactions";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { balance } = useSolanaBalance();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const { transactions, isLoading } = useTransactions(3);
  const { user } = useAuth();

  const toggleBalance = () => setShowBalance(!showBalance);

  // Helper function to get transaction icon
  const getTransactionIcon = (tx: Transaction) => {
    const isSender = tx.sender?.id === user?.dbId;
    const isReceiver = tx.receiver?.id === user?.dbId;

    if (tx.transactionType === 'deposit') {
      return <Download className="text-blue-500" size={20} />;
    }
    if (tx.transactionType === 'withdrawal') {
      return <Upload className="text-orange-500" size={20} />;
    }
    
    // For send/receive transactions
    if ((tx.transactionType === 'send' && isSender) || (tx.transactionType === 'receive' && isSender)) {
      return <ArrowUpRight className="text-red-500" size={20} />;
    }
    if ((tx.transactionType === 'send' && isReceiver) || (tx.transactionType === 'receive' && isReceiver)) {
      return <ArrowDownLeft className="text-green-500" size={20} />;
    }
    
    return <Clock className="text-gray-500" size={20} />;
  };

  // Helper function to get transaction color
  const getTransactionColor = (tx: Transaction) => {
    const isSender = tx.sender?.id === user?.dbId;
    const isReceiver = tx.receiver?.id === user?.dbId;

    if (tx.transactionType === 'deposit') {
      return 'bg-blue-100';
    }
    if (tx.transactionType === 'withdrawal') {
      return 'bg-orange-100';
    }
    
    // For send/receive transactions
    if ((tx.transactionType === 'send' && isSender) || (tx.transactionType === 'receive' && isSender)) {
      return 'bg-red-100';
    }
    if ((tx.transactionType === 'send' && isReceiver) || (tx.transactionType === 'receive' && isReceiver)) {
      return 'bg-green-100';
    }
    
    return 'bg-gray-100';
  };

  // Helper function to get transaction text
  const getTransactionText = (tx: Transaction) => {
    const isSender = tx.sender?.id === user?.dbId;
    const isReceiver = tx.receiver?.id === user?.dbId;

    switch(tx.transactionType) {
      case 'send':
        if (isSender) {
          return 'Sent to ' + (tx.receiver?.name || formatPhoneNumber(tx.receiver?.phoneNumber || ''));
        } else if (isReceiver) {
          return 'Received from ' + (tx.sender?.name || formatPhoneNumber(tx.sender?.phoneNumber || ''));
        }
        return 'Transaction';
      case 'receive':
        if (isReceiver) {
          return 'Received from ' + (tx.sender?.name || formatPhoneNumber(tx.sender?.phoneNumber || ''));
        } else if (isSender) {
          return 'Sent to ' + (tx.receiver?.name || formatPhoneNumber(tx.receiver?.phoneNumber || ''));
        }
        return 'Transaction';
      case 'deposit':
        return 'Deposit to wallet';
      case 'withdrawal':
        return 'Withdrawal from wallet';
      default:
        return 'Transaction';
    }
  };

  // Helper function to format phone number
  const formatPhoneNumber = (phoneNumber: string) => {
    return phoneNumber;
  };

  // Helper function to format the amount with sign
  const formatAmount = (tx: Transaction) => {
    const prefix = (tx.transactionType === 'send' || tx.transactionType === 'withdrawal') ? '- ' : '+ ';
    return `${prefix}${tx.amount.toFixed(2)} $`;
  };

  // Helper function to format date
  const formatDate = (date: Date) => {
    return format(date, 'MMM d, yyyy • h:mm a');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const getAmountStyle = (tx: Transaction) => {
    const isSender = tx.sender?.id === user?.dbId;
    const isReceiver = tx.receiver?.id === user?.dbId;

    if (tx.transactionType === 'deposit') {
      return 'text-green-500';
    }
    if (tx.transactionType === 'withdrawal') {
      return 'text-red-500';
    }
    
    // For send/receive transactions
    if ((tx.transactionType === 'send' && isSender) || (tx.transactionType === 'receive' && isSender)) {
      return 'text-red-500';
    }
    if ((tx.transactionType === 'send' && isReceiver) || (tx.transactionType === 'receive' && isReceiver)) {
      return 'text-green-500';
    }
    
    return 'text-gray-500';
  };

  return (
    <>
      <motion.div
        className="max-w-7xl mx-auto md:p-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid md:grid-cols-12 gap-6">
          <motion.div variants={itemVariants} className="md:col-span-8">
            <Card className="bg-card border-border mb-6 h-full">
              <CardContent className="p-6 md:p-8 h-full">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between h-full">
                  <div className="relative">
                    <div className="flex items-center justify-between w-full gap-10">
                      <p className="text-muted-foreground text-sm mb-1">
                        Your Balance
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0"
                        onClick={toggleBalance}
                      >
                        {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{ scale: showBalance ? 1 : 0.98 }}
                      className="relative"
                    >
                      <h2 className="text-5xl font-bold mb-1">
                        {showBalance ? formatNumber(Number(balance)) : "••••••"}
                      </h2>
                    </motion.div>
                  </div>

                  <div className="flex gap-3 mt-6 md:mt-0">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/add-funds">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Money
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/activity")}
                    >
                      <History className="h-4 w-4 mr-1" />
                      History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* <motion.div variants={itemVariants} className="md:col-span-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Monthly Spending
                  </span>
                  <span className="font-medium">$245.00</span>
                </div>
                <motion.div
                  className="w-full bg-muted h-1 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  <motion.div
                    className="bg-primary h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  ></motion.div>
                </motion.div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Savings Goal
                  </span>
                  <span className="font-medium">$1,200.00</span>
                </div>
                <motion.div
                  className="w-full bg-muted h-1 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <motion.div
                    className="bg-primary h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "25%" }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                  ></motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div> */}

          <motion.div
            variants={itemVariants}
            className="md:col-span-4 flex flex-col h-full"
          >
            <div className="flex gap-3 h-full">
              <motion.button
                onClick={() => navigate("/send")}
                className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">Send</span>
                <div className="absolute inset-0 border border-transparent group-hover:border-primary/20 rounded-xl transition-all"></div>
              </motion.button>

              <motion.button
                onClick={() => navigate("/request")}
                className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">Request</span>
                <div className="absolute inset-0 border border-transparent group-hover:border-primary/20 rounded-xl transition-all"></div>
              </motion.button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-12">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Recent Activity</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/activity")}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin text-primary" size={24} />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent transactions
                </div>
              ) : (
                transactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${getTransactionColor(tx)} flex items-center justify-center`}>
                              {getTransactionIcon(tx)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {getTransactionText(tx)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(tx.timestamp)}
                              </p>
                            </div>
                          </div>
                          <p className={`font-medium ${getAmountStyle(tx)}`}>
                            {formatAmount(tx)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        <Button
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full md:hidden"
          size="icon"
          onClick={() => navigate("/send")}
        >
          <Send className="h-6 w-6" />
        </Button>
      </motion.div>
    </>
  );
}