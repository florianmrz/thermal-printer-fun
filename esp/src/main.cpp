#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include "env.h"

using namespace websockets;

WebsocketsClient client;
const String websocketUrlWithToken = websocketServerUrl + String("?token=") + String(websocketToken);

void getPrintData()
{
  HTTPClient http;
  http.begin(apiServerBaseUrl);
  http.addHeader("Content-Type", "Content-Type: application/json");
  http.addHeader("Authorization", String("Bearer ") + String(apiToken));

  int httpResponseCode = http.GET();
  if (httpResponseCode > 0)
  {
    String payload = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Payload: ");
    Serial.println(payload);
  }
  else
  {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
}

void onMessageCallback(WebsocketsMessage message)
{
  Serial.print("Got Message: ");
  Serial.println(message.data());

  JsonDocument doc;
  deserializeJson(doc, message.data());
  const char *type = doc["type"];
  Serial.print("Message type: ");
  Serial.println(type);

  if (strcmp(type, "print") == 0)
  {
    getPrintData();
  }
}

void onEventsCallback(WebsocketsEvent event, String data)
{
  if (event == WebsocketsEvent::ConnectionOpened)
  {
    Serial.println("Connnection Opened");
  }
  else if (event == WebsocketsEvent::ConnectionClosed)
  {
    Serial.println("Connnection Closed");
    Serial.print("Close reason: ");
    Serial.print(client.getCloseReason());
    Serial.println(data);
    Serial.println("Reconnecting in 3 seconds...");
    delay(3000);
    client.connect(websocketUrlWithToken);
  }
  else if (event == WebsocketsEvent::GotPing)
  {
    Serial.println("Got a Ping!");
  }
  else if (event == WebsocketsEvent::GotPong)
  {
    Serial.println("Got a Pong!");
  }
}

void setup()
{
  Serial.begin(115200);

  delay(3000);

  Serial.println("\n=== ESP32-S3 Websocket Test ===");

  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(wifiSSID, wifiPassword);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.println(WiFi.SSID());
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Setup WebSocket callbacks
  client.onMessage(onMessageCallback);
  client.onEvent(onEventsCallback);

  // Connect to WebSocket server
  Serial.print("Connecting to WebSocket server: ");
  Serial.println(websocketServerUrl);

  client.connect(websocketUrlWithToken);

  // Send a message
  client.send("Hi Server!");
  // Send a ping
  client.ping();
}

void loop()
{
  client.poll();
}
