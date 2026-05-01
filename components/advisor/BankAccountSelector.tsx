'use client';

import { useState, useEffect } from 'react';
import { getUserBanksAccounts, type ConnectedBank, type BankAccount } from '@/lib/api';
import { Building2, CreditCard, ChevronRight, X } from 'lucide-react';

interface BankAccountSelectorProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (accountId: string) => void;
  title?: string;
}

export default function BankAccountSelector({
  userId,
  isOpen,
  onClose,
  onSelect,
  title = 'اختر الحساب'
}: BankAccountSelectorProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [banks, setBanks] = useState<ConnectedBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<ConnectedBank | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadBanks();
    }
  }, [isOpen, userId]);

  const loadBanks = async () => {
    setLoading(true);
    try {
      const data = await getUserBanksAccounts(userId);
      setBanks(data.banks);
    } catch (error) {
      console.error('Failed to load banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSelect = (bank: ConnectedBank) => {
    setSelectedBank(bank);
    setStep(2);
  };

  const handleAccountSelect = (account: BankAccount) => {
    onSelect(account.account_id);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setSelectedBank(null);
    onClose();
  };

  const handleBack = () => {
    setStep(1);
    setSelectedBank(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'hidden',
          zIndex: 9999,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {step === 2 && (
            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#64748B',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'inherit',
              }}
            >
              <ChevronRight size={18} /> رجوع
            </button>
          )}
          
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1F2937',
            flex: 1,
            textAlign: step === 1 ? 'center' : 'right',
          }}>
            {step === 1 ? 'اختر البنك' : 'اختر الحساب'}
          </h2>

          <button
            onClick={handleClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#E2E8F0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#F1F5F9'}
          >
            <X size={18} color="#64748B" />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          maxHeight: 'calc(80vh - 80px)',
          overflowY: 'auto',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
              جاري التحميل...
            </div>
          ) : step === 1 ? (
            // Step 1: Bank Selection
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {banks.map((bank) => (
                <button
                  key={bank.bank_id}
                  onClick={() => handleBankSelect(bank)}
                  style={{
                    background: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    textAlign: 'right',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00D9A5';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,217,165,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Building2 size={24} color="#00D9A5" />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#1F2937',
                        marginBottom: '4px',
                      }}>
                        {bank.bank_name_ar}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748B' }}>
                        {bank.accounts.length} حساب
                      </div>
                    </div>

                    <ChevronRight size={20} color="#94A3B8" style={{ transform: 'rotate(180deg)' }} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Step 2: Account Selection
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedBank?.accounts.map((account) => (
                <button
                  key={account.account_id}
                  onClick={() => handleAccountSelect(account)}
                  style={{
                    background: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    textAlign: 'right',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00D9A5';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,217,165,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: account.is_primary ? '#D1FAE5' : '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CreditCard size={24} color={account.is_primary ? '#059669' : '#64748B'} />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#1F2937',
                        marginBottom: '4px',
                      }}>
                        {account.account_name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>
                        {account.account_type} • {account.iban}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#00D9A5' }}>
                        {account.balance.toLocaleString()} {account.currency}
                      </div>
                    </div>

                    {account.is_primary && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        background: '#D1FAE5',
                        color: '#059669',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}>
                        أساسي
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}