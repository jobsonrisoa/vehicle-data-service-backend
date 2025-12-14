describe('Sample Unit Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  describe('nested suite', () => {
    it('should also pass', () => {
      expect(true).toBeTruthy();
    });
  });
});
