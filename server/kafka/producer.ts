import { Kafka, Producer, Partitioners } from 'kafkajs';

let _producer: Producer | null = null;

function getKafka(): Kafka {
  return new Kafka({
    clientId: 'conflict-tracker-server',
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS!],
    ssl: true,
    sasl: {
      mechanism: 'plain',
      username: process.env.KAFKA_API_KEY!,
      password: process.env.KAFKA_API_SECRET!,
    },
  });
}

export async function getProducer(): Promise<Producer> {
  if (!_producer) {
    _producer = getKafka().producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
    await _producer.connect();
  }
  return _producer;
}

export async function publishUpdate(payload: {
  type: 'conflict:added' | 'conflict:updated' | 'conflict:deleted';
  data: unknown;
}): Promise<void> {
  if (!process.env.KAFKA_BOOTSTRAP_SERVERS) return;

  try {
    const producer = await getProducer();
    await producer.send({
      topic: 'conflict-updates',
      messages: [{ value: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }) }],
    });
  } catch (err) {
    console.error('[kafka-producer] failed to publish update:', err);
  }
}

export async function disconnectProducer(): Promise<void> {
  if (_producer) {
    await _producer.disconnect();
    _producer = null;
  }
}
