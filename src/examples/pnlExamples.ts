/**
 * ESEMPI DI CALCOLI P&L CON IL NUOVO SISTEMA
 */

import { calculatePnL } from '../utils/tradeUtils';

console.log('=== ESEMPI DI CALCOLI P&L ===\n');

// Esempio 1: Trade Buy Profittevole
console.log('1. Trade Buy Profittevole:');
console.log('   Entry: $150.00, Exit: $155.00, Qty: 100, Fees: $2.50');
const profit1 = calculatePnL("Buy", 150.00, 155.00, 100, 2.50);
console.log(`   P&L: $${profit1.toFixed(2)}\n`); // (155-150)*100 - 2.50 = $497.50

// Esempio 2: Trade Buy in Perdita
console.log('2. Trade Buy in Perdita:');
console.log('   Entry: $150.00, Exit: $145.00, Qty: 100, Fees: $2.50');
const loss1 = calculatePnL("Buy", 150.00, 145.00, 100, 2.50);
console.log(`   P&L: $${loss1.toFixed(2)}\n`); // (145-150)*100 - 2.50 = -$502.50

// Esempio 3: Trade Sell Short Profittevole  
console.log('3. Trade Sell Short Profittevole:');
console.log('   Entry: $150.00, Exit: $145.00, Qty: 100, Fees: $2.50');
const profit2 = calculatePnL("Sell", 150.00, 145.00, 100, 2.50);
console.log(`   P&L: $${profit2.toFixed(2)}\n`); // (150-145)*100 - 2.50 = $497.50

// Esempio 4: Trade Sell Short in Perdita
console.log('4. Trade Sell Short in Perdita:');
console.log('   Entry: $150.00, Exit: $155.00, Qty: 100, Fees: $2.50');
const loss2 = calculatePnL("Sell", 150.00, 155.00, 100, 2.50);
console.log(`   P&L: $${loss2.toFixed(2)}\n`); // (150-155)*100 - 2.50 = -$502.50

// Esempio 5: Trade Grande Volume
console.log('5. Trade Grande Volume:');
console.log('   Entry: $2600.00, Exit: $2720.00, Qty: 5, Fees: $31.20');
const bigTrade = calculatePnL("Buy", 2600.00, 2720.00, 5, 31.20);
console.log(`   P&L: $${bigTrade.toFixed(2)}\n`); // (2720-2600)*5 - 31.20 = $568.80

console.log('=== FINE ESEMPI ===');
