import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@jest/globals';

let firstNumber: number;
let secondNumber: number;
let result: number;

Given('I have a number {int}', function (num: number) {
  firstNumber = num;
});

Given('I have another number {int}', function (num: number) {
  secondNumber = num;
});

When('I add them together', function () {
  result = firstNumber + secondNumber;
});

Then('the result should be {int}', function (expected: number) {
  expect(result).toBe(expected);
});
