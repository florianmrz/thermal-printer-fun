#include "api_client.h"
#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "env.h"
#include "print_client.h"

WiFiMulti wifiMulti;
unsigned long wifiLastReconnectAttempt = 0;
const unsigned long wifiReconnectInterval = 5000;
const unsigned long wifiInitialConnectTimeout = 5000;
const unsigned long wifiReconnectConnectTimeout = 5000;
const unsigned long wifiPollInterval = 500;

// The server tells us how often to poll on every response, which lets the poll rate be tuned without
// reflashing the device. The bounds below keep an unexpected value from bricking the polling loop.
const unsigned long pollIntervalMinMs = 1000;
const unsigned long pollIntervalMaxMs = 120000;
const unsigned long pollIntervalDefaultMs = 10000;

// Separate backoff for when the server cannot be reached at all, so a broken server is not hammered.
const unsigned long pollErrorBackoffStartMs = 5000;
const unsigned long pollErrorBackoffMaxMs = 60000;

// A print job is streamed straight to the printer, so its size is not bound by the heap. This only
// guards against a download that stops making progress.
const unsigned long jobDownloadTimeoutMs = 15000;

unsigned long pollIntervalMs = pollIntervalDefaultMs;
unsigned long pollErrorBackoffMs = 0;
unsigned long lastPollAt = 0;
bool apiIsReachable = false;

WiFiClientSecure secureClient;
WiFiClient plainClient;
HTTPClient http;

bool apiUsesTls()
{
  return String(apiBaseUrl).startsWith("https://");
}

WiFiClient &getNetworkClient()
{
  return apiUsesTls() ? (WiFiClient &)secureClient : plainClient;
}

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

/**
 * Applies the poll interval the server asked for, clamped to a sane range. Anything unparseable
 * falls back to the default so a bad response cannot silently stop the printer from polling.
 */
void applyPollInterval(const String &headerValue)
{
  long requestedInterval = headerValue.toInt();

  if (requestedInterval <= 0)
  {
    Serial.println("Missing or invalid poll interval in response, using default.");
    pollIntervalMs = pollIntervalDefaultMs;
    return;
  }

  if ((unsigned long)requestedInterval < pollIntervalMinMs)
  {
    requestedInterval = pollIntervalMinMs;
  }
  else if ((unsigned long)requestedInterval > pollIntervalMaxMs)
  {
    requestedInterval = pollIntervalMaxMs;
  }

  pollIntervalMs = (unsigned long)requestedInterval;
}

void onPollFailed()
{
  apiIsReachable = false;
  pollErrorBackoffMs = pollErrorBackoffMs == 0
                           ? pollErrorBackoffStartMs
                           : min(pollErrorBackoffMs * 2, pollErrorBackoffMaxMs);
  Serial.printf("Poll failed, retrying in %lums\n", pollErrorBackoffMs);
}

/**
 * Streams the response body straight to the printer in fixed size chunks. Nothing is buffered, so
 * the memory needed to print does not depend on the size of the job, and printing starts while the
 * job is still downloading.
 *
 * Returns false if the job was cut short, which leaves a torn receipt rather than no receipt. That
 * is the accepted failure mode here.
 */
bool streamJobToPrinter(int contentLength)
{
  if (contentLength <= 0)
  {
    Serial.println("Job response has no content length, skipping.");
    return false;
  }

  if (!isPrinterConnected())
  {
    Serial.println("✗ No printer connected, dropping job.");
    return false;
  }

  WiFiClient *stream = http.getStreamPtr();
  static uint8_t chunk[usbChunkBytes];
  size_t received = 0;
  unsigned long lastDataAt = millis();

  while (received < (size_t)contentLength)
  {
    if (millis() - lastDataAt >= jobDownloadTimeoutMs)
    {
      Serial.printf("Job download stalled at %u/%d bytes, aborting.\n", received, contentLength);
      return false;
    }

    size_t available = stream->available();
    if (available == 0)
    {
      delay(1);
      continue;
    }

    size_t toRead = min(min(available, sizeof(chunk)), (size_t)contentLength - received);
    int read = stream->readBytes(chunk, toRead);
    if (read <= 0)
    {
      continue;
    }

    lastDataAt = millis();

    if (!printChunk(chunk, read))
    {
      Serial.printf("Printing failed at %u/%d bytes, aborting.\n", received, contentLength);
      return false;
    }

    received += read;
  }

  return true;
}

