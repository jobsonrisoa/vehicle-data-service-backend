Feature: Error Handling
  As a system
  I want to handle errors gracefully
  So that users receive meaningful error messages and the system remains stable

  Background:
    Given the system is running
    And the database is available

  Scenario: Handle NHTSA API timeout
    Given the NHTSA API response time exceeds the timeout threshold
    When I trigger a data ingestion
    Then the system should timeout after 10 seconds
    And the system should retry the request
    And if all retries fail, the job status should be "FAILED"
    And the error should be logged with the timeout details

  Scenario: Handle invalid XML from NHTSA API
    Given the NHTSA API returns invalid XML
    When the system attempts to parse the response
    Then an XmlParseError should be thrown
    And the error message should indicate XML parsing failure
    And the ingestion job should be marked as "FAILED"
    And the original XML content should be logged for debugging

  Scenario: Handle database connection failure
    Given the database connection is lost
    When I execute a GraphQL query
    Then I should receive a 503 Service Unavailable error
    And the error message should be "Database connection unavailable"
    And the health check endpoint should report unhealthy

  Scenario: Handle RabbitMQ connection failure
    Given the RabbitMQ connection is lost
    When an event should be published
    Then the system should attempt to reconnect
    And if reconnection succeeds, the event should be published
    And if reconnection fails, the error should be logged
    And the application should continue functioning for non-event operations

  Scenario: Handle circuit breaker OPEN state
    Given the NHTSA API has failed 50% of requests over 5 attempts
    When the circuit breaker opens
    Then subsequent requests should fail immediately
    And the error should indicate "Circuit breaker is OPEN"
    When 30 seconds have passed
    Then the circuit breaker should transition to HALF_OPEN
    And a single test request should be attempted

  Scenario: Handle domain validation errors
    Given I have invalid vehicle make data with negative makeId
    When I attempt to create a VehicleMake entity
    Then a domain validation error should be thrown
    And the error message should indicate "makeId must be positive"
    And the invalid data should not be persisted

  Scenario: Handle duplicate data insertion
    Given a vehicle make with ID 440 already exists
    When I attempt to insert another make with ID 440
    Then a database constraint violation should occur
    And the operation should be rolled back
    And the existing data should remain unchanged
    And an appropriate error should be returned to the caller
