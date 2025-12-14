Feature: Vehicle Data Ingestion
  As a system administrator
  I want to ingest vehicle data from NHTSA API
  So that users can query up-to-date vehicle makes and types

  Background:
    Given the NHTSA API is available
    And the database is empty
    And no ingestion job is currently running

  Scenario: Successful data ingestion
    When I trigger the data ingestion process
    Then the ingestion job status should be "IN_PROGRESS"
    And I should receive a job ID
    When I wait for the ingestion to complete
    Then the ingestion job status should be "COMPLETED"
    And all vehicle makes should be fetched from NHTSA
    And vehicle types should be fetched for each make
    And the data should be persisted to the database
    And an "IngestionCompleted" event should be published to RabbitMQ

  Scenario: Partial failure during ingestion
    Given the NHTSA API returns an error for make ID 500
    And the NHTSA API returns success for other makes
    When I trigger the data ingestion process
    And I wait for the ingestion to complete
    Then the ingestion job status should be "PARTIALLY_COMPLETED"
    And the ingestion should continue for successful makes
    And the failed make should be recorded in the job errors
    And the error should include the make ID and error message
    And successful makes should be persisted to the database

  Scenario: Complete failure during ingestion
    Given the NHTSA API is unavailable
    When I trigger the data ingestion process
    Then the system should retry 3 times with exponential backoff
    And the retry delays should be 1 second, 2 seconds, and 4 seconds
    When all retries fail
    Then the ingestion job status should be "FAILED"
    And an "IngestionFailed" event should be published to RabbitMQ
    And the error details should be stored in the job record

  Scenario: Prevent concurrent ingestion
    Given an ingestion job is already running
    When I trigger another data ingestion
    Then I should receive a 409 Conflict error
    And the error message should be "An ingestion job is already in progress"
    And the new job should not be created
    And the existing job should continue running

  Scenario: Query ingestion status
    Given I have triggered a data ingestion
    When I query the ingestion status endpoint
    Then I should receive the current job status
    And the response should include the job ID
    And the response should include the start time
    And if completed, the response should include the completion time

  Scenario: Query specific ingestion job
    Given I have completed an ingestion job with ID "abc-123"
    When I query for job "abc-123"
    Then I should receive the job details
    And the details should include status, start time, and completion time
    And if the job had errors, the error details should be included

  Scenario: Query non-existent job
    When I query for job "non-existent-id"
    Then I should receive a 404 Not Found error
    And the error message should be "Ingestion job not found"
