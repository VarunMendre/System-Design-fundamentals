import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '../src/services/UserService';
import { TransactionService } from '../src/services/TransactionService';
import { InMemoryUserRepository } from '../src/repositories/InMemoryUserRepository';
import { InMemoryBankAccountRepository } from '../src/repositories/InMemoryBankAccountRepository';
import { InMemoryTransactionRepository } from '../src/repositories/InMemoryTransactionRepository';
import { ScryptPasswordHasher } from '../src/utils/PasswordHasher';
import { STARTING_BALANCE } from '../src/config/constants';
import { TransactionStatus } from '../src/domain/enums';
import { TransactionFactory } from '../src/factories/TransactionFactory';
import { BankAccount } from '../src/domain/BankAccount';

let users: InMemoryUserRepository;
let txnSvc: TransactionService;
let alice: number;
let bob: number;

beforeEach(() => {
  users = new InMemoryUserRepository();
  const userSvc = new UserService(users, new ScryptPasswordHasher());
  txnSvc = new TransactionService(users, new InMemoryBankAccountRepository(), new InMemoryTransactionRepository());
  alice = userSvc.register('9876543210', 'secret1').id;
  bob = userSvc.register('9876543211', 'secret2').id;
});

const bal = (id: number) => users.findById(id)!.balance;

describe('TransactionService.create', () => {
  it('creates a PENDING wallet txn and moves no money', () => {
    const t = txnSvc.createWallet(alice, bob, 50_000);
    expect(t.id).toBe(1);
    expect(t.status).toBe(TransactionStatus.PENDING);
    expect(bal(alice)).toBe(STARTING_BALANCE);
    expect(bal(bob)).toBe(STARTING_BALANCE);
  });

  it('rejects self-transfer, unknown users and bad amounts', () => {
    expect(() => txnSvc.createWallet(alice, alice, 100)).toThrow('yourself');
    expect(() => txnSvc.createWallet(alice, 99, 100)).toThrow('not found');
    expect(() => txnSvc.createWallet(99, bob, 100)).toThrow('not found');
    expect(() => txnSvc.createWallet(alice, bob, 0)).toThrow('positive');
    expect(() => txnSvc.createWallet(alice, bob, -5)).toThrow('positive');
    expect(() => txnSvc.createWallet(alice, bob, 10.5)).toThrow('positive');
  });

  it('creates a bank txn and reuses the same BankAccount', () => {
    const a = txnSvc.createBank(alice, '123456789012', 'hdfc0001234', 1000) as any;
    const b = txnSvc.createBank(bob, '123456789012', 'HDFC0001234', 2000) as any;
    expect(a.bankAccount.id).toBe(b.bankAccount.id);
    expect(a.bankAccount.ifsc).toBe('HDFC0001234');
  });

  it('rejects invalid bank details', () => {
    expect(() => txnSvc.createBank(alice, '123', 'HDFC0001234', 100)).toThrow('Account number');
    expect(() => txnSvc.createBank(alice, '123456789012', 'BAD', 100)).toThrow('IFSC');
  });
});

describe('Transaction domain behaviour', () => {
  it('wallet settle moves money from sender to receiver', () => {
    const t = TransactionFactory.wallet(alice, bob, 30_000);
    t.settle(users);
    expect(bal(alice)).toBe(STARTING_BALANCE - 30_000);
    expect(bal(bob)).toBe(STARTING_BALANCE + 30_000);
  });

  it('wallet settle with insufficient funds changes nothing', () => {
    const t = TransactionFactory.wallet(alice, bob, STARTING_BALANCE + 1);
    expect(() => t.settle(users)).toThrow('Insufficient');
    expect(bal(alice)).toBe(STARTING_BALANCE);
    expect(bal(bob)).toBe(STARTING_BALANCE);
  });

  it('wallet reverse undoes settle, and fails cleanly if receiver is short', () => {
    const t = TransactionFactory.wallet(alice, bob, 30_000);
    t.settle(users);
    t.reverse(users);
    expect(bal(alice)).toBe(STARTING_BALANCE);
    expect(bal(bob)).toBe(STARTING_BALANCE);

    t.settle(users);
    users.findById(bob)!.debit(bal(bob)); // bob spends everything
    expect(() => t.reverse(users)).toThrow('Receiver');
    expect(bal(alice)).toBe(STARTING_BALANCE - 30_000); // unchanged by the failed reverse
  });

  it('bank settle debits the sender and reverse credits back', () => {
    const t = TransactionFactory.bank(alice, new BankAccount('123456789012', 'HDFC0001234'), 20_000);
    t.settle(users);
    expect(bal(alice)).toBe(STARTING_BALANCE - 20_000);
    t.reverse(users);
    expect(bal(alice)).toBe(STARTING_BALANCE);
  });

  it('confirm and cancel only work from PENDING', () => {
    const t = TransactionFactory.wallet(alice, bob, 100);
    t.confirm();
    expect(() => t.confirm()).toThrow('already CONFIRMED');
    expect(() => t.cancel()).toThrow('already CONFIRMED');
  });

  it('only confirmed non-refund transactions are refundable', () => {
    const t = TransactionFactory.wallet(alice, bob, 100);
    expect(t.isRefundable()).toBe(false);
    t.confirm();
    expect(t.isRefundable()).toBe(true);
    expect(TransactionFactory.refund(t).isRefundable()).toBe(false);
  });

  it('refund involves both parties and settles by reversing the original', () => {
    const original = TransactionFactory.wallet(alice, bob, 30_000);
    original.settle(users);
    const refund = TransactionFactory.refund(original);
    expect(refund.involves(alice)).toBe(true);
    expect(refund.involves(bob)).toBe(true);
    refund.settle(users);
    expect(bal(alice)).toBe(STARTING_BALANCE);
    expect(() => refund.reverse()).toThrow('cannot be reversed');
  });
});