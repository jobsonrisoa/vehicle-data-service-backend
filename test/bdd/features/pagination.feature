Feature: Cursor-Based Pagination
  As an API consumer
  I want to paginate through large result sets
  So that I can efficiently retrieve data without overwhelming the client or server

  Background:
    Given the database contains 150 vehicle makes

  Scenario: First page of results
    When I query for the first 20 vehicle makes
    Then I should receive exactly 20 results
    And the pageInfo should have hasNextPage as true
    And the pageInfo should have hasPreviousPage as false
    And the startCursor should match the first result's cursor
    And the endCursor should match the last result's cursor

  Scenario: Middle page of results
    Given I am on page 3 of vehicle makes
    When I query for 20 vehicle makes using the cursor from page 2
    Then I should receive exactly 20 results
    And the pageInfo should have hasNextPage as true
    And the pageInfo should have hasPreviousPage as true
    And the results should be different from page 2

  Scenario: Last page of results
    Given I am on the last page of vehicle makes
    When I query for 20 vehicle makes using the cursor from the second-to-last page
    Then I should receive 10 results (remaining items)
    And the pageInfo should have hasNextPage as false
    And the pageInfo should have hasPreviousPage as true

  Scenario: Navigate backward through pages
    Given I have navigated to page 3
    When I use the startCursor and query for the last 20 items before it
    Then I should receive the results from page 2
    And the results should be in the correct order

  Scenario: Invalid cursor
    When I query with an invalid cursor "invalid-cursor-string"
    Then I should receive a 400 Bad Request error
    And the error message should indicate "Invalid cursor"

  Scenario: Request more items than exist
    Given there are 150 vehicle makes
    When I query for the first 200 vehicle makes
    Then I should receive exactly 150 results
    And the pageInfo should have hasNextPage as false
