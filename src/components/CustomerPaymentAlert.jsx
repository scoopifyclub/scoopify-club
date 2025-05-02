import React from 'react';

export default function CustomerPaymentAlert({ hasFailedPayment, onUpdatePayment, onRetry }) {
  if (!hasFailedPayment) return null;
  return (
    <div style={{background:'#f56565',color:'#fff',padding:'1em',borderRadius:8,marginBottom:16}}>
      <strong>Your payment failed.</strong> Please update your payment information or contact support.<br/>
      <button onClick={onUpdatePayment} style={{margin:'0.5em',padding:'0.5em 1em'}}>Update Payment</button>
      <button onClick={onRetry} style={{margin:'0.5em',padding:'0.5em 1em'}}>Retry Payment</button>
    </div>
  );
}
