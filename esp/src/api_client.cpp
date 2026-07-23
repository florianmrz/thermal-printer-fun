#include "api_client.h"
#include <WiFi.h>
#include <WiFiMulti.h>
#include <ArduinoWebsockets.h>
#include "env.h"
#include "print_client.h"

using namespace websockets;

// WebSocket client and state management
WebsocketsClient websocketClient;
WiFiMulti wifiMulti;
const String websocketUrlWithToken = websocketServerUrl + String("?token=") + String(websocketToken);
unsigned long websocketLastReconnectAttempt = 0;
const unsigned long websocketReconnectInterval = 3000;
unsigned long wifiLastReconnectAttempt = 0;
const unsigned long wifiReconnectInterval = 5000;
const unsigned long wifiInitialConnectTimeout = 5000;
const unsigned long wifiReconnectConnectTimeout = 5000;  // Increased from 2000ms to give more time
const unsigned long wifiPollInterval = 500;
bool webSocketIsConnected = false;

// Print data queue to avoid blocking WebSocket callback
std::vector<std::vector<uint8_t>> printQueue;
const size_t MAX_PRINT_QUEUE = 10;

void registerConfiguredWifiNetworks()
{
  const size_t wifiNetworkCount = sizeof(wifiNetworks) / sizeof(wifiNetworks[0]);

  for (size_t networkIndex = 0; networkIndex < wifiNetworkCount; networkIndex++)
  {
    const WifiNetworkConfig &network = wifiNetworks[networkIndex];
    Serial.printf("Registering WIFI SSID: %s\n", network.ssid);
    wifiMulti.addAP(network.ssid, network.password);
  }
}

bool connectToAnyConfiguredWifi(unsigned long timeout)
{
  const size_t wifiNetworkCount = sizeof(wifiNetworks) / sizeof(wifiNetworks[0]);

  if (wifiNetworkCount == 0)
  {
    Serial.println("No WiFi networks configured.");
    return false;
  }

  Serial.println("Attempting WiFi connection...");

  unsigned long connectStart = millis();
  while (millis() - connectStart < timeout)
  {
    if (wifiMulti.run() == WL_CONNECTED)
    {
      Serial.println("\nWiFi connected");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
      return true;
    }

    delay(wifiPollInterval);
    Serial.print(".");
  }

  Serial.printf("\nWiFi connect timed out (status=%d).\n", WiFi.status());
  return false;
}

void onMessageCallback(WebsocketsMessage message)
{
  // Get raw binary data
  std::string rawData = message.rawData();
  size_t dataLength = rawData.length();
  
  Serial.printf("Received %d bytes of binary data\n", dataLength);

  // Only queue if there's room (don't overflow)
  if (printQueue.size() < MAX_PRINT_QUEUE)
  {
    std::vector<uint8_t> printData;
    for (size_t i = 0; i < dataLength; i++)
    {
      printData.push_back((uint8_t)rawData[i]);
    }
    printQueue.push_back(printData);
    Serial.printf("Queued print job (queue size: %d)\n", printQueue.size());
  }
  else
  {
    Serial.println("ERROR: Print queue full, dropping message!");
  }
}

void onEventsCallback(WebsocketsEvent event, String data)
{
  if (event == WebsocketsEvent::ConnectionOpened)
  {
    Serial.println("Connnection Opened");
    webSocketIsConnected = true;
  }
  else if (event == WebsocketsEvent::ConnectionClosed)
  {
    webSocketIsConnected = false;
    Serial.println("Connnection Closed");
    Serial.print("Close reason: ");
    Serial.println(websocketClient.getCloseReason());
  }
}

void apiClientSetup()
{
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  registerConfiguredWifiNetworks();
  connectToAnyConfiguredWifi(wifiInitialConnectTimeout);

  websocketClient.onMessage(onMessageCallback);
  websocketClient.onEvent(onEventsCallback);
  if (String(websocketServerUrl).startsWith("wss://"))
  {
    websocketClient.setCACert(websocketCaCert);
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    websocketClient.connect(websocketUrlWithToken);
  }
}

void apiClientLoop()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    unsigned long currentMillis = millis();
    if (currentMillis - wifiLastReconnectAttempt >= wifiReconnectInterval)
    {
      wifiLastReconnectAttempt = currentMillis;
      Serial.println("Attempting WiFi reconnection...");
      // Clear stale WiFi state before reconnecting
      WiFi.disconnect(false);
      delay(100);
      connectToAnyConfiguredWifi(wifiReconnectConnectTimeout);
    }
    webSocketIsConnected = false;
    return;
  }

  // Auto reconnect WebSocket
  if (WiFi.status() == WL_CONNECTED && !webSocketIsConnected)
  {
    unsigned long currentMillis = millis();
    if (currentMillis - websocketLastReconnectAttempt >= websocketReconnectInterval)
    {
      websocketLastReconnectAttempt = currentMillis;
      Serial.println("Attempting WebSocket reconnection...");
      websocketClient.connect(websocketUrlWithToken);
    }
  }

  // Poll WebSocket first to keep connection alive
  if (webSocketIsConnected && websocketClient.available())
  {
    websocketClient.poll();
  }

  // Process one queued print job per loop (non-blocking for WebSocket)
  if (!printQueue.empty())
  {
    std::vector<uint8_t> printData = printQueue.front();
    printQueue.erase(printQueue.begin());
    Serial.printf("Processing print job (queue size now: %d)\n", printQueue.size());
    triggerPrint(printData);
  }
}

bool isWebSocketConnected()
{
  return webSocketIsConnected;
}
