import { DomainError } from './domain-error';

export class XmlParseError extends DomainError {
  constructor(message: string, public readonly cause?: Error) {
    super(message, 'XML_PARSE_ERROR');
  }
}

