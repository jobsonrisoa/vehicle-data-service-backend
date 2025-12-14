import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';

let container: StartedRabbitMQContainer;

export async function setupTestRabbitMQ(): Promise<string> {
  container = await new RabbitMQContainer('rabbitmq:3.12-management-alpine').start();
  return container.getAmqpUrl();
}

export async function teardownTestRabbitMQ(): Promise<void> {
  if (container) {
    await container.stop();
  }
}
