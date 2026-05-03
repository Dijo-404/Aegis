import { describe, it, expect } from 'vitest';
import { analyzeTransactionHeuristically } from './txAnalyzer';
import type { TxDetails } from './txAnalyzer';

describe('txAnalyzer heuristics', () => {
  it('should return safe when no flags and known programs', () => {
    const details: TxDetails = {
      programs: ['System Program'],
      accounts: ['Account1', 'Account2'],
      flags: [],
      instructionHex: ['000000'],
      unknownPrograms: []
    };
    
    const analysis = analyzeTransactionHeuristically(details);
    expect(analysis.risk).toBe('safe');
    expect(analysis.flags).toContain('No suspicious patterns detected.');
  });

  it('should return warning on 1 flag', () => {
    const details: TxDetails = {
      programs: ['System Program'],
      accounts: [],
      flags: ['Approve instruction detected'],
      instructionHex: [],
      unknownPrograms: []
    };
    const analysis = analyzeTransactionHeuristically(details);
    expect(analysis.risk).toBe('warning');
  });

  it('should return warning on 1 unknown program', () => {
    const details: TxDetails = {
      programs: ['UnknownProgram'],
      accounts: [],
      flags: [],
      instructionHex: [],
      unknownPrograms: ['UnknownProgram']
    };
    const analysis = analyzeTransactionHeuristically(details);
    expect(analysis.risk).toBe('warning');
  });

  it('should return danger on multiple flags', () => {
    const details: TxDetails = {
      programs: ['System Program'],
      accounts: [],
      flags: ['Unlimited approve detected', 'Multiple signer instructions detected'],
      instructionHex: [],
      unknownPrograms: []
    };
    const analysis = analyzeTransactionHeuristically(details);
    expect(analysis.risk).toBe('danger');
    expect(analysis.flags).toHaveLength(2);
  });
});