/**
 * Polls the API once. The same request reports our state to the server and picks up at most one
 * print job. Jobs are delivered at most once, a job lost to a dropped connection is simply gone.
 */
void pollApi()
{
  String url = String(apiBaseUrl) + "/api/printer/poll?usbReady=" + (isPrinterConnected() ? "1" : "0") +
               "&rssi=" + String(WiFi.RSSI()) +
               "&freeHeap=" + String(ESP.getFreeHeap());

  if (!http.begin(getNetworkClient(), url))
  {
    Serial.println("Failed to start the poll request.");
    onPollFailed();
    return;
  }

  http.addHeader("Authorization", String("Bearer ") + printerToken);
  const char *collectedHeaders[] = {"X-Poll-Interval-Ms", "X-Job-Id"};
  http.collectHeaders(collectedHeaders, 2);

  int statusCode = http.GET();

  if (statusCode <= 0)
  {
    Serial.printf("Poll request error: %s\n", http.errorToString(statusCode).c_str());
    http.end();
    onPollFailed();
    return;
  }

  // The server was reached, so the connection is healthy even if there is nothing to print.
  apiIsReachable = true;
  pollErrorBackoffMs = 0;
  applyPollInterval(http.header("X-Poll-Interval-Ms"));

  if (statusCode == HTTP_CODE_NO_CONTENT)
  {
    http.end();
    return;
  }

  if (statusCode != HTTP_CODE_OK)
  {
    Serial.printf("Unexpected poll status: %d\n", statusCode);
    http.end();
    return;
  }

  String jobId = http.header("X-Job-Id");
  int contentLength = http.getSize();
  Serial.printf("Received print job %s (%d bytes)\n", jobId.c_str(), contentLength);

  // The body has to stay open while it is being printed, so this runs before the connection is
  // released. A job that fails partway is closed off with a cut so the next print starts clean.
  if (!streamJobToPrinter(contentLength))
  {
    printCut();
  }

  // Aborting leaves unread bytes on the socket, which makes HTTPClient drop the kept alive
  // connection instead of reusing it for the next poll.
  http.end();
}

void apiClientSetup()
{
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false); // Keep the radio awake; ESP is USB powered and modem sleep is a common source of dropped packets.
  WiFi.setAutoReconnect(true);
  registerConfiguredWifiNetworks();
  connectToAnyConfiguredWifi(wifiInitialConnectTimeout);

  if (apiUsesTls())
  {
    // Encrypt the connection but skip certificate verification. The server's certificate does not
    // have to be pinned here, which keeps the firmware working across hosting and certificate
    // changes we cannot easily reflash for.
    secureClient.setInsecure();
  }

  // Keep the connection alive between polls so we do not pay for a new TLS handshake every time.
  http.setReuse(true);
  http.setConnectTimeout(8000);
  http.setTimeout(10000);
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
    apiIsReachable = false;
    return;
  }

  unsigned long currentMillis = millis();
  unsigned long waitMs = pollErrorBackoffMs > 0 ? pollErrorBackoffMs : pollIntervalMs;

  // Printing blocks this loop, so a long job simply delays the next poll instead of dropping it.
  if (currentMillis - lastPollAt < waitMs)
  {
    return;
  }

  lastPollAt = currentMillis;
  pollApi();
}

bool isApiReachable()
{
  return apiIsReachable;
}
