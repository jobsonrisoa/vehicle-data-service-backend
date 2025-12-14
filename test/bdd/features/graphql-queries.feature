Feature: GraphQL Vehicle Queries
  As an API consumer
  I want to query vehicle data via GraphQL
  So that I can build applications with accurate vehicle information

  Background:
    Given the database contains vehicle data
    And there are 100 vehicle makes in the database
    And each make has at least one vehicle type

  Scenario: Query all vehicle makes with default pagination
    When I execute the following GraphQL query:
      """
      query {
        vehicleMakes(first: 10) {
          edges {
            node {
              id
              makeId
              makeName
            }
            cursor
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
      """
    Then the response should be successful
    And I should receive 10 vehicle makes
    And each make should have an id, makeId, and makeName
    And the pageInfo should indicate hasNextPage is true
    And the pageInfo should indicate hasPreviousPage is false
    And the totalCount should be 100

  Scenario: Query vehicle make with nested vehicle types
    Given a vehicle make "ASTON MARTIN" with ID 440 exists
    And the make has 2 vehicle types
    When I execute the following GraphQL query:
      """
      query {
        vehicleMake(makeId: 440) {
          makeId
          makeName
          vehicleTypes {
            typeId
            typeName
          }
        }
      }
      """
    Then the response should be successful
    And the make should have makeId 440
    And the make should have makeName "ASTON MARTIN"
    And the make should have 2 vehicle types
    And each vehicle type should have typeId and typeName

  Scenario: Filter vehicle makes by name
    Given vehicle makes contain "FORD", "FORD MOTOR COMPANY", and "BMW"
    When I execute the following GraphQL query:
      """
      query {
        vehicleMakes(filter: { makeName: "FORD" }) {
          edges {
            node {
              makeName
            }
          }
        }
      }
      """
    Then the response should be successful
    And all returned makes should contain "FORD" in the name
    And the make "BMW" should not be in the results

  Scenario: Query non-existent vehicle make
    When I execute the following GraphQL query:
      """
      query {
        vehicleMake(makeId: 99999) {
          makeId
        }
      }
      """
    Then the response should be successful
    And the result should be null
    And no error should be thrown

  Scenario: Navigate pages using cursor
    When I query for the first 10 vehicle makes
    And I capture the endCursor from the response
    And I query for the next 10 vehicle makes using the captured cursor
    Then I should receive 10 different vehicle makes
    And the results should not overlap with the previous page
    And the vehicle makes should be in the correct order

  Scenario: Query with invalid field
    When I execute a GraphQL query with an invalid field "invalidField"
    Then I should receive a 400 Bad Request error
    And the error message should contain "Cannot query field"

  Scenario: Exceed query complexity limit
    When I execute a GraphQL query with complexity exceeding 1000
    Then I should receive a 400 Bad Request error
    And the error message should contain "exceeds maximum complexity"

  Scenario: Exceed query depth limit
    When I execute a GraphQL query with depth exceeding 10
    Then I should receive a 400 Bad Request error
    And the error message should contain "exceeds maximum depth"
