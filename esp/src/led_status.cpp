#include "led_status.h"
#include <WiFi.h>
#include <Adafruit_NeoPixel.h>
#include "api_client.h"
#include "print_client.h"

// Onboard NeoPixel
#define LED_PIN 48
#define LED_COUNT 1

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

unsigned long lastStatusCheckTime = 0;
const unsigned long STATUS_CHECK_INTERVAL = 500;
const uint8_t BRIGHTNESS = 50;

void setLEDColor(uint8_t red, uint8_t green, uint8_t blue)
{
  strip.setPixelColor(0, strip.Color(red, green, blue));
  strip.show();
}

void ledStatusSetup()
{
  strip.begin();
  strip.show();

  setLEDColor(BRIGHTNESS, 0, 0); // Set initial state to red
  delay(100);
}

bool isWiFiConnected()
{
  return WiFi.status() == WL_CONNECTED;
}

void updateLEDStatus()
{
  unsigned long currentTime = millis();
  if (currentTime - lastStatusCheckTime < STATUS_CHECK_INTERVAL)
  {
    return;
  }
  lastStatusCheckTime = currentTime;

  if (!isWiFiConnected())
  {
    // No WiFi connection
    // -> Red
    setLEDColor(BRIGHTNESS, 0, 0);
  }
  else if (!isPrinterConnected())
  {
    // WiFi connected, no printer connection
    // -> Yellow
    setLEDColor(BRIGHTNESS, BRIGHTNESS, 0);
  }
  else
  {
    // Printer connected
    // -> Green
    setLEDColor(0, BRIGHTNESS, 0);
  }
}
