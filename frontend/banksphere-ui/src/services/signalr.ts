import * as signalR from '@microsoft/signalr';

let connection: signalR.HubConnection | null = null;

export const startSignalR = (
  token: string,
  onTransactionUpdated?: (data: any) => void,
  onFraudAlert?: (data: any) => void,
  onBalanceChanged?: (data: any) => void,
  onNotification?: (data: any) => void
) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/banking', {
      accessTokenFactory: () => token,
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect()
    .build();

  if (onTransactionUpdated) {
    connection.on('TransactionUpdated', onTransactionUpdated);
  }
  if (onFraudAlert) {
    connection.on('FraudAlertCreated', onFraudAlert);
  }
  if (onBalanceChanged) {
    connection.on('AccountBalanceChanged', onBalanceChanged);
  }
  if (onNotification) {
    connection.on('ReceiveNotification', onNotification);
  }

  connection
    .start()
    .then(() => {
      console.log('Connected to BankSphere SignalR Hub');
    })
    .catch((err) => {
      console.warn('SignalR connection failed (running in fallback mode):', err);
    });

  return connection;
};

export const stopSignalR = async () => {
  if (connection) {
    try {
      await connection.stop();
    } catch {
      // Ignore
    }
    connection = null;
  }
};
