import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  DomainException,
  ResourceConflictException,
  ResourceNotFoundException,
} from '@stitchlab-yvr/shared-contracts';
import { DomainExceptionFilter } from './domain-exception.filter';

describe('DomainExceptionFilter', () => {
  let reply: jest.Mock;
  let filter: DomainExceptionFilter;
  const response = Symbol('response');

  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    reply = jest.fn();
    filter = new DomainExceptionFilter({
      httpAdapter: { reply },
    } as unknown as HttpAdapterHost);
  });

  const statusOf = () => reply.mock.calls[0][2];
  const bodyOf = () => reply.mock.calls[0][1];

  it('maps a broken business rule to 400', () => {
    filter.catch(new DomainException('slug must not be empty.'), host);

    expect(statusOf()).toBe(HttpStatus.BAD_REQUEST);
    expect(bodyOf()).toEqual({
      statusCode: 400,
      message: 'slug must not be empty.',
      error: 'DomainException',
    });
  });

  it('maps a missing resource to 404', () => {
    filter.catch(new ResourceNotFoundException('product "x" does not exist.'), host);

    expect(statusOf()).toBe(HttpStatus.NOT_FOUND);
  });

  it('maps a conflicting state to 409', () => {
    filter.catch(new ResourceConflictException('slug already exists.'), host);

    expect(statusOf()).toBe(HttpStatus.CONFLICT);
  });

  // Die Reihenfolge der `instanceof`-Pruefungen ist entscheidend: beide
  // Spezialfaelle erben von `DomainException` und wuerden sonst als 400 enden.
  it('prefers the specific subclass over the base class', () => {
    filter.catch(new ResourceNotFoundException('gone'), host);

    expect(statusOf()).not.toBe(HttpStatus.BAD_REQUEST);
  });

  it('replies through the http adapter, not through express directly', () => {
    filter.catch(new DomainException('nope'), host);

    expect(reply).toHaveBeenCalledWith(response, expect.any(Object), 400);
  });
});
