import { DomainException } from './contracts.js';

describe('DomainException', () => {
  it('is an Error carrying its message and class name', () => {
    const err = new DomainException('slug must not be empty.');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DomainException);
    expect(err.name).toBe('DomainException');
    expect(err.message).toBe('slug must not be empty.');
  });
});
