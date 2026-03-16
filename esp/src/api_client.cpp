#include "api_client.h"
#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include "env.h"
#include "print_client.h"

using namespace websockets;

// WebSocket client and state management
WebsocketsClient websocketClient;
const String websocketUrlWithToken = websocketServerUrl + String("?token=") + String(websocketToken);
unsigned long websocketLastReconnectAttempt = 0;
const unsigned long websocketReconnectInterval = 3000;
unsigned long wifiLastReconnectAttempt = 0;
const unsigned long wifiReconnectInterval = 5000;
const unsigned long wifiInitialConnectTimeout = 5000;
bool webSocketIsConnected = false;

void onMessageCallback(WebsocketsMessage message)
{
  // Get raw binary data
  std::string rawData = message.rawData();
  size_t dataLength = rawData.length();
  
  Serial.printf("Received %d bytes of binary data\n", dataLength);

  std::vector<uint8_t> printData;
  
  // Convert binary data to vector
  for (size_t i = 0; i < dataLength; i++)
  {
    printData.push_back((uint8_t)rawData[i]);
  }

  triggerPrint(printData);
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
  Serial.printf("Connecting to WIFI SSID: %s\n", wifiSSID);
  WiFi.begin(wifiSSID, wifiPassword);
  WiFi.setAutoReconnect(true);

  unsigned long connectStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - connectStart < wifiInitialConnectTimeout)
  {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("\nWiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  }
  else
  {
    Serial.printf("\nWiFi connect timed out (status=%d). Continuing and retrying in loop.\n", WiFi.status());
  }

  websocketClient.onMessage(onMessageCallback);
  websocketClient.onEvent(onEventsCallback);

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
      WiFi.begin(wifiSSID, wifiPassword);
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

  if (webSocketIsConnected && websocketClient.available())
  {
    websocketClient.poll();
  }
}
