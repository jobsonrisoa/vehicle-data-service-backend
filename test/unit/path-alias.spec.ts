import { sample } from '@core/sample';

describe('path alias', () => {
  it('resolves @core sample export', () => {
    expect(sample()).toBe('ok');
  });
});
