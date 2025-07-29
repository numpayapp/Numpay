import React, { useState } from 'react';
import { Clock, ArrowUpRight, ArrowDownLeft, Download, Upload, Loader, X, Check, AlertCircle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../hooks/use-transactions';
import { Transaction } from '../hooks/use-transactions';
import { useWallet } from '../context/WalletContext';
import { Button } from '../components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import { useNavigate } from 'react-router-dom';

interface MoneyRequest {
  id: string;
  requesterId: string;
  payerId: string;
  amountRequested: number;
  requestStatus: "PENDING" | "CANCELLED" | "APPROVED" | "REJECTED";
  requestDate: Date | string;
  requestMessage?: string;
  requestType: "GLOBAL" | "DIRECT";
  requester: {
    name: string | null;
    phoneNumber: string;
  };
  requestFrom?: {
    name: string | null;
    phoneNumber: string;
  };
}

const Activity: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'activity' | 'requests'>('activity');
  const { transactions, isLoading } = useTransactions();
  const { moneyRequests, cancelRequest, updateRequestStatus } = useWallet();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  const getDisplayInfo = (user: { name: string | null, phoneNumber: string }) => {
    return user.name || formatPhoneNumber(user.phoneNumber);
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    return phoneNumber;
  };

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

  const getTransactionText = (tx: Transaction) => {
    const isSender = tx.sender?.id === user?.dbId;
    const isReceiver = tx.receiver?.id === user?.dbId;

    switch(tx.transactionType) {
      case 'send':
        if (isSender) {
          return 'Sent to ' + (tx.receiver ? getDisplayInfo(tx.receiver) : 'Unknown');
        } else if (isReceiver) {
          return 'Received from ' + (tx.sender ? getDisplayInfo(tx.sender) : 'Unknown');
        }
        return 'Transaction';
      case 'receive':
        if (isReceiver) {
          return 'Received from ' + (tx.sender ? getDisplayInfo(tx.sender) : 'Unknown');
        } else if (isSender) {
          return 'Sent to ' + (tx.receiver ? getDisplayInfo(tx.receiver) : 'Unknown');
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

  const formatAmount = (tx: Transaction) => {
    const prefix = (tx.transactionType === 'send' || tx.transactionType === 'withdrawal') ? '- ' : '+ ';
    return `${prefix}${tx.amount.toFixed(2)} $`;
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'Invalid date';
    
    try {
      let dateObj: Date;
      
      if (typeof date === 'string') {
        // Try parsing ISO string first
        dateObj = parseISO(date);
        // If invalid, try parsing as regular date string
        if (!isValid(dateObj)) {
          dateObj = new Date(date);
        }
      } else {
        dateObj = date;
      }

      if (!isValid(dateObj)) {
        console.error('Invalid date:', date);
        return 'Invalid date';
      }

      return format(dateObj, 'MMM d, yyyy • h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error, 'Date value:', date);
      return 'Invalid date';
    }
  };

  const getRequestIcon = (status: string) => {
    switch(status) {
      case 'PENDING':
        return <Clock className="text-yellow-500" size={20} />;
      case 'COMPLETED':
        return <Check className="text-green-500" size={20} />;
      case 'CANCELLED':
        return <X className="text-red-500" size={20} />;
      case 'REJECTED':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getRequestColor = (status: string) => {
    switch(status) {
      case 'PENDING':
        return 'bg-yellow-100';
      case 'COMPLETED':
        return 'bg-green-100';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const handleRequestAction = async (requestId: string, action: 'APPROVE' | 'REJECT' | 'CANCEL') => {
    if (action === 'CANCEL') {
      await cancelRequest(requestId);
    } else {
      await updateRequestStatus(requestId, action === 'APPROVE' ? 'APPROVED' : 'REJECTED');
    }
  };

  const getPaginatedItems = () => {
    if (activeTab === 'activity') {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return transactions.slice(startIndex, endIndex);
    } else {
      // Sort requests by date in descending order (latest first)
      const sortedRequests = [...moneyRequests].sort((a, b) => {
        const dateA = new Date(a.requestDate).getTime();
        const dateB = new Date(b.requestDate).getTime();
        return dateB - dateA;
      });
      
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return sortedRequests.slice(startIndex, endIndex);
    }
  };

  const getTotalPages = () => {
    const items = activeTab === 'activity' ? transactions : moneyRequests;
    return Math.ceil(items.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const totalPages = getTotalPages();
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        pages.push(
          <PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {pages}
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderRequestActions = (request: MoneyRequest) => {
    if (request.requestStatus !== 'PENDING') return null;

    const isRequester = request.requesterId === user?.dbId;
    const isPayer = request.payerId === user?.dbId;

    if (isRequester) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-red-500 hover:text-red-600"
          onClick={() => handleRequestAction(request.id, 'CANCEL')}
        >
          Cancel Request
        </Button>
      );
    }
    if (isPayer) {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-green-500 hover:text-green-600"
            onClick={() => {
              navigate('/send', {
                state: {
                  recipientPhone: request.requester.phoneNumber,
                  amount: request.amountRequested,
                  requestId: request.id
                }
              });
            }}
          >
            Pay
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={() => handleRequestAction(request.id, 'REJECT')}
          >
            Reject
          </Button>
        </div>
      );
    }

    return null;
  };

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Loader className="text-blue-500 animate-spin" size={24} />
      </div>
      <h3 className="text-xl font-medium mb-2">Loading transactions</h3>
      <p className="text-gray-500">Please wait while we fetch your activity data...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Activity</h1>
      <div className="tabs flex border-b mb-4">
        <button
          className={`flex-1 py-4 text-center font-medium ${
            activeTab === 'activity' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
          onClick={() => {
            setActiveTab('activity');
            setCurrentPage(1);
          }}
        >
          Activity
        </button>
        <button
          className={`flex-1 py-4 text-center font-medium ${
            activeTab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
          onClick={() => {
            setActiveTab('requests');
            setCurrentPage(1);
          }}
        >
          Requests
        </button>
      </div>

      <div className="flex-1 px-4">
        {isLoading ? (
          <LoadingState />
        ) : activeTab === 'activity' ? (
          transactions.length === 0 ? (
            <EmptyState
              message="No activity yet"
              description="When there is a new transaction, it will show up here."
            />
          ) : (
            <>
              <div className="space-y-4">
                {getPaginatedItems().map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 border rounded-lg bg-white flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full ${getTransactionColor(tx)} flex items-center justify-center mr-3`}
                        >
                          {getTransactionIcon(tx)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {getTransactionText(tx)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(tx.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className={`font-medium ${getAmountStyle(tx)}`}>
                        {formatAmount(tx)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                      <div>
                        Status: <span className="capitalize">{tx.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {renderPagination()}
            </>
          )
        ) : moneyRequests.length === 0 ? (
          <EmptyState
            message="No requests yet"
            description="Money requests that you've sent or received will appear here."
          />
        ) : (
          <>
            <div className="space-y-4">
              {getPaginatedItems().map((request) => (
                <div
                  key={request.id}
                  className="p-4 border rounded-lg bg-white flex flex-col"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full ${getRequestColor(request.requestStatus)} flex items-center justify-center mr-3`}
                      >
                        {getRequestIcon(request.requestStatus)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {request.requestType === 'GLOBAL' ? 'Global Request' : 'Direct Request'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(request.requestDate)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          <span>From: {request.requesterId === user?.dbId ? 'You' : (request.requester?.name || 'Unknown') + ' - ' + (request.requester?.phoneNumber || 'N/A')}</span>
                          <span className="mx-2">|</span>
                          <span>To: {request.payerId === user?.dbId ? 'You' : (request.requestFrom?.name || 'Unknown') + ' - ' + (request.requestFrom?.phoneNumber || 'N/A')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-medium text-blue-600">
                      {typeof request.amountRequested === "number" && !isNaN(request.amountRequested)
                        ? `$${request.amountRequested.toFixed(2)}`
                        : "$0.00"}
                    </div>
                  </div>
                  {request.requestMessage && (
                    <div className="text-sm text-gray-600 mb-3">
                      {request.requestMessage}
                    </div>
                  )}
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Status: <span className="capitalize">
                        {typeof request.requestStatus === "string"
                          ? request.requestStatus.toLowerCase()
                          : "pending"}
                      </span>
                    </div>
                    {renderRequestActions(request as MoneyRequest)}
                  </div>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string; description: string }> = ({ message, description }) => (
  <div className="flex flex-col items-center justify-center h-full text-center py-20">
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <Clock className="text-gray-500" size={24} />
    </div>
    <h3 className="text-xl font-medium mb-2">{message}</h3>
    <p className="text-gray-500 max-w-xs">{description}</p>
  </div>
);

export default Activity;