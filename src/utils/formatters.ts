import { Transaction, Account, BusinessProfile, Language } from '../types';

export function formatCurrency(amount: number, symbol: string = '₹'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Indian numbering system formatting
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(absAmount);
  
  return `${isNegative ? '-' : ''}${symbol} ${formatted}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD -> DD/MM/YYYY
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return dateString;
}

export function formatTime(timeString?: string): string {
  if (!timeString) return '';
  return timeString;
}

export function getAccountBalance(accountId: string, transactions: Transaction[]): number {
  // Positive = You will receive (Credit balance / Lena hai)
  // Negative = You will give (Debit balance / Dena hai)
  // In personal khata accounting:
  // When you gave money/goods (Debit/Paid) -> Party owes you -> Balance increases (+)
  // When you received money/goods (Credit/Received) -> Party owed less -> Balance decreases (-)
  // Let's ensure intuitive khata semantics:
  // For party ledger:
  // "Credit (पैसे मिले)" = Received from party (+ to your cash, - to party's debt)
  // "Debit (पैसे दिए)" = Given to party (+ to party's debt / Lena hai)
  // Or in traditional GAS script provided by user:
  // Credit = पैसे मिले (+), Debit = पैसे दिए (-)
  // Let's standardise clearly:
  // Total Credit for this account = Total money received from party
  // Total Debit for this account = Total money given to party
  // Net: Debit - Credit = Money they owe you (You'll get / लेने हैं). If negative, you owe them (You'll give / देने हैं).
  const txns = transactions.filter(t => t.accountId === accountId);
  const totalGiven = txns.filter(t => t.type === 'debit').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalReceived = txns.filter(t => t.type === 'credit').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  
  return totalGiven - totalReceived;
}

export interface CalculatedTransaction extends Transaction {
  runningBalance: number;
  balanceType: 'get' | 'give' | 'settled';
  balanceText: string;
}

export function calculateRunningBalances(
  transactions: Transaction[], 
  lang: Language = 'hi', 
  currencySymbol: string = '₹'
): CalculatedTransaction[] {
  // Sort chronologically ascending for running balance computation
  const sorted = [...transactions].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  let balance = 0; // Positive = Party owes us (Lena hai), Negative = We owe party (Dena hai)

  const calculated: CalculatedTransaction[] = sorted.map((t) => {
    if (t.type === 'debit') {
      // Given to party -> Debt increases
      balance += Number(t.amount || 0);
    } else {
      // Received from party -> Debt decreases
      balance -= Number(t.amount || 0);
    }

    let balanceType: 'get' | 'give' | 'settled' = 'settled';
    let balanceText = lang === 'hi' ? 'चुकता ₹0' : 'Settled ₹0';

    if (balance > 0) {
      balanceType = 'get';
      balanceText = `${formatCurrency(balance, currencySymbol)} ${lang === 'hi' ? '(लेने हैं / CR)' : '(To Get)'}`;
    } else if (balance < 0) {
      balanceType = 'give';
      balanceText = `${formatCurrency(Math.abs(balance), currencySymbol)} ${lang === 'hi' ? '(देने हैं / DR)' : '(To Give)'}`;
    }

    return {
      ...t,
      runningBalance: balance,
      balanceType,
      balanceText,
    };
  });

  // Return in descending order (newest first) for viewing, or maintain order
  return calculated;
}

export function generateWhatsAppReminder(
  account: Account, 
  balance: number, 
  profile: BusinessProfile,
  lang: Language = 'hi'
): string {
  const isOweUs = balance > 0;
  const absAmount = Math.abs(balance);
  const formattedAmt = `${profile.currencySymbol || '₹'} ${absAmount.toLocaleString('en-IN')}`;
  
  if (lang === 'hi') {
    let msg = `*नमस्ते ${account.name} जी!* 🙏\n`;
    if (profile.businessName) {
      msg += `(${profile.businessName})\n\n`;
    } else {
      msg += `\n`;
    }
    
    if (isOweUs) {
      msg += `आपके खाते का कुल बकाया हिसाब:\n`;
      msg += `💰 *कुल बकाया राशि: ${formattedAmt} (देने बाकी हैं)*\n\n`;
      msg += `कृपया समय पर भुगतान करने का कष्ट करें।\n`;
      if (profile.upiId) {
        msg += `📱 *UPI द्वारा तुरंत भुगतान करें:*\n`;
        msg += `UPI ID: \`${profile.upiId}\`\n`;
        msg += `या लिंक: https://upiqr.in/pay/${encodeURIComponent(profile.upiId)}?am=${absAmount}&cu=INR\n`;
      }
    } else if (balance < 0) {
      msg += `हमारे द्वारा आपको भुगतान करने हेतु बकाया राशि: *${formattedAmt}* है।\n`;
      msg += `हम जल्द ही आपका हिसाब चुकता कर देंगे।\n`;
    } else {
      msg += `आपका खाता पूर्णतः चुकता (Settled) है। कोई बकाया नहीं है। धन्यवाद!\n`;
    }
    
    msg += `\n_यह संदेश ${profile.businessName || profile.ownerName || 'लेन-देन डिजिटल खाता'} द्वारा भेजा गया है।_`;
    return msg;
  } else {
    let msg = `*Hello ${account.name}!* 🙏\n`;
    if (profile.businessName) {
      msg += `(${profile.businessName})\n\n`;
    } else {
      msg += `\n`;
    }
    
    if (isOweUs) {
      msg += `This is a friendly reminder regarding your outstanding khata balance:\n`;
      msg += `💰 *Total Pending Due: ${formattedAmt}*\n\n`;
      msg += `Kindly arrange for the payment at your earliest convenience.\n`;
      if (profile.upiId) {
        msg += `📱 *Pay directly via UPI:*\n`;
        msg += `UPI ID: \`${profile.upiId}\`\n`;
        msg += `Payment link: https://upiqr.in/pay/${encodeURIComponent(profile.upiId)}?am=${absAmount}&cu=INR\n`;
      }
    } else if (balance < 0) {
      msg += `Our pending balance to pay you is *${formattedAmt}*.\nWe will settle this shortly.\n`;
    } else {
      msg += `Your khata account is fully settled with ₹0 pending balance. Thank you!\n`;
    }
    
    msg += `\n_Sent via ${profile.businessName || profile.ownerName || 'Len Den Mobile Khata'}._`;
    return msg;
  }
}

export function exportToCSV(transactions: CalculatedTransaction[], accountName: string = 'All_Accounts'): void {
  const headers = ['Date', 'Account', 'Details / Narration', 'Received (Credit)', 'Paid (Debit)', 'Running Balance', 'Payment Mode'];
  
  const rows = transactions.map(t => [
    t.date,
    `"${(t.accountName || '').replace(/"/g, '""')}"`,
    `"${(t.details || '').replace(/"/g, '""')}"`,
    t.type === 'credit' ? t.amount : 0,
    t.type === 'debit' ? t.amount : 0,
    t.runningBalance,
    t.paymentMode || 'cash'
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
    + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Khata_Passbook_${accountName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
