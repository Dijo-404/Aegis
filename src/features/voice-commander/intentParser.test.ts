import { describe, it, expect } from 'vitest';
import { parseIntent } from './intentParser';

describe('intentParser', () => {
  it('should parse a simple send command', () => {
    const result = parseIntent('send 1.5 SOL to 9xK3');
    expect(result).toEqual({
      action: 'send',
      amount: 1.5,
      token: 'SOL',
      recipient: '9xK3',
    });
  });

  it('should parse send command regardless of case', () => {
    const result = parseIntent('SEND 100 usdc TO wallet123');
    expect(result).toEqual({
      action: 'send',
      amount: 100,
      token: 'USDC',
      recipient: 'wallet123',
    });
  });

  it('should parse a query command for balance', () => {
    const result = parseIntent('what is my balance');
    expect(result).toEqual({ action: 'query', query: 'what is my balance' });
  });

  it('should parse recent transactions query', () => {
    const result = parseIntent('show my recent transactions');
    expect(result).toEqual({ action: 'query', query: 'show my recent transactions' });
  });

  it('should default to query on unknown input', () => {
    const result = parseIntent('hello world');
    expect(result).toEqual({ action: 'query', query: 'hello world' });
  });

  it('should handle empty input', () => {
    const result = parseIntent('   ');
    expect(result).toEqual({ action: 'query', query: '' });
  });
});
